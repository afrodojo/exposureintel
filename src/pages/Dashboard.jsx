import { useMemo, useState } from 'react';
import TopBar from '@/components/dashboard/TopBar';
import MetricCards from '@/components/dashboard/MetricCards';
import AgentTerminal from '@/components/dashboard/AgentTerminal';
import ExposureTable from '@/components/dashboard/ExposureTable';
import ProvenanceModal from '@/components/dashboard/ProvenanceModal';
import { FLEET, byDepartment, downloadManifest } from '@/lib/riskEngine';

export default function Dashboard() {
  const [department, setDepartment] = useState('All');
  const [selected, setSelected] = useState(null);

  const rows = useMemo(() => byDepartment(department), [department]);

  return (
    <div className="intel-canvas relative min-h-screen text-intel-text">
      <div className="pointer-events-none absolute inset-0 intel-grid-lines opacity-40" />
      <div className="relative">
        <TopBar onExport={() => downloadManifest(FLEET)} />

        <main className="mx-auto max-w-[1680px] px-4 pb-14 pt-5 sm:px-6 lg:px-8">
          <MetricCards />

          <div className="mt-5 grid grid-cols-1 gap-5 xl:grid-cols-12">
            <section className="xl:col-span-5 2xl:col-span-4">
              <AgentTerminal />
            </section>
            <section className="xl:col-span-7 2xl:col-span-8">
              <ExposureTable
                rows={rows}
                department={department}
                onDepartmentChange={setDepartment}
                onSelect={setSelected}
              />
            </section>
          </div>

          <p className="mt-4 font-mono text-[9.5px] uppercase tracking-[0.14em] text-intel-faint">
            ExposureIntel · deterministic scoring engine · CISA KEV v2026.10.12 · NIST NVD correlation · no model
            inference in any score
          </p>
        </main>
      </div>

      <ProvenanceModal asset={selected} onClose={() => setSelected(null)} />
    </div>
  );
}