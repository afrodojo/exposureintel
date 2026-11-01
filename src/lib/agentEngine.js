import { DEPARTMENTS } from '@/data/fleetData';
import { FLEET, FLEET_STATS, TOTAL_EXPOSURE, byDepartment, formatScore, kevOverdueDays } from '@/lib/riskEngine';

const pct = (part, whole) => (whole ? Math.round((part / whole) * 1000) / 10 : 0);
const tool = (fn, args) => ({ fn, args });

export const QUICK_ACTIONS = [
  { id: 'ciso', label: 'CISO 3-Sentence Summary', icon: 'summary' },
  { id: 'patch', label: 'Monday Morning Patch Plan', icon: 'plan' },
  { id: 'highest', label: 'Highest-Risk Server & Why', icon: 'target' },
  { id: 'package', label: 'Max Exposure Reduction Package', icon: 'package' },
  { id: 'finance', label: 'Finance Department KEV Count', icon: 'count' },
  { id: 'stale', label: 'Stale Scans & Hygiene Warning', icon: 'hygiene' },
];

/* ---------- deterministic handlers ---------- */

function cisoSummary() {
  const top = FLEET[0];
  const kevAssets = FLEET.filter((a) => a.kev);
  return {
    toolCalls: [
      tool('load_fleet', `{ baseline: 2026-10-12 }`),
      tool('aggregate_exposure', `{ group_by: "cisa_kev" }`),
      tool('rank_assets', `{ order: "composite_score:desc", limit: 1 }`),
    ],
    answer: {
      headline: 'CISO summary — deterministic read of the 2026-10-12 baseline',
      paragraphs: [
        `Acme Financial tracks ${FLEET_STATS.total} production assets across ${FLEET_STATS.departments} business units, and ${FLEET_STATS.kev} of them carry CVEs that CISA lists as exploited in the wild, representing ${FLEET_STATS.kevShare}% of total fleet exposure.`,
        `The largest single exposure is ${top.id} (${top.hostname}) at a composite score of ${formatScore(top.score)} — ${top.vulnTitle} in ${top.software} ${top.version}, amplified because the last authenticated scan is ${top.scanAgeDays} days old.`,
        `Clearing the ${FLEET_STATS.kev} KEV-mapped assets removes ${formatScore(FLEET_STATS.kevExposure)} of ${formatScore(TOTAL_EXPOSURE)} total exposure and closes every binding due date, while ${FLEET_STATS.stale} stale assets need a fresh scan before their scores can be treated as verified.`,
      ],
      facts: [
        ['Assets in scope', String(FLEET_STATS.total)],
        ['KEV-mapped', String(FLEET_STATS.kev)],
        ['Stale scans', String(FLEET_STATS.stale)],
        ['Total exposure', formatScore(TOTAL_EXPOSURE)],
      ],
      footer: 'Scoring: CVSS x criticality weight x KEV multiplier x scan decay. No model inference.',
    },
  };
}

function patchPlan() {
  const targets = FLEET.filter((a) => a.kev);
  return {
    toolCalls: [
      tool('filter_assets', `{ cisa_kev: true }`),
      tool('sort_by', `{ field: "score", direction: "desc" }`),
      tool('attach_due_dates', `{ source: "cisa_binding" }`),
    ],
    answer: {
      headline: 'Monday morning patch plan — execution order',
      paragraphs: [
        `Sequence by composite score, not by department. ${targets.length} assets clear every CISA binding obligation and remove ${FLEET_STATS.kevShare}% of measurable exposure.`,
      ],
      bullets: targets.map(
        (a, i) =>
          `${i + 1}. ${a.id} · ${a.hostname} — score ${formatScore(a.score)} · ${a.cve} · CISA due ${
            a.kevDue
          } (${Math.abs(kevOverdueDays(a))}d overdue) · ${a.action}`,
      ),
      facts: [
        ['Window', 'Mon 08:00–12:00 ET'],
        ['Order', 'Score desc, then due date'],
        ['Rollback', 'Snapshot before patch'],
      ],
      footer: 'Block 1 covers internet-facing services; block 2 covers internal directory and monitoring tiers.',
    },
  };
}

function highestRisk() {
  const top = FLEET[0];
  const staleNote = top.stale
    ? `and the 1.15 decay penalty applies because the last scan is ${top.scanAgeDays} days old`
    : `and no decay penalty applies because the last scan is only ${top.scanAgeDays} days old`;
  return {
    toolCalls: [
      tool('rank_assets', `{ order: "score:desc", limit: 1 }`),
      tool('explain_score', `{ asset_id: "${top.id}" }`),
    ],
    answer: {
      headline: `Highest composite exposure: ${top.id}`,
      paragraphs: [
        `${top.hostname} (${top.ip}) in ${top.department} scores ${formatScore(
          top.score,
        )} — the highest in the fleet. It runs ${top.os} with ${top.software} ${top.version}, vulnerable to ${
          top.cve
        } (${top.vulnTitle}), CVSS ${top.cvss.toFixed(1)}.`,
        `Severity alone does not explain the rank: ${top.criticality} criticality gives a ${top.criticalityWeight.toFixed(
          2,
        )}x weight, CISA KEV membership applies a ${top.kevMultiplier.toFixed(2)}x multiplier, ${staleNote}.`,
        `The arithmetic is ${top.formula} = ${formatScore(top.score)}. ${top.action}`,
      ],
      facts: [
        ['CVSS base', top.cvss.toFixed(1)],
        ['Criticality weight', `${top.criticalityWeight.toFixed(2)}x`],
        ['KEV multiplier', `${top.kevMultiplier.toFixed(2)}x`],
        ['Decay penalty', `${top.decayPenalty.toFixed(2)}x`],
        ['Composite', `${formatScore(top.score)} / 100`],
      ],
      versionNote: top.versionNote,
    },
  };
}

function reductionPackage() {
  const ordered = FLEET.filter((a) => a.kev);
  const packageAssets = [];
  let removed = 0;
  for (const asset of ordered) {
    packageAssets.push(asset);
    removed += asset.score;
    if (removed / TOTAL_EXPOSURE >= 0.45) break;
  }
  const share = pct(removed, TOTAL_EXPOSURE);
  return {
    toolCalls: [
      tool('filter_assets', `{ cisa_kev: true }`),
      tool('greedy_exposure_reduction', `{ target_pct: 45 }`),
      tool('verify_superset', `{ covers_all_binding_due_dates: true }`),
    ],
    answer: {
      headline: `Max reduction package — ${packageAssets.length} assets, ${share}% of exposure`,
      paragraphs: [
        `Patching these ${packageAssets.length} KEV-mapped assets removes ${formatScore(
          removed,
        )} of ${formatScore(TOTAL_EXPOSURE)} total fleet exposure with zero scope left uncovered on the KEV set.`,
      ],
      bullets: packageAssets.map(
        (a) => `${a.id} · ${formatScore(a.score)} · ${a.cve} · ${a.department} · due ${a.kevDue}`,
      ),
      facts: [
        ['Assets in package', String(packageAssets.length)],
        ['Exposure removed', formatScore(removed)],
        ['Residual exposure', formatScore(TOTAL_EXPOSURE - removed)],
        ['Residual share', `${pct(TOTAL_EXPOSURE - removed, TOTAL_EXPOSURE)}%`],
      ],
      footer:
        'The residual is dominated by stale-scan assets whose true patch state is unverified — re-scan before treating it as accepted risk.',
    },
  };
}

function departmentKev(department) {
  const roster = byDepartment(department);
  const kevAssets = roster.filter((a) => a.kev);
  const exposure = roster.reduce((s, a) => s + a.score, 0);
  return {
    toolCalls: [
      tool('filter_assets', `{ department: "${department}" }`),
      tool('filter_assets', `{ cisa_kev: true }`),
      tool('count_by', `{ field: "cve" }`),
    ],
    answer: {
      headline: `${department}: ${kevAssets.length} KEV-mapped asset${kevAssets.length === 1 ? '' : 's'} of ${roster.length}`,
      paragraphs: [
        kevAssets.length
          ? `${department} holds ${kevAssets.length} of the fleet's ${FLEET_STATS.kev} KEV-mapped assets, contributing ${formatScore(
              kevAssets.reduce((s, a) => s + a.score, 0),
            )} of the department's ${formatScore(exposure)} exposure.`
          : `${department} holds no KEV-mapped assets; all ${roster.length} findings are non-KEV and rank below the fleet's binding obligations.`,
      ],
      bullets: kevAssets.map(
        (a) => `${a.id} · ${a.cve} · ${a.software} ${a.version} · score ${formatScore(a.score)} · due ${a.kevDue}`,
      ),
      facts: [
        ['Department assets', String(roster.length)],
        ['KEV assets', String(kevAssets.length)],
        ['Department exposure', formatScore(exposure)],
      ],
      footer: 'Counts are computed from the immutable asset records, not estimated.',
    },
  };
}

function staleReport() {
  const stale = FLEET.filter((a) => a.stale).sort((a, b) => b.scanAgeDays - a.scanAgeDays);
  const oldest = stale[0];
  return {
    toolCalls: [
      tool('filter_assets', `{ last_scan_older_than_days: 30 }`),
      tool('sort_by', `{ field: "scan_age_days", direction: "desc" }`),
      tool('apply_decay_penalty', `{ multiplier: 1.15 }`),
    ],
    answer: {
      headline: `Scan hygiene — ${stale.length} assets past the 30-day threshold`,
      paragraphs: [
        `Assets scanned before 2026-09-12 carry the 1.15 decay penalty, because their patch state cannot be verified against the current KEV catalog. ${oldest.id} is the worst case at ${oldest.scanAgeDays} days without a scan.`,
      ],
      bullets: stale
        .map((a) => `${a.id} · ${a.hostname} · last scan ${a.lastScan} · ${a.scanAgeDays}d · ${a.department}`),
      facts: [
        ['Threshold', '> 30 days'],
        ['Stale assets', String(stale.length)],
        ['Oldest scan', `${oldest.id} (${oldest.scanAgeDays}d)`],
      ],
      footer:
        'Stale telemetry inflates the score by design: unverified is treated as unpatched. Re-scan to confirm or clear.',
    },
  };
}

function departmentReport(department) {
  const roster = byDepartment(department);
  const exposure = roster.reduce((s, a) => s + a.score, 0);
  const top = roster[0];
  return {
    toolCalls: [
      tool('filter_assets', `{ department: "${department}" }`),
      tool('aggregate_exposure', `{ by: "department" }`),
    ],
    answer: {
      headline: `${department} — ${roster.length} assets, ${formatScore(exposure)} exposure`,
      paragraphs: [
        `${roster.filter((a) => a.kev).length} KEV-mapped and ${
          roster.filter((a) => a.stale).length
        } stale-scan assets. Highest scoring asset is ${top.id} at ${formatScore(top.score)}.`,
      ],
      bullets: roster.map((a) => `${a.id} · score ${formatScore(a.score)} · ${a.cve} · ${a.software} ${a.version}`),
      facts: [
        ['Assets', String(roster.length)],
        ['Exposure', formatScore(exposure)],
        ['KEV', String(roster.filter((a) => a.kev).length)],
        ['Stale', String(roster.filter((a) => a.stale).length)],
      ],
    },
  };
}

function assetLookup(term) {
  const q = term.toUpperCase();
  const matches = FLEET.filter(
    (a) =>
      a.id.toUpperCase().includes(q) ||
      a.cve.toUpperCase().includes(q) ||
      a.hostname.toUpperCase().includes(q) ||
      a.software.toUpperCase().includes(q),
  );
  if (!matches.length) return null;
  return {
    toolCalls: [tool('lookup_record', `{ term: "${term}" }`), tool('explain_score', `{ asset_id: "${matches[0].id}" }`)],
    answer: {
      headline:
        matches.length === 1
          ? `${matches[0].id} — score ${formatScore(matches[0].score)}`
          : `${matches.length} records match "${term}"`,
      paragraphs: matches.slice(0, 3).map(
        (a) =>
          `${a.id} · ${a.hostname} · ${a.software} ${a.version} · ${a.cve} · CVSS ${a.cvss.toFixed(1)} · ${
            a.kev ? 'CISA KEV' : 'not in KEV'
          } · scan ${a.lastScan} (${a.scanAgeDays}d) · ${a.formula} = ${formatScore(a.score)}`,
      ),
      bullets: matches.length > 3 ? matches.slice(3).map((a) => `${a.id} · score ${formatScore(a.score)} · ${a.cve}`) : [],
      facts: [['Matches', String(matches.length)]],
    },
  };
}

function fallback(query) {
  const top = FLEET[0];
  return {
    toolCalls: [tool('route_query', `{ unresolved: true }`), tool('rank_assets', `{ order: "score:desc", limit: 1 }`)],
    answer: {
      headline: 'No deterministic filter matched that phrasing',
      paragraphs: [
        `Queries are routed to fixed filters — department, CVE or asset identifier, KEV status, scan age, or exposure ranking. Nothing is inferred. The fleet's leading exposure is currently ${top.id} at ${formatScore(top.score)}.`,
      ],
      bullets: [
        'Try "Finance", "Operations KEV", "CVE-2021-44228", "stale scans", or "highest risk".',
        ...QUICK_ACTIONS.map((a) => `Quick action: ${a.label}`),
      ],
    },
  };
}

/* ---------- router ---------- */

export function respond(rawQuery) {
  const q = (rawQuery || '').toLowerCase().trim();
  if (!q) return fallback('');

  const department = DEPARTMENTS.find((d) => q.includes(d.toLowerCase()));

  if (/stale|hygiene|scan age|old scan|decay/.test(q)) return staleReport();
  if (/package|reduction|reduce|biggest win|cut exposure/.test(q)) return reductionPackage();
  if (/highest|riskiest|worst|top asset|most exposed/.test(q)) return highestRisk();
  if (/summary|ciso|exec|board|three sentence|3 sentence/.test(q)) return cisoSummary();
  if (/patch|remediat|plan|monday|fix order/.test(q)) return patchPlan();

  if (department && /kev|exploit/.test(q)) return departmentKev(department);
  if (/kev|exploit/.test(q)) return departmentKev('Finance');
  if (department) return departmentReport(department);

  const record = assetLookup(rawQuery.trim());
  if (record) return record;
  if (/how many|count|total/.test(q)) return cisoSummary();

  return fallback(rawQuery);
}