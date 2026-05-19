'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import { updateSettings, saveDailyLog, deleteDailyLog, deleteDailyLogById } from '@/app/actions/wageActions';
import { calculateDailyMetrics, ShiftType } from '@/utils/calculations';
import { Settings2, Save, Utensils, CalendarDays, CheckCircle2, Circle, XCircle, RefreshCw, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { useRouter } from 'next/navigation';

type Settings = {
  dailyWage: number;
  foodAllowance: number;
  morningShiftExtra: number;
  nightShiftExtra: number;
  ssoRatePercent: number;
};

type Log = {
  id: string;
  userId: string;
  dateStr: string;
  date?: Date;
  hasFood: boolean;
  otHours: number | string;
  shiftType: string | ShiftType;
};

export default function WageTable({
  initialSettings,
  initialLogs,
  startDate,
  endDate,
}: {
  initialSettings: Settings;
  initialLogs: Log[];
  startDate: Date;
  endDate: Date;
}) {
  const router = useRouter();
  const [settings, setSettings] = useState<Settings>(initialSettings);
  const [logs, setLogs] = useState<Log[]>(initialLogs);
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [isReloading, setIsReloading] = useState(false);
  const [processingDates, setProcessingDates] = useState<Set<number>>(new Set());

  type ToastType = { id: number; message: string; type: 'success' | 'error' };
  const [toasts, setToasts] = useState<ToastType[]>([]);

  const addToast = (message: string, type: 'success' | 'error' = 'success') => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLogs(initialLogs);
  }, [initialLogs]);

  const saveTimeouts = useRef<Record<string, NodeJS.Timeout>>({});

  const [startInput, setStartInput] = useState(format(startDate, 'yyyy-MM-dd'));
  const [endInput, setEndInput] = useState(format(endDate, 'yyyy-MM-dd'));

  const handleSettingsChange = (key: keyof Settings, value: string) => {
    setSettings((prev) => ({ ...prev, [key]: parseFloat(value) || 0 }));
  };

  const saveSettings = async () => {
    setIsSavingSettings(true);
    try {
      const res = await updateSettings(settings);
      if (res.success) {
        addToast('บันทึกการตั้งค่าลงฐานข้อมูลเรียบร้อย', 'success');
      } else {
        addToast(res.error || 'เกิดข้อผิดพลาดในการตั้งค่า', 'error');
      }
    } catch (e) {
      addToast('เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์', 'error');
    }
    setIsSavingSettings(false);
  };

  const applyDateRange = () => {
    if (startInput && endInput) {
      router.push(`/?start=${startInput}&end=${endInput}`);
    }
  };

  const setThisMonth = () => {
    const today = new Date();
    const start = format(new Date(today.getFullYear(), today.getMonth(), 1), 'yyyy-MM-dd');
    const end = format(new Date(today.getFullYear(), today.getMonth() + 1, 0), 'yyyy-MM-dd');
    setStartInput(start);
    setEndInput(end);
    router.push(`/?start=${start}&end=${end}`);
  };

  const reloadData = () => {
    setIsReloading(true);
    router.refresh();
    setTimeout(() => {
      setIsReloading(false);
      addToast('อัปเดตข้อมูลจากฐานข้อมูลล่าสุดแล้ว', 'success');
    }, 800);
  };

  const toggleWorkDay = async (date: Date, isWorking: boolean) => {
    const timeKey = date.getTime();
    if (processingDates.has(timeKey)) return;
    
    setProcessingDates(prev => {
      const next = new Set(prev);
      next.add(timeKey);
      return next;
    });

    // Use string for canonical matching
    const dateStr = format(date, 'yyyy-MM-dd');
    
    // Store old log for reverting
    const oldLog = logs.find((l) => l.dateStr === dateStr);

    try {
      if (isWorking) {
        setLogs((prev) => prev.filter((l) => l.dateStr !== dateStr));
        
        let res;
        if (oldLog && oldLog.id && oldLog.id !== 'mock-id') {
          res = await deleteDailyLogById(oldLog.id);
        } else {
          res = await deleteDailyLog(dateStr);
        }
        
        if (res.success) {
          addToast('ลบวันทำงานในฐานข้อมูลเรียบร้อย', 'success');
        } else {
          console.error("Failed to delete log:", res.error);
          addToast(res.error || 'ลบข้อมูลไม่สำเร็จ', 'error');
          // Revert state
          if (oldLog) setLogs(prev => [...prev, oldLog]);
        }
      } else {
        const newLog: Log = {
          id: 'mock-id',
          userId: 'mock',
          dateStr,
          hasFood: false,
          otHours: 0,
          shiftType: 'NONE',
        };
        setLogs((prev) => [...prev, newLog]);
        const res = await saveDailyLog(dateStr, { hasFood: false, otHours: 0, shiftType: 'NONE' });
        if (res.success) {
          addToast('เพิ่มวันทำงานในฐานข้อมูลเรียบร้อย', 'success');
        } else {
          console.error("Failed to save log:", res.error);
          addToast(res.error || 'เพิ่มข้อมูลไม่สำเร็จ', 'error');
          // Revert state
          setLogs((prev) => prev.filter((l) => l.dateStr !== dateStr));
        }
      }
    } catch (error: any) {
      console.error("Toggle work day error:", error);
      addToast(`เครือข่ายขัดข้อง: ${error?.message || String(error)}`, 'error');
      // Revert state
      if (isWorking && oldLog) {
        setLogs(prev => [...prev, oldLog]);
      } else if (!isWorking) {
        setLogs((prev) => prev.filter((l) => l.dateStr !== dateStr));
      }
    } finally {
      setProcessingDates(prev => {
        const next = new Set(prev);
        next.delete(timeKey);
        return next;
      });
    }
  };

  const updateLog = (date: Date, field: keyof Log, value: string | number | boolean) => {
    const dateStr = format(date, 'yyyy-MM-dd');

    setLogs((prev) => {
      return prev.map((l) => (l.dateStr === dateStr ? { ...l, [field]: value } : l));
    });

    const updatedLog = logs.find((l) => l.dateStr === dateStr) || {
      id: '', userId: '', dateStr, hasFood: false, otHours: 0, shiftType: 'NONE'
    };
    
    const key = dateStr;
    if (saveTimeouts.current[key]) clearTimeout(saveTimeouts.current[key]);
    
    saveTimeouts.current[key] = setTimeout(async () => {
      try {
        const res = await saveDailyLog(dateStr, { 
          hasFood: field === 'hasFood' ? (value as boolean) : updatedLog.hasFood, 
          otHours: parseFloat(String(field === 'otHours' ? value : updatedLog.otHours)) || 0, 
          shiftType: field === 'shiftType' ? (value as string) : (updatedLog.shiftType as string) 
        });
        if (res.success) {
          addToast('อัปเดตข้อมูลลงฐานข้อมูลเรียบร้อย', 'success');
        } else {
          console.error("Failed to update log:", res.error);
          addToast(res.error || 'เกิดข้อผิดพลาดในการอัปเดต', 'error');
        }
      } catch (error: any) {
        console.error("Update log error:", error);
        addToast(`เครือข่ายขัดข้อง: ${error?.message || String(error)}`, 'error');
      }
    }, 500);
  };

  const rows = useMemo(() => {
    const days = [];
    const d = new Date(startDate);
    d.setHours(0, 0, 0, 0);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    while (d <= end) {
      const current = new Date(d);
      const dateStr = format(current, 'yyyy-MM-dd');
      const log = logs.find((l) => l.dateStr === dateStr);
      
      let metrics = { totalExtras: 0, netBaseWage: 0, grandTotal: 0, ssoDeduction: 0, shiftAllowance: 0, actualFoodAllowance: 0, totalOtPay: 0 };
      if (log) {
        metrics = calculateDailyMetrics({
          ...settings,
          hasFood: log.hasFood,
          otHours: typeof log.otHours === 'string' ? parseFloat(log.otHours) || 0 : log.otHours,
          shiftType: log.shiftType as ShiftType,
        });
      }

      days.push({
        date: current,
        log,
        isWorking: !!log,
        metrics,
      });
      d.setDate(d.getDate() + 1);
    }
    return days;
  }, [startDate, endDate, logs, settings]);

  const summary = useMemo(() => {
    return rows.reduce(
      (acc, row) => {
        if (row.isWorking) {
          acc.totalExtras += row.metrics.totalExtras;
          acc.totalNetBaseWage += row.metrics.netBaseWage;
          acc.grandTotal += row.metrics.grandTotal;
        }
        return acc;
      },
      { totalExtras: 0, totalNetBaseWage: 0, grandTotal: 0 }
    );
  }, [rows]);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Toast Notifications */}
      <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`animate-in slide-in-from-top-4 fade-in duration-300 pointer-events-auto px-4 py-3 rounded-xl shadow-xl border flex items-center gap-3 backdrop-blur-md ${
              toast.type === 'success'
                ? 'bg-emerald-950/90 border-emerald-800 text-emerald-200 shadow-emerald-900/20'
                : 'bg-red-950/90 border-red-800 text-red-200 shadow-red-900/20'
            }`}
          >
            {toast.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-500" />
            ) : (
              <XCircle className="w-5 h-5 text-red-500" />
            )}
            <p className="text-sm font-medium">{toast.message}</p>
          </div>
        ))}
      </div>
      {/* Date Range Picker */}
      <div className="flex flex-col md:flex-row items-center justify-between bg-neutral-900/80 border border-neutral-800 rounded-2xl p-4 shadow-xl backdrop-blur-md gap-4">
        <div className="flex items-center gap-3 w-full md:w-auto">
          <CalendarDays className="w-5 h-5 text-neutral-400" />
          <div className="flex flex-col sm:flex-row items-center gap-2 flex-1 w-full">
            <input
              type="date"
              value={startInput}
              onChange={(e) => setStartInput(e.target.value)}
              className="w-full sm:w-auto flex-1 bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-neutral-200"
            />
            <span className="text-neutral-500 font-medium py-1 sm:py-0">to</span>
            <input
              type="date"
              value={endInput}
              onChange={(e) => setEndInput(e.target.value)}
              className="w-full sm:w-auto flex-1 bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-neutral-200"
            />
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto mt-2 md:mt-0">
          <button
            onClick={setThisMonth}
            className="w-full sm:w-auto flex-1 md:flex-none text-neutral-400 hover:text-white hover:bg-neutral-800 px-4 py-2 rounded-xl text-sm font-medium transition-all text-center"
          >
            This Month
          </button>
          <button
            onClick={applyDateRange}
            className="w-full sm:w-auto flex-1 md:flex-none bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-2 rounded-xl text-sm font-semibold transition-all shadow-lg shadow-indigo-500/25 text-center"
          >
            Apply Range
          </button>
          <button
            onClick={reloadData}
            disabled={isReloading}
            className="w-full sm:w-auto md:flex-none bg-neutral-800 hover:bg-neutral-700 disabled:opacity-50 text-neutral-300 px-4 py-2 rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${isReloading ? 'animate-spin text-indigo-400' : ''}`} />
            <span className="hidden sm:inline">Reload</span>
          </button>
        </div>
      </div>

      {/* Settings Panel */}
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 bg-neutral-800/50 p-4 rounded-xl border border-neutral-700">
        <div className="space-y-1">
          <label className="text-xs font-medium text-neutral-400 uppercase tracking-wider">Daily Wage</label>
          <input
            type="number"
            value={settings.dailyWage}
            onChange={(e) => handleSettingsChange('dailyWage', e.target.value)}
            className="w-full bg-neutral-900 border border-neutral-700 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-neutral-200"
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-neutral-400 uppercase tracking-wider">Food Allowance</label>
          <input
            type="number"
            value={settings.foodAllowance}
            onChange={(e) => handleSettingsChange('foodAllowance', e.target.value)}
            className="w-full bg-neutral-900 border border-neutral-700 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-neutral-200"
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-neutral-400 uppercase tracking-wider">Morning Shift</label>
          <input
            type="number"
            value={settings.morningShiftExtra}
            onChange={(e) => handleSettingsChange('morningShiftExtra', e.target.value)}
            className="w-full bg-neutral-900 border border-neutral-700 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-neutral-200"
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-neutral-400 uppercase tracking-wider">Night Shift</label>
          <input
            type="number"
            value={settings.nightShiftExtra}
            onChange={(e) => handleSettingsChange('nightShiftExtra', e.target.value)}
            className="w-full bg-neutral-900 border border-neutral-700 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-neutral-200"
          />
        </div>
        <div className="space-y-1 flex flex-col justify-end col-span-2 sm:col-span-2 md:col-span-1 lg:col-span-1">
          <button
            onClick={saveSettings}
            disabled={isSavingSettings}
            className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-medium rounded-lg px-4 py-2 text-sm transition-all flex items-center justify-center gap-2"
          >
            {isSavingSettings ? <Settings2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save Settings
          </button>
        </div>
      </div>

      {/* Main Table */}
      <div className="overflow-x-auto rounded-xl border border-neutral-800 bg-neutral-900/30">
        <table className="w-full text-sm text-left">
          <thead className="text-xs text-neutral-400 uppercase bg-neutral-800/80 sticky top-0 backdrop-blur-md z-10 whitespace-nowrap">
            <tr>
              <th className="px-4 py-4 font-medium rounded-tl-xl text-center">Work?</th>
              <th className="px-4 py-4 font-medium">Date</th>
              <th className="px-4 py-4 font-medium text-center">Food</th>
              <th className="px-4 py-4 font-medium text-center">OT (Hrs)</th>
              <th className="px-4 py-4 font-medium text-center">Shift</th>
              <th className="px-4 py-4 font-medium text-right text-indigo-300">OT+Shift+Food</th>
              <th className="px-4 py-4 font-medium text-right text-emerald-300 rounded-tr-xl">Net Wage (SSO)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-800/50">
            {rows.map(({ date, log, isWorking, metrics }) => (
              <tr key={date.toISOString()} className={`transition-colors group ${isWorking ? 'hover:bg-neutral-800/40' : 'opacity-60 hover:opacity-100 hover:bg-neutral-800/20'}`}>
                <td className="px-4 py-3 text-center">
                  <button
                    onClick={() => toggleWorkDay(date, isWorking)}
                    disabled={processingDates.has(date.getTime())}
                    className="p-1 rounded-full transition-all hover:scale-110 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 disabled:opacity-50 disabled:hover:scale-100"
                  >
                    {processingDates.has(date.getTime()) ? (
                      <Loader2 className="w-6 h-6 animate-spin text-neutral-400" />
                    ) : isWorking ? (
                      <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                    ) : (
                      <Circle className="w-6 h-6 text-neutral-600 hover:text-neutral-400" />
                    )}
                  </button>
                </td>
                <td className="px-4 py-3 font-medium text-neutral-300 whitespace-nowrap">
                  <div className="flex items-center gap-3">
                    <span className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${isWorking ? 'bg-indigo-500/20 text-indigo-400' : 'bg-neutral-800 text-neutral-500'}`}>
                      {format(date, 'd')}
                    </span>
                    <span className="text-neutral-400">
                      {format(date, 'EEE')}
                    </span>
                  </div>
                </td>
                <td className="px-4 py-3 text-center">
                  <button
                    disabled={!isWorking}
                    onClick={() => isWorking && updateLog(date, 'hasFood', !log?.hasFood)}
                    className={`p-2 rounded-lg transition-all ${
                      log?.hasFood ? 'bg-orange-500/20 text-orange-400' : 'text-neutral-600 hover:bg-neutral-800'
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    <Utensils className="w-4 h-4" />
                  </button>
                </td>
                <td className="px-4 py-3 text-center">
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    disabled={!isWorking}
                    value={log?.otHours === 0 ? '' : (log?.otHours ?? '')}
                    placeholder="0"
                    onChange={(e) => updateLog(date, 'otHours', e.target.value)}
                    className="w-16 bg-neutral-900 border border-neutral-700 rounded-lg px-2 py-1.5 text-center text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                </td>
                <td className="px-4 py-3 text-center">
                  <select
                    disabled={!isWorking}
                    value={log?.shiftType || 'NONE'}
                    onChange={(e) => updateLog(date, 'shiftType', e.target.value)}
                    className="bg-neutral-900 border border-neutral-700 rounded-lg px-2 py-1.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <option value="NONE">-</option>
                    <option value="MORNING">Morning</option>
                    <option value="NIGHT">Night</option>
                  </select>
                </td>
                <td className="px-4 py-3 text-right font-medium text-indigo-300 whitespace-nowrap">
                  {isWorking && metrics.totalExtras > 0 ? (
                    <span className="bg-indigo-500/10 px-2 py-1 rounded text-indigo-400 border border-indigo-500/20">
                      +{metrics.totalExtras.toFixed(2)}
                    </span>
                  ) : (
                    <span className="text-neutral-600">0.00</span>
                  )}
                </td>
                <td className="px-4 py-3 text-right font-medium whitespace-nowrap">
                  {isWorking ? (
                    <span className="text-emerald-400">{metrics.netBaseWage.toFixed(2)}</span>
                  ) : (
                    <span className="text-neutral-600">0.00</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot className="bg-neutral-800 sticky bottom-0 z-10 border-t border-neutral-700 shadow-[0_-10px_40px_rgba(0,0,0,0.5)]">
            <tr>
              <td colSpan={5} className="px-4 py-4 text-right font-bold text-neutral-300 uppercase tracking-wider text-xs">
                Total
              </td>
              <td className="px-4 py-4 text-right font-bold text-indigo-400 text-lg">
                {summary.totalExtras.toFixed(2)}
              </td>
              <td className="px-4 py-4 text-right font-bold text-emerald-400 text-lg">
                {summary.totalNetBaseWage.toFixed(2)}
              </td>
            </tr>
            <tr className="bg-neutral-950 border-t border-neutral-800">
              <td colSpan={4} className="px-4 py-6 text-right font-bold text-neutral-400 uppercase tracking-wider">
                Grand Total
              </td>
              <td colSpan={3} className="px-4 py-6 text-right whitespace-nowrap">
                <span className="text-3xl md:text-4xl font-extrabold bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
                  ฿{summary.grandTotal.toFixed(2)}
                </span>
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
