import React, { useMemo, useState, useEffect } from 'react';
import { Habit } from '../types';
import { Circle, Target, ChevronLeft, ChevronRight, Search, Flame, AlignLeft, Info, Loader2 } from 'lucide-react';
import { formatDateStr } from '../utils/dateUtils';
import { Tabs } from './Tabs';

interface DetailProps {
  habits: Habit[];
  onUpdateHabit: (args: any) => Promise<void>;
  currentMonth: Date;
  onChangeMonth?: (date: Date) => void; // Using currentMonth instead as prop
  onMonthChange: (date: Date) => void;
  tabs: string[];
  activeTab: string;
  onTabChange: (tab: string) => void;
  onLogout: () => void;
  isLoggingOut: boolean;
  startDate?: string;
}

const TIME_PHASES = [
  { key: 'reset', label: 'Health', time: 'reset', icon: Target, color: '#34c759' },
  { key: 'growth', label: 'Growth', time: 'growth', icon: Target, color: '#bf7af0' },
  { key: 'distraction', label: 'Discipline', time: 'distraction', icon: Target, color: '#1d9bf0' },
  { key: 'daily_rule', label: 'Eliminate', time: 'any', icon: Target, color: '#ff3b30' },
  { key: 'spending', label: 'Boundary', time: 'spending', icon: Target, color: '#FF6B4A' },
] as const;

const getPhaseForHabit = (habit: Habit) => {
  if (!habit.time) return TIME_PHASES[0];
  const time = habit.time;
  // Find by time value - works for all category types
  const phase = TIME_PHASES.find(p => p.time === time);
  if (phase) return phase;
  // Fallback for legacy time strings
  if (time === '08:00') return TIME_PHASES[0]; // Health
  if (time === '14:00') return TIME_PHASES[1]; // Growth
  if (time === '20:00' || time === '02:00') return TIME_PHASES[2]; // Discipline
  return TIME_PHASES[0];
};

export const Detail: React.FC<DetailProps> = ({
  habits, onUpdateHabit, currentMonth, onMonthChange,
  tabs, activeTab, onTabChange, onLogout, isLoggingOut, startDate
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedHabitId, setExpandedHabitId] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [savingId, setSavingId] = useState<string | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoaded(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const monthYearLabel = currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' });

  const groupedByPhase = useMemo(() => {
    const groups: Record<string, { phase: typeof TIME_PHASES[number]; habits: Habit[] }> = {};
    TIME_PHASES.forEach(p => { groups[p.key] = { phase: p, habits: [] }; });

    const searchLower = searchTerm.trim().toLowerCase();
    habits.filter(h => h.name.toLowerCase().includes(searchLower)).forEach(h => {
      const phase = getPhaseForHabit(h);
      groups[phase.key].habits.push(h);
    });

    const result: typeof groups = {};
    TIME_PHASES.forEach(p => { if (groups[p.key].habits.length > 0) result[p.key] = groups[p.key]; });
    return result;
  }, [habits, searchTerm]);

  const daysInMonth = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    return Array.from({ length: new Date(year, month + 1, 0).getDate() }, (_, i) => {
      const date = new Date(year, month, i + 1);
      return {
        dateStr: formatDateStr(date),
        dayNum: i + 1,
        dayName: date.toLocaleString('default', { weekday: 'short' }),
        isToday: formatDateStr(date) === formatDateStr(new Date())
      };
    });
  }, [currentMonth]);

  const changeMonth = (offset: number) => {
    onMonthChange(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + offset, 1));
  };

  const isCurrentMonth = useMemo(() => {
    const now = new Date();
    return currentMonth.getFullYear() === now.getFullYear() && currentMonth.getMonth() === now.getMonth();
  }, [currentMonth]);

  return (
    <div className="flex flex-col relative w-full h-full bg-black">
      <div className="sticky top-0 z-20 bg-black/80 backdrop-blur-xl border-b border-[#2f3336]">
        <Tabs tabs={tabs} activeTab={activeTab} onTabChange={onTabChange} onLogout={onLogout} isLoggingOut={isLoggingOut} />
      </div>

      <div className="px-5 md:px-6 py-5 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#2f3336]">
        <div>
          <h2 className="text-[20px] md:text-[24px] font-black text-[#eff3f4] uppercase tracking-tight">Detail View</h2>
          <p className="text-[11px] font-bold text-[#71767b] uppercase tracking-[0.2em] mt-1">Deep dive into your journey</p>
        </div>

        <div className="flex flex-col md:flex-row gap-3">
          <div className="flex items-center gap-1 bg-[#16181c] border border-[#2f3336] p-1 rounded-xl h-10">
            <button onClick={() => changeMonth(-1)} className="p-1.5 hover:bg-white/5 rounded-lg text-[#71767b] hover:text-[#eff3f4]"><ChevronLeft className="w-4 h-4" /></button>
            <span className="px-3 text-[11px] font-black uppercase tracking-widest text-[#eff3f4] min-w-[120px] text-center">{monthYearLabel}</span>
            <button onClick={() => changeMonth(1)} className="p-1.5 hover:bg-white/5 rounded-lg text-[#71767b] hover:text-[#eff3f4]" disabled={isCurrentMonth}><ChevronRight className="w-4 h-4" /></button>
          </div>
          <div className="relative w-full md:w-[240px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#71767b]" />
            <input type="text" placeholder="Search categories" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full bg-[#16181c] border border-[#2f3336] pl-9 pr-4 py-2.5 rounded-xl text-[13px] text-[#eff3f4] outline-none focus:border-[#1d9bf0] transition-all" />
          </div>
        </div>
      </div>

      <div className="p-5 md:p-6 space-y-8 overflow-y-auto" style={{ paddingBottom: 'max(8rem, env(safe-area-inset-bottom) + 4rem)' }}>
        {Object.entries(groupedByPhase).map(([phaseKey, phaseGroup]) => {
          const { phase, habits: phaseHabits } = phaseGroup as { phase: typeof TIME_PHASES[number]; habits: Habit[] };
          return (
            <div key={phaseKey} className="space-y-4">
              <div className="flex items-center gap-3">
                <span className="text-[11px] font-black uppercase tracking-[0.3em]" style={{ color: phase.color }}>{phase.label}</span>
                <div className="flex-1 h-px bg-[#2f3336]" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {phaseHabits.map(habit => {
                  const completionsThisMonth = daysInMonth.filter(d => habit.history[d.dateStr]).length;
                  const daysInCurrentMonth = daysInMonth.length;
                  const target = habit.monthlyTarget || daysInCurrentMonth;
                  const completionRate = Math.min(Math.round((completionsThisMonth / target) * 100), 100);
                  const isExpanded = String(expandedHabitId) === String(habit.id);

                  return (
                    <div key={habit.id} 
                      onClick={() => setExpandedHabitId(isExpanded ? null : habit.id)}
                      className={`group relative overflow-hidden rounded-[24px] border transition-all duration-500 cursor-pointer ${
                        isExpanded 
                        ? 'bg-white/[0.04] border-white/20 md:col-span-2 shadow-2xl' 
                        : 'bg-white/[0.02] border-white/5 hover:bg-white/[0.04] hover:border-white/10'
                      }`}
                    >
                      <div className="p-4 md:p-5 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="relative w-12 h-12 flex-shrink-0">
                            <svg className="w-full h-full -rotate-90" viewBox="0 0 48 48">
                              <circle cx="24" cy="24" r="21" fill="transparent" stroke="white" strokeOpacity="0.05" strokeWidth="4" />
                              <circle cx="24" cy="24" r="21" fill="transparent" stroke={phase.color} strokeWidth="4" strokeDasharray={2 * Math.PI * 21} strokeDashoffset={2 * Math.PI * 21 * (1 - (isLoaded ? completionRate : 0) / 100)} strokeLinecap="round" className="transition-all duration-1000 ease-out" />
                            </svg>
                            <div className="absolute inset-0 flex items-center justify-center">
                              <span className="text-[10px] font-black" style={{ color: phase.color }}>{completionRate}%</span>
                            </div>
                          </div>
                          <div>
                             <h4 className="text-[15px] font-black text-[#eff3f4] uppercase tracking-tight">{habit.name.toUpperCase()}</h4>
                            <div className="flex items-center gap-2 mt-1">
                              <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-[#ff3b30]/10 border border-[#ff3b30]/20">
                                <Flame className="w-2.5 h-2.5 text-[#ff3b30]" />
                                <span className="text-[9px] font-black text-[#ff3b30]">{habit.streak}</span>
                              </div>
                              <span className="text-[9px] font-bold text-[#71767b] uppercase tracking-widest">{completionsThisMonth} / {target} Days</span>
                            </div>
                          </div>
                        </div>
                        <div className={`transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}>
                          {String(savingId) === String(habit.id) ? (
                            <Loader2 className="w-5 h-5 text-[#1d9bf0] animate-spin" />
                          ) : (
                            <AlignLeft className="w-5 h-5 text-[#71767b] group-hover:text-[#eff3f4]" />
                          )}
                        </div>
                      </div>

                        {isExpanded && (
                        <div className="px-5 pb-8 pt-2 animate-in fade-in slide-in-from-top-4 duration-500">
                          <div className="h-px bg-gradient-to-r from-white/20 via-white/5 to-transparent mb-6" />
                          
                          <div className="space-y-6">
                            {/* Description Section */}
                            <div className="bg-white/[0.03] border border-white/5 rounded-[20px] p-5" onClick={(e) => e.stopPropagation()}>
                              <h5 className="text-[10px] font-black text-[#71767b] uppercase tracking-[0.25em] mb-3 flex items-center gap-2">
                                <Info className="w-3 h-3" />
                                Task Details & Description
                              </h5>
                              <div className="text-[14px] md:text-[16px] text-[#eff3f4] leading-relaxed font-medium whitespace-pre-wrap">
                                {habit.description || (
                                  <span className="text-[#71767b] italic opacity-50">No detailed info provided for this category. You can add them in the "Add Workspace" tab.</span>
                                )}
                              </div>
                            </div>

                            {/* Summary Stats Grid */}
                            <div className="grid grid-cols-3 gap-3">
                              <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-4 text-center">
                                <p className="text-[20px] md:text-[24px] font-black text-[#eff3f4] leading-none">{completionsThisMonth}</p>
                                <p className="text-[8px] font-bold text-[#71767b] uppercase mt-2 tracking-widest">Days Done</p>
                              </div>
                              <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-4 text-center">
                                <p className="text-[20px] md:text-[24px] font-black text-[#eff3f4] leading-none">{habit.streak}</p>
                                <p className="text-[8px] font-bold text-[#71767b] uppercase mt-2 tracking-widest">Streak</p>
                              </div>
                              <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-4 text-center">
                                <p className="text-[20px] md:text-[24px] font-black text-[#eff3f4] leading-none">{completionRate}%</p>
                                <p className="text-[8px] font-bold text-[#71767b] uppercase mt-2 tracking-widest">Rate</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}

        {Object.entries(groupedByPhase).length === 0 && (
          <div className="text-center py-24 bg-white/[0.02] border border-dashed border-[#2f3336] rounded-[32px]">
            <Info className="w-12 h-12 text-[#71767b]/20 mx-auto mb-4" />
            <p className="text-[#71767b] font-bold">No categories found for this period</p>
          </div>
        )}
      </div>
    </div>
  );
};
