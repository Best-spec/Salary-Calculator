import { getSettings, getLogsInRange } from './actions/wageActions';
import WageTable from '@/components/WageTable';

export default async function Home(props: { searchParams: Promise<{ start?: string; end?: string }> }) {
  const searchParams = await props.searchParams;
  const settings = await getSettings();
  
  const today = new Date();
  
  let startDate = new Date(today.getFullYear(), today.getMonth(), 1);
  let endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0);

  if (searchParams?.start && searchParams?.end) {
    const [sy, sm, sd] = searchParams.start.split('-').map(Number);
    const [ey, em, ed] = searchParams.end.split('-').map(Number);
    startDate = new Date(sy, sm - 1, sd);
    endDate = new Date(ey, em - 1, ed);
  }

  const logs = await getLogsInRange(startDate, endDate);

  return (
    <main className="min-h-screen bg-neutral-950 text-neutral-100 p-4 md:p-8 font-sans selection:bg-indigo-500/30">
      <div className="max-w-6xl mx-auto space-y-8">
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">
              Salary Calculator
            </h1>
            <p className="text-neutral-400 mt-1">Track your daily earnings and overtime</p>
          </div>
        </header>

        <div className="bg-neutral-900/50 border border-neutral-800 rounded-2xl p-6 backdrop-blur-xl shadow-2xl">
          <WageTable 
            key={`${startDate.toISOString()}-${endDate.toISOString()}`}
            initialSettings={settings} 
            initialLogs={logs} 
            startDate={startDate} 
            endDate={endDate} 
          />
        </div>
      </div>
    </main>
  );
}
