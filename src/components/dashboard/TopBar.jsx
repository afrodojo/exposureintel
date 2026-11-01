import { CalendarClock, Download, ShieldCheck } from 'lucide-react';
import { BASELINE_SCAN_DATE, KEV_SYNC } from '@/data/fleetData';

export default function TopBar({ onExport }) {
  return (
    <header className="sticky top-0 z-30 border-b border-intel-line/70 bg-intel-void/85 backdrop-blur-xl">
      <div className="mx-auto flex max-w-[1680px] flex-col gap-3.5 px-4 py-3.5 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
        <div className="flex items-center gap-3">
          <div className="relative grid h-10 w-10 place-items-center rounded-xl border border-intel-jade/30 bg-gradient-to-br from-intel-jade/25 to-intel-cyan/10">
            <ShieldCheck className="h-5 w-5 text-intel-jade" strokeWidth={1.8} />
          </div>
          <div className="leading-tight">
            <p className="font-mono text-[9.5px] uppercase tracking-[0.3em] text-intel-faint">Acme Financial</p>
            <h1 className="text-[17px] font-semibold tracking-tight text-intel-text">
              Exposure<span className="text-intel-jade">Intel</span>
            </h1>
          </div>
          <span className="hidden h-8 w-px bg-intel-line lg:block" />
          <p className="hidden max-w-[220px] text-[11px] leading-snug text-intel-faint lg:block">
            Vulnerability exposure &amp; remediation prioritization
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-2 rounded-full border border-intel-jade/30 bg-intel-jade/[0.08] px-3 py-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-intel-jade animate-beacon" />
            <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-intel-jade">
              CISA KEV Sync
            </span>
            <span className="font-mono text-[10px] text-intel-jade/70">|</span>
            <span className="font-mono text-[10px] tracking-[0.1em] text-intel-jade/80">
              {KEV_SYNC.status.toUpperCase()} · v{KEV_SYNC.catalogVersion}
            </span>
          </div>

          <div className="flex items-center gap-2 rounded-full border border-intel-line bg-intel-panel/70 px-3 py-1.5">
            <CalendarClock className="h-3.5 w-3.5 text-intel-dim" strokeWidth={1.8} />
            <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-intel-dim">
              Baseline
            </span>
            <span className="font-mono text-[10.5px] tabular text-intel-text">{BASELINE_SCAN_DATE}</span>
          </div>

          <button
            type="button"
            onClick={onExport}
            className="group flex items-center gap-2 rounded-full bg-intel-jade px-4 py-2 text-[12px] font-semibold text-intel-void transition-all duration-200 hover:bg-[#3ce9b1] hover:shadow-[0_0_22px_-6px_rgba(47,214,160,0.7)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-intel-jade/60 focus-visible:ring-offset-2 focus-visible:ring-offset-intel-void"
          >
            <Download className="h-3.5 w-3.5" strokeWidth={2.2} />
            Export Manifest (.CSV)
          </button>
        </div>
      </div>
      <div className="intel-hairline h-px w-full" />
    </header>
  );
}