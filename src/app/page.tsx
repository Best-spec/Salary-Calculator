import WageTable from '@/components/WageTable';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function Home(props: { searchParams: Promise<{ start?: string; end?: string }> }) {
  const searchParams = await props.searchParams;
  
  const today = new Date();
  const pad = (n: number) => n.toString().padStart(2, '0');
  
  let startStr = `${today.getFullYear()}-${pad(today.getMonth() + 1)}-01`;
  let endStr = `${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate())}`;

  if (searchParams?.start && searchParams?.end) {
    startStr = searchParams.start;
    endStr = searchParams.end;
  }

  const [sy, sm, sd] = startStr.split('-').map(Number);
  const startDate = new Date(sy, sm - 1, sd);
  const [ey, em, ed] = endStr.split('-').map(Number);
  const endDate = new Date(ey, em - 1, ed);

  const defaultSettings = {
    dailyWage: 410.0,
    foodAllowance: 40.0,
    morningShiftExtra: 35.0,
    nightShiftExtra: 55.0,
    ssoRatePercent: 5.0,
  };

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

        <div className="bg-neutral-900/50 border border-neutral-800 rounded-2xl p-3 md:p-6 backdrop-blur-xl shadow-2xl overflow-hidden">
          <WageTable 
            key={`${startDate.toISOString()}-${endDate.toISOString()}`}
            initialSettings={defaultSettings} 
            initialLogs={[]} 
            startDate={startDate} 
            endDate={endDate} 
          />
        </div>
      </div>
    </main>
  );
}
