import { useEffect, useRef, useState } from 'react';
import { ArrowUpRight, Loader2, Terminal } from 'lucide-react';
import { QUICK_ACTIONS, respond } from '@/lib/agentEngine';
import AgentEntry from '@/components/dashboard/AgentEntry';

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
let seq = 0;
const nextId = () => {
  seq += 1;
  return `e-${seq}`;
};

export default function AgentTerminal() {
  const [entries, setEntries] = useState([]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const scrollRef = useRef(null);
  const booted = useRef(false);

  useEffect(() => {
    if (booted.current) return;
    booted.current = true;
    runQuery('CISO 3-Sentence Summary');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
  }, [entries]);

  async function runQuery(rawText) {
    const text = String(rawText || '').trim();
    if (!text || busy) return;

    setBusy(true);
    setInput('');

    const result = respond(text);
    const agentId = nextId();
    setEntries((prev) => [
      ...prev,
      { id: nextId(), kind: 'query', text },
      { id: agentId, kind: 'agent', toolCalls: [], answer: null, pending: true },
    ]);

    for (let i = 0; i < result.toolCalls.length; i += 1) {
      await sleep(170);
      const call = result.toolCalls[i];
      setEntries((prev) =>
        prev.map((entry) => (entry.id === agentId ? { ...entry, toolCalls: [...entry.toolCalls, call] } : entry)),
      );
    }

    await sleep(260);
    setEntries((prev) =>
      prev.map((entry) => (entry.id === agentId ? { ...entry, pending: false, answer: result.answer } : entry)),
    );
    setBusy(false);
  }

  return (
    <div className="flex h-[660px] flex-col overflow-hidden rounded-2xl border border-intel-line/80 bg-intel-panel/60 xl:h-[calc(100vh-268px)] xl:min-h-[620px]">
      <div className="flex items-center justify-between gap-3 border-b border-intel-line/70 bg-intel-panel2/50 px-4 py-3">
        <div className="flex items-center gap-2.5">
          <Terminal className="h-4 w-4 text-intel-jade" strokeWidth={1.9} />
          <div className="leading-tight">
            <p className="text-[12.5px] font-semibold tracking-tight text-intel-text">Agent Query Terminal</p>
            <p className="font-mono text-[9.5px] uppercase tracking-[0.16em] text-intel-faint">
              Deterministic tool routing
            </p>
          </div>
        </div>
        <span className="flex items-center gap-1.5 rounded-full border border-intel-line bg-intel-void/70 px-2.5 py-1">
          <span className="h-1.5 w-1.5 rounded-full bg-intel-jade" />
          <span className="font-mono text-[9.5px] uppercase tracking-[0.14em] text-intel-dim">Grounded</span>
        </span>
      </div>

      <div ref={scrollRef} className="intel-scroll flex-1 space-y-4 overflow-y-auto px-4 py-4">
        {entries.map((entry) => (
          <AgentEntry key={entry.id} entry={entry} />
        ))}
      </div>

      <div className="border-t border-intel-line/70 bg-intel-void/50 px-3.5 py-3">
        <p className="mb-2 font-mono text-[9px] uppercase tracking-[0.18em] text-intel-faint">Quick actions</p>
        <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
          {QUICK_ACTIONS.map((action) => (
            <button
              key={action.id}
              type="button"
              disabled={busy}
              onClick={() => runQuery(action.label)}
              className="group flex items-center justify-between gap-2 rounded-lg border border-intel-line/80 bg-intel-panel2/50 px-2.5 py-2 text-left text-[11px] font-medium text-intel-dim transition-all duration-200 hover:border-intel-jade/35 hover:bg-intel-jade/[0.06] hover:text-intel-text disabled:cursor-not-allowed disabled:opacity-45"
            >
              <span className="leading-tight">{action.label}</span>
              <ArrowUpRight
                className="h-3 w-3 shrink-0 text-intel-faint transition-colors group-hover:text-intel-jade"
                strokeWidth={2.4}
              />
            </button>
          ))}
        </div>

        <form
          onSubmit={(event) => {
            event.preventDefault();
            runQuery(input);
          }}
          className="mt-2.5 flex items-center gap-2 rounded-xl border border-intel-line bg-intel-panel2/70 px-3 py-2 transition-colors focus-within:border-intel-jade/45"
        >
          <span className="font-mono text-[12px] text-intel-jade">›</span>
          <input
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder="Ask the fleet — e.g. Engineering stale scans, CVE-2021-44228"
            aria-label="Query the exposure fleet"
            className="min-w-0 flex-1 bg-transparent font-mono text-[11.5px] text-intel-text placeholder:text-intel-faint focus:outline-none"
          />
          <button
            type="submit"
            disabled={busy || !input.trim()}
            className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-intel-jade/15 text-intel-jade transition-colors hover:bg-intel-jade/25 disabled:opacity-35"
            aria-label="Run query"
          >
            {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ArrowUpRight className="h-3.5 w-3.5" />}
          </button>
        </form>
      </div>
    </div>
  );
}