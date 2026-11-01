import { ChevronDown, ChevronRight } from 'lucide-react';
import { DEPARTMENTS } from '@/data/fleetData';
import { MAX_SCORE, formatScore } from '@/lib/riskEngine';

const CRIT_STYLE = {
  critical: 'border-intel-ember/40 bg-intel-ember/10 text-intel-ember',
  high: 'border-intel-amber/40 bg-intel-amber/10 text-intel-amber',
  medium: 'border-intel-cyan/40 bg-intel-cyan/10 text-intel-cyan',
  low: 'border-intel-line bg-intel-panel2 text-intel-dim',
};

function CriticalityBadge({ value }) {
  return (
    <span
      className={`inline-flex items-center rounded-md border px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-[0.12em] ${CRIT_STYLE[value]}`}
    >
      {value}
    </span>
  );
}

function KevBadge({ asset }) {
  if (!asset.kev) {
    return <span className="font-mono text-[10px] tracking-[0.06em] text-intel-faint">not in KEV</span>;
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-md border border-intel-ember/45 bg-intel-ember/[0.12] px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-[0.12em] text-intel-ember">
      <span className="h-1 w-1 rounded-full bg-intel-ember" />
      KEV
    </span>
  );
}

function HygieneBadge({ asset }) {
  if (asset.stale) {
    return (
      <span className="inline-flex items-center gap-1 rounded-md border border-intel-amber/45 bg-intel-amber/[0.1] px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-[0.1em] text-intel-amber">
        stale · {asset.scanAgeDays}d
      </span>
    );
  }
  return (
    <span className="inline-flex items-center rounded-md border border-intel-jade/30 bg-intel-jade/[0.07] px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-[0.1em] text-intel-jade/85">
      current · {asset.scanAgeDays}d
    </span>
  );
}

function ScoreCell({ asset }) {
  const width = Math.max(6, Math.round((asset.score / MAX_SCORE) * 100));
  const bar = asset.kev ? 'bg-intel-ember' : asset.stale ? 'bg-intel-amber' : 'bg-intel-cyan';
  return (
    <div className="flex flex-col items-end gap-1">
      <span className="font-mono text-[12.5px] font-semibold tabular text-intel-text">{formatScore(asset.score)}</span>
      <span className="h-[3px] w-14 overflow-hidden rounded-full bg-intel-line">
        <span className={`block h-full rounded-full ${bar}`} style={{ width: `${width}%` }} />
      </span>
    </div>
  );
}

export default function ExposureTable({ rows, department, onDepartmentChange, onSelect }) {
  const kevInView = rows.filter((row) => row.kev).length;

  return (
    <div className="flex h-[660px] flex-col overflow-hidden rounded-2xl border border-intel-line/80 bg-intel-panel/60 xl:h-[calc(100vh-268px)] xl:min-h-[620px]">
      <div className="flex flex-col gap-3 border-b border-intel-line/70 bg-intel-panel2/50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="leading-tight">
          <p className="text-[12.5px] font-semibold tracking-tight text-intel-text">Prioritized Fleet Exposure</p>
          <p className="font-mono text-[9.5px] uppercase tracking-[0.16em] text-intel-faint">
            {rows.length} assets · {kevInView} KEV · score desc
          </p>
        </div>
        <div className="relative">
          <select
            value={department}
            onChange={(event) => onDepartmentChange(event.target.value)}
            aria-label="Filter by business unit"
            className="w-full appearance-none rounded-lg border border-intel-line bg-intel-void/70 py-1.5 pl-3 pr-8 text-[11.5px] text-intel-text transition-colors hover:border-intel-jade/35 focus:border-intel-jade/50 focus:outline-none sm:w-44"
          >
            <option value="All">All business units</option>
            {DEPARTMENTS.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-intel-faint" />
        </div>
      </div>

      <div className="intel-scroll hidden flex-1 overflow-auto md:block">
        <table className="w-full min-w-[700px] border-collapse text-left">
          <thead className="sticky top-0 z-10 bg-intel-panel2/95 backdrop-blur">
            <tr className="font-mono text-[9px] uppercase tracking-[0.16em] text-intel-faint">
              <th className="px-4 py-2.5 font-medium">Asset ID</th>
              <th className="px-2 py-2.5 font-medium">Hostname</th>
              <th className="px-2 py-2.5 font-medium">Target Software / CVE</th>
              <th className="px-2 py-2.5 font-medium">Criticality</th>
              <th className="px-2 py-2.5 font-medium">CISA KEV</th>
              <th className="px-2 py-2.5 font-medium">Hygiene</th>
              <th className="px-4 py-2.5 text-right font-medium">Score</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((asset) => (
              <tr
                key={asset.id}
                onClick={() => onSelect(asset)}
                className="cursor-pointer border-t border-intel-line/50 transition-colors duration-150 hover:bg-intel-jade/[0.05]"
              >
                <td className="whitespace-nowrap px-4 py-2.5 font-mono text-[11px] font-medium text-intel-text">
                  {asset.id}
                </td>
                <td className="max-w-[150px] truncate px-2 py-2.5 font-mono text-[10.5px] text-intel-dim">
                  {asset.hostname}
                </td>
                <td className="px-2 py-2.5">
                  <p className="text-[11px] text-intel-text">
                    {asset.software} <span className="text-intel-faint">{asset.version}</span>
                  </p>
                  <p className="font-mono text-[10px] text-intel-cyan/80">{asset.cve}</p>
                </td>
                <td className="px-2 py-2.5">
                  <CriticalityBadge value={asset.criticality} />
                </td>
                <td className="px-2 py-2.5">
                  <KevBadge asset={asset} />
                </td>
                <td className="px-2 py-2.5">
                  <HygieneBadge asset={asset} />
                </td>
                <td className="px-4 py-2.5">
                  <ScoreCell asset={asset} />
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-[12px] text-intel-faint">
                  No assets in this business unit.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="intel-scroll flex-1 space-y-2 overflow-y-auto p-3 md:hidden">
        {rows.map((asset) => (
          <button
            key={asset.id}
            type="button"
            onClick={() => onSelect(asset)}
            className="w-full rounded-xl border border-intel-line/80 bg-intel-panel2/50 p-3 text-left transition-colors active:bg-intel-jade/[0.07]"
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="font-mono text-[11.5px] font-semibold text-intel-text">{asset.id}</p>
                <p className="font-mono text-[10px] text-intel-faint">{asset.hostname}</p>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="font-mono text-[14px] font-semibold tabular text-intel-text">
                  {formatScore(asset.score)}
                </span>
                <ChevronRight className="h-3.5 w-3.5 text-intel-faint" />
              </div>
            </div>
            <p className="mt-1.5 text-[11px] text-intel-dim">
              {asset.software} {asset.version} · <span className="font-mono text-intel-cyan/80">{asset.cve}</span>
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-1.5">
              <CriticalityBadge value={asset.criticality} />
              <KevBadge asset={asset} />
              <HygieneBadge asset={asset} />
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}