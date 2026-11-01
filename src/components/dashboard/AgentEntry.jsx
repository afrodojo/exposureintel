import { AlertTriangle, Check, Loader2 } from 'lucide-react';

export default function AgentEntry({ entry }) {
  if (entry.kind === 'query') {
    return (
      <div className="flex animate-fade-up justify-end">
        <div className="max-w-[88%] rounded-xl rounded-br-sm border border-intel-jade/25 bg-intel-jade/[0.07] px-3.5 py-2 text-[12.5px] leading-relaxed text-intel-text">
          {entry.text}
        </div>
      </div>
    );
  }

  const { toolCalls = [], answer, pending } = entry;

  return (
    <div className="animate-fade-up space-y-2.5">
      <div className="space-y-1.5">
        {toolCalls.map((call, i) => (
          <div
            key={`${call.fn}-${i}`}
            className="flex items-start gap-2 font-mono text-[10.5px] leading-relaxed text-intel-jade/90"
          >
            <Check className="mt-[3px] h-3 w-3 shrink-0" strokeWidth={2.6} />
            <span className="break-all">
              [TOOL INVOCATION: {call.fn}({call.args})]
            </span>
          </div>
        ))}
        {pending && (
          <div className="flex items-center gap-2 font-mono text-[10.5px] text-intel-faint">
            <Loader2 className="h-3 w-3 animate-spin" strokeWidth={2.4} />
            resolving deterministic tool chain…
          </div>
        )}
      </div>

      {answer && (
        <div className="rounded-xl border border-intel-line/80 bg-intel-panel2/70 p-3.5">
          <h4 className="text-[12.5px] font-semibold leading-snug tracking-tight text-intel-text">
            {answer.headline}
          </h4>

          {answer.paragraphs?.length > 0 && (
            <div className="mt-2 space-y-2">
              {answer.paragraphs.map((paragraph, i) => (
                <p key={i} className="text-[12px] leading-relaxed text-intel-dim">
                  {paragraph}
                </p>
              ))}
            </div>
          )}

          {answer.bullets?.length > 0 && (
            <ul className="mt-2.5 space-y-1.5 border-l border-intel-line pl-3">
              {answer.bullets.map((bullet, i) => (
                <li key={i} className="text-[11.5px] leading-relaxed text-intel-dim">
                  {bullet}
                </li>
              ))}
            </ul>
          )}

          {answer.facts?.length > 0 && (
            <dl className="mt-3 grid grid-cols-2 gap-2">
              {answer.facts.map(([label, value]) => (
                <div key={label} className="rounded-lg border border-intel-line/70 bg-intel-void/60 px-2.5 py-1.5">
                  <dt className="font-mono text-[9px] uppercase tracking-[0.14em] text-intel-faint">{label}</dt>
                  <dd className="mt-0.5 font-mono text-[11.5px] tabular text-intel-text">{value}</dd>
                </div>
              ))}
            </dl>
          )}

          {answer.versionNote && (
            <div className="mt-3 flex gap-2 rounded-lg border border-intel-amber/30 bg-intel-amber/[0.08] p-2.5">
              <AlertTriangle className="mt-[2px] h-3.5 w-3.5 shrink-0 text-intel-amber" strokeWidth={2} />
              <p className="text-[11px] leading-relaxed text-intel-amber/90">{answer.versionNote}</p>
            </div>
          )}

          {answer.footer && (
            <p className="mt-2.5 font-mono text-[10px] leading-relaxed text-intel-faint">{answer.footer}</p>
          )}
        </div>
      )}
    </div>
  );
}