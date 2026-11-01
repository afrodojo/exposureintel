import { AlertTriangle, Boxes, Fingerprint, ShieldAlert } from 'lucide-react';
import { FLEET_STATS } from '@/lib/riskEngine';

export default function MetricCards() {
  const cards = [
    {
      label: 'Total Assets',
      value: String(FLEET_STATS.total).padStart(2, '0'),
      caption: `${FLEET_STATS.departments} business units in scope`,
      icon: Boxes,
      tone: 'text-intel-cyan',
      ring: 'border-intel-cyan/25',
      glow: 'from-intel-cyan/15',
    },
    {
      label: 'CISA KEV Exploited',
      value: String(FLEET_STATS.kev).padStart(2, '0'),
      caption: `${FLEET_STATS.kevShare}% of total exposure`,
      icon: ShieldAlert,
      tone: 'text-intel-ember',
      ring: 'border-intel-ember/25',
      glow: 'from-intel-ember/15',
    },
    {
      label: 'Stale Scans (>30d)',
      value: String(FLEET_STATS.stale).padStart(2, '0'),
      caption: 'Decay penalty applied',
      icon: AlertTriangle,
      tone: 'text-intel-amber',
      ring: 'border-intel-amber/25',
      glow: 'from-intel-amber/15',
    },
    {
      label: 'Verification Confidence',
      value: '100%',
      caption: 'Deterministic arithmetic',
      icon: Fingerprint,
      tone: 'text-intel-jade',
      ring: 'border-intel-jade/25',
      glow: 'from-intel-jade/15',
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <div
            key={card.label}
            className={`group relative overflow-hidden rounded-2xl border ${card.ring} bg-intel-panel/60 p-4 transition-colors duration-300 hover:bg-intel-panel2/70 sm:p-5`}
          >
            <div
              className={`pointer-events-none absolute -right-10 -top-12 h-32 w-32 rounded-full bg-gradient-to-br ${card.glow} to-transparent blur-2xl`}
            />
            <div className="flex items-start justify-between gap-2">
              <p className="font-mono text-[9.5px] uppercase leading-tight tracking-[0.16em] text-intel-faint">
                {card.label}
              </p>
              <Icon className={`h-4 w-4 shrink-0 ${card.tone} opacity-70`} strokeWidth={1.8} />
            </div>
            <p className={`mt-2.5 text-[30px] font-semibold leading-none tabular tracking-tight ${card.tone} sm:text-[34px]`}>
              {card.value}
            </p>
            <p className="mt-2 text-[10.5px] leading-snug text-intel-dim">{card.caption}</p>
          </div>
        );
      })}
    </div>
  );
}