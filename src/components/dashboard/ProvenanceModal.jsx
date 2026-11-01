import { AlertTriangle, Fingerprint, ShieldAlert, Wrench } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { BASELINE_SCAN_DATE } from '@/data/fleetData';
import { formatScore, kevOverdueDays } from '@/lib/riskEngine';

function TriadField({ label, primary, secondary, tone }) {
  return (
    <div className="rounded-xl border border-intel-line/80 bg-intel-void/60 p-3">
      <p className="font-mono text-[9px] uppercase tracking-[0.16em] text-intel-faint">{label}</p>
      <p className={`mt-1 font-mono text-[12.5px] font-semibold leading-snug ${tone}`}>{primary}</p>
      <p className="mt-0.5 font-mono text-[10px] leading-snug text-intel-dim">{secondary}</p>
    </div>
  );
}

function DerivationRow({ label, value, muted }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-intel-line/40 py-1.5 last:border-b-0">
      <span className={`text-[11.5px] ${muted ? 'text-intel-faint' : 'text-intel-dim'}`}>{label}</span>
      <span className="font-mono text-[11.5px] tabular text-intel-text">{value}</span>
    </div>
  );
}

export default function ProvenanceModal({ asset, onClose }) {
  const overdue = asset ? kevOverdueDays(asset) : null;

  return (
    <Dialog open={Boolean(asset)} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[90vh] w-[calc(100%-2rem)] max-w-2xl overflow-y-auto border-intel-line bg-intel-panel p-0">
        {asset && (
          <div className="p-5 sm:p-6">
            <DialogHeader className="space-y-1 text-left">
              <div className="flex items-center gap-2">
                <Fingerprint className="h-4 w-4 text-intel-jade" strokeWidth={1.9} />
                <p className="font-mono text-[9.5px] uppercase tracking-[0.2em] text-intel-faint">
                  Provenance record · immutable triad
                </p>
              </div>
              <DialogTitle className="text-[17px] font-semibold tracking-tight text-intel-text">
                {asset.id}
              </DialogTitle>
              <DialogDescription className="font-mono text-[11px] text-intel-dim">
                {asset.hostname} · {asset.ip} · {asset.department} · {asset.os}
              </DialogDescription>
            </DialogHeader>

            <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-3">
              <TriadField label="Asset" primary={asset.id} secondary={`${asset.department} · ${asset.criticality}`} tone="text-intel-text" />
              <TriadField label="Software version" primary={`${asset.software} ${asset.version}`} secondary={asset.os} tone="text-intel-cyan" />
              <TriadField
                label="CVE / CISA binding due"
                primary={asset.cve}
                secondary={
                  asset.kev
                    ? `${asset.kevDue} · ${overdue > 0 ? `${overdue}d overdue` : 'within SLA'}`
                    : 'not on the KEV catalog'
                }
                tone={asset.kev ? 'text-intel-ember' : 'text-intel-text'}
              />
            </div>

            <p className="mt-3 rounded-lg border border-intel-line/70 bg-intel-panel2/50 p-2.5 text-[11.5px] leading-relaxed text-intel-dim">
              <span className="font-medium text-intel-text">{asset.vulnTitle}.</span> CVSS {asset.cvss.toFixed(1)} ·{' '}
              {asset.kev ? 'CISA KEV active' : 'not exploited per CISA KEV'} · last scan {asset.lastScan}
            </p>

            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-intel-line/80 bg-intel-panel2/40 p-3">
                <p className="font-mono text-[9px] uppercase tracking-[0.16em] text-intel-faint">Score derivation</p>
                <div className="mt-1.5">
                  <DerivationRow label="CVSS base" value={asset.cvss.toFixed(1)} />
                  <DerivationRow label={`Criticality (${asset.criticality})`} value={`${asset.criticalityWeight.toFixed(2)}x`} />
                  <DerivationRow label="KEV multiplier" value={`${asset.kevMultiplier.toFixed(2)}x`} />
                  <DerivationRow
                    label={asset.stale ? `Scan decay (${asset.scanAgeDays}d)` : 'Scan decay (fresh)'}
                    value={`${asset.decayPenalty.toFixed(2)}x`}
                  />
                  <div className="mt-1 flex items-center justify-between gap-3 rounded-lg bg-intel-jade/[0.08] px-2 py-1.5">
                    <span className="text-[11.5px] font-medium text-intel-text">Composite</span>
                    <span className="font-mono text-[12.5px] font-semibold tabular text-intel-jade">
                      {formatScore(asset.score)} / 100
                    </span>
                  </div>
                </div>
                <p className="mt-1.5 font-mono text-[9.5px] leading-relaxed text-intel-faint">
                  {asset.formula} — capped at 100.0, no estimation
                </p>
              </div>

              <div className="rounded-xl border border-intel-line/80 bg-intel-panel2/40 p-3">
                <div className="flex items-center gap-1.5">
                  <Wrench className="h-3 w-3 text-intel-jade" strokeWidth={2} />
                  <p className="font-mono text-[9px] uppercase tracking-[0.16em] text-intel-faint">Recommended remediation</p>
                </div>
                <p className="mt-1.5 text-[11.5px] leading-relaxed text-intel-dim">{asset.action}</p>
                <p className="mt-2 text-[11px] leading-relaxed text-intel-faint">
                  Re-scan the host after patching and confirm the finding clears in the next baseline pass
                  ({BASELINE_SCAN_DATE} cadence).
                </p>
                {asset.stale && (
                  <div className="mt-2 flex gap-2 rounded-lg border border-intel-amber/30 bg-intel-amber/[0.08] p-2">
                    <AlertTriangle className="mt-[1px] h-3.5 w-3.5 shrink-0 text-intel-amber" strokeWidth={2} />
                    <p className="text-[10.5px] leading-relaxed text-intel-amber/90">
                      Scan hygiene warning: telemetry is {asset.scanAgeDays} days old, so the 1.15 decay penalty is
                      applied and patch state is unverified.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {asset.versionNote && (
              <div className="mt-3 flex gap-2 rounded-xl border border-intel-cyan/25 bg-intel-cyan/[0.06] p-3">
                <ShieldAlert className="mt-[1px] h-3.5 w-3.5 shrink-0 text-intel-cyan" strokeWidth={2} />
                <div>
                  <p className="font-mono text-[9px] uppercase tracking-[0.16em] text-intel-cyan/80">
                    Version boundary
                  </p>
                  <p className="mt-1 text-[11px] leading-relaxed text-intel-dim">{asset.versionNote}</p>
                </div>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}