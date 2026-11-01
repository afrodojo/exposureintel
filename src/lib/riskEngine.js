import { differenceInCalendarDays, parseISO } from 'date-fns';
import {
  ASSETS,
  BASELINE_SCAN_DATE,
  CRITICALITY_WEIGHTS,
  SCORE_CAP,
  STALE_THRESHOLD_DAYS,
} from '@/data/fleetData';

const round2 = (n) => Math.round(n * 100) / 100;

export function daysSinceBaseline(dateStr) {
  if (!dateStr) return null;
  return differenceInCalendarDays(parseISO(BASELINE_SCAN_DATE), parseISO(dateStr));
}

/**
 * Deterministic composite risk score.
 *   CVSS x Criticality Weight x KEV Multiplier x Scan Decay Penalty, capped at 100.
 * No estimation, no model inference — identical inputs always yield an identical score.
 */
export function scoreAsset(asset) {
  const criticalityWeight = CRITICALITY_WEIGHTS[asset.criticality] ?? 1;
  const kevMultiplier = asset.kev ? 1.5 : 1;
  const scanAgeDays = daysSinceBaseline(asset.lastScan);
  const stale = scanAgeDays > STALE_THRESHOLD_DAYS;
  const decayPenalty = stale ? 1.15 : 1;
  const raw = asset.cvss * criticalityWeight * kevMultiplier * decayPenalty;

  return {
    criticalityWeight,
    kevMultiplier,
    decayPenalty,
    scanAgeDays,
    stale,
    raw: round2(raw),
    score: Math.min(SCORE_CAP, round2(raw)),
    formula: `${asset.cvss.toFixed(1)} x ${criticalityWeight.toFixed(2)} x ${kevMultiplier.toFixed(
      2,
    )} x ${decayPenalty.toFixed(2)}`,
  };
}

export const FLEET = ASSETS.map((asset) => ({ ...asset, ...scoreAsset(asset) })).sort(
  (a, b) => b.score - a.score || a.id.localeCompare(b.id),
);

export const MAX_SCORE = FLEET.reduce((m, a) => Math.max(m, a.score), 0);

export const TOTAL_EXPOSURE = round2(FLEET.reduce((sum, a) => sum + a.score, 0));

export const FLEET_STATS = {
  total: FLEET.length,
  kev: FLEET.filter((a) => a.kev).length,
  stale: FLEET.filter((a) => a.stale).length,
  kevExposure: round2(FLEET.filter((a) => a.kev).reduce((s, a) => s + a.score, 0)),
  totalExposure: TOTAL_EXPOSURE,
  kevShare: TOTAL_EXPOSURE
    ? Math.round((FLEET.filter((a) => a.kev).reduce((s, a) => s + a.score, 0) / TOTAL_EXPOSURE) * 1000) / 10
    : 0,
  departments: new Set(FLEET.map((a) => a.department)).size,
};

export function formatScore(n) {
  return n.toFixed(1);
}

export function kevOverdueDays(asset) {
  if (!asset.kevDue) return null;
  return daysSinceBaseline(asset.kevDue);
}

export function byDepartment(department) {
  if (!department || department === 'All') return FLEET;
  return FLEET.filter((a) => a.department === department);
}

export function departmentRoster() {
  const map = {};
  FLEET.forEach((a) => {
    map[a.department] = map[a.department] || { department: a.department, assets: 0, kev: 0, stale: 0, exposure: 0 };
    map[a.department].assets += 1;
    map[a.department].kev += a.kev ? 1 : 0;
    map[a.department].stale += a.stale ? 1 : 0;
    map[a.department].exposure = round2(map[a.department].exposure + a.score);
  });
  return Object.values(map).sort((a, b) => b.exposure - a.exposure);
}

const csvCell = (value) => {
  const s = String(value ?? '');
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

export function manifestCsv(rows = FLEET) {
  const header = [
    'Asset ID',
    'Hostname',
    'IP',
    'Department',
    'Criticality',
    'Software',
    'CVE ID',
    'CVSS',
    'CISA KEV',
    'Due Date',
    'Score',
    'Action',
  ];

  const lines = rows.map((a) =>
    [
      a.id,
      a.hostname,
      a.ip,
      a.department,
      a.criticality,
      `${a.software} ${a.version}`,
      a.cve,
      a.cvss.toFixed(1),
      a.kev ? 'YES' : 'NO',
      a.kevDue || 'n/a',
      formatScore(a.score),
      a.action,
    ]
      .map(csvCell)
      .join(','),
  );

  return [header.join(','), ...lines].join('\r\n');
}

export function downloadManifest(rows = FLEET) {
  const blob = new Blob([manifestCsv(rows)], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `exposureintel-manifest-${BASELINE_SCAN_DATE}.csv`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}