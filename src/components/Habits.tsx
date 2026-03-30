import React, { useMemo, useState, useEffect } from 'react';
import { Habit } from '../types';
import { Edit2, Trash2, Plus, Activity, TrendingUp, Sun, CloudSun, Moon, Stars, Search, Target, Clock, ChevronLeft, ChevronRight, Check, Sparkles, Circle, CircleDollarSign } from 'lucide-react';
import { getEffectiveDate, formatDateStr } from '../utils/dateUtils';
import { Tabs } from './Tabs';

interface HabitsProps {
  habits: Habit[];
  onToggleHabit: (id: any, dateStr: string) => void;
  onDeleteHabit: (id: any) => void;
  onAddHabit: () => void;
  onEditHabit: (id: any) => void;
  currentMonth: Date;
  onMonthChange: (date: Date) => void;
  // Navigation props
  tabs: string[];
  activeTab: string;
  onTabChange: (tab: string) => void;
  onLogout: () => void;
  isLoggingOut: boolean;
  startDate?: string;
}

// Time phase definitions
const TIME_PHASES = [
  { key: 'reset', label: 'Reset', time: 'reset', icon: Sun, color: '#34c759' },
  { key: 'growth', label: 'Growth', time: 'growth', icon: Target, color: '#bf7af0' },
  { key: 'distraction', label: 'Distraction', time: 'distraction', icon: Sparkles, color: '#ff3b30' },
  { key: 'daily_rule', label: 'Rules', time: 'any', icon: Circle, color: '#1d9bf0' },
  { key: 'spending', label: 'Spending', time: 'spending', icon: CircleDollarSign, color: '#ff9500' },
] as const;

const getPhaseForHabit = (habit: Habit) => {
  if (!habit.time) return TIME_PHASES[0];
  const time = habit.time;
  // Support both old time strings and new phase keys
  if (time === 'reset' || time === '08:00') return TIME_PHASES[0];
  if (time === 'growth' || time === '14:00') return TIME_PHASES[1];
  if (time === 'distraction' || time === '20:00' || time === '02:00') return TIME_PHASES[2];
  if (time === 'spending') return TIME_PHASES[4];
  
  const phase = TIME_PHASES.find(p => p.time === time);
  return phase || TIME_PHASES[0];
};

export const Habits: React.FC<HabitsProps> = ({
  habits, onDeleteHabit, onAddHabit, onEditHabit, currentMonth, onMonthChange,
  tabs, activeTab, onTabChange, onLogout, isLoggingOut, startDate
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [showActionsId, setShowActionsId] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setTimeout(() => setIsLoaded(true), 50);
    const clockTimer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => {
      clearTimeout(timer);
      clearInterval(clockTimer);
    };
  }, []);

  // Group habits by time phase
  const groupedByPhase = useMemo(() => {
    const groups: Record<string, { phase: typeof TIME_PHASES[number]; habits: Habit[] }> = {};

    // Initialize groups in order
    TIME_PHASES.forEach(p => {
      groups[p.key] = { phase: p, habits: [] };
    });

    const searchLower = searchTerm.trim().toLowerCase();
    const filteredHabits = habits.filter(h =>
      h.name.toLowerCase().includes(searchLower)
    );

    filteredHabits.forEach(h => {
      const phase = getPhaseForHabit(h);
      groups[phase.key].habits.push(h);
    });

    // Only return phases that have habits
    const result: typeof groups = {};
    TIME_PHASES.forEach(p => {
      if (groups[p.key].habits.length > 0) {
        result[p.key] = groups[p.key];
      }
    });
    return result;
  }, [habits, searchTerm]);

  // Get days in current month
  const daysInMonth = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    return new Date(year, month + 1, 0).getDate();
  }, [currentMonth]);

  const monthYearLabel = useMemo(() => {
    return currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' });
  }, [currentMonth]);

  const days = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    return Array.from({ length: daysInMonth }, (_, i) => {
      const date = new Date(year, month, i + 1);
      return {
        dayNum: i + 1,
        dayName: date.toLocaleString('default', { weekday: 'short' }).slice(0, 2),
        dateStr: formatDateStr(date),
        label: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      };
    });
  }, [daysInMonth, currentMonth]);

  const currentWeekDates = useMemo(() => {
    const today = new Date();
    const day = today.getDay();
    const diff = today.getDate() - day + (day === 0 ? -6 : 1); // Monday
    const startOfWeek = new Date(today.getFullYear(), today.getMonth(), diff);
    
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(startOfWeek);
      d.setDate(startOfWeek.getDate() + i);
      return {
        dateStr: formatDateStr(d),
        label: d.toLocaleString('default', { weekday: 'narrow' })
      };
    });
  }, []);

  const changeMonth = (offset: number) => {
    const newDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + offset, 1);
    const now = new Date();
    const currentRealMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    
    if (offset > 0 && newDate > currentRealMonth) return;
    onMonthChange(newDate);
  };

  const isCurrentOrFutureMonth = useMemo(() => {
    const now = new Date();
    return currentMonth.getFullYear() >= now.getFullYear() && currentMonth.getMonth() >= now.getMonth();
  }, [currentMonth]);

  const isStartMonth = useMemo(() => {
    if (!startDate) return true;
    const start = new Date(startDate);
    return currentMonth.getFullYear() <= start.getFullYear() && currentMonth.getMonth() <= start.getMonth();
  }, [currentMonth, startDate]);

  return (
    <div className="flex flex-col relative w-full h-full">

      {/* Visual Header / Summary */}
      <div className="sticky top-0 z-20 bg-black/80 backdrop-blur-xl border-b border-[#2f3336]">
        <Tabs tabs={tabs} activeTab={activeTab} onTabChange={onTabChange} onLogout={onLogout} isLoggingOut={isLoggingOut} />
      </div>

      <div className="px-5 md:px-6 py-4 md:py-6 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#2f3336]">
        {/* Row 1: Title & Month Picker */}
        <div className="min-w-0">
          <h2 className="text-[18px] md:text-[20px] font-black text-[#eff3f4] leading-tight tracking-tight whitespace-nowrap">
            Add Workspace
          </h2>
          <div className="flex flex-wrap items-center gap-y-1.5 gap-x-2 mt-1.5">
            {TIME_PHASES.map((phase, idx) => (
              <React.Fragment key={phase.key}>
                <span 
                  className="text-[9px] font-black uppercase tracking-widest leading-none"
                  style={{ color: phase.color }}
                >
                  {habits.filter(h => getPhaseForHabit(h).key === phase.key).length} {phase.label}
                </span>
                {idx < TIME_PHASES.length - 1 && (
                  <span className="w-1 h-1 rounded-full bg-[#71767b]" />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-3 w-full md:w-auto">
          <button
            onClick={onAddHabit}
            className="w-full md:w-auto bg-[#eff3f4] text-[#0f1419] py-2.5 px-6 rounded-xl flex items-center justify-center gap-2 shadow-[0_8px_20px_rgba(255,255,255,0.1)] transition-all hover:opacity-90 active:scale-[0.98]"
          >
            <Plus className="w-5 h-5" strokeWidth={3} />
            <span className="font-black tracking-tight text-[13px] md:text-[14px]">Add Workspace</span>
          </button>

          <div className="flex flex-col md:flex-row gap-3 items-center">
            {/* Month Picker */}
            <div className="flex items-center gap-1 bg-[#16181c] border border-[#2f3336] p-1 rounded-xl w-full md:w-auto h-10">
              <div className="flex items-center justify-center w-8">
                {!isStartMonth ? (
                  <button
                    onClick={() => changeMonth(-1)}
                    className="p-1.5 hover:bg-white/5 rounded-lg transition-colors text-[#71767b] hover:text-[#eff3f4]"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                ) : null}
              </div>

              <div className="flex-1 text-center px-2 min-w-[100px]">
                <span className="text-[11px] font-black uppercase tracking-widest text-[#eff3f4]">
                  {monthYearLabel}
                </span>
              </div>

              <div className="flex items-center justify-center w-8">
                {!isCurrentOrFutureMonth ? (
                  <button
                    onClick={() => changeMonth(1)}
                    className="p-1.5 hover:bg-white/5 rounded-lg transition-colors text-[#71767b] hover:text-[#eff3f4]"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                ) : null}
              </div>
            </div>
            
            <div className="relative w-full md:w-[280px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#71767b]" />
              <input
                type="text"
                placeholder="Search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-[#16181c] border border-[#2f3336] pl-9 pr-8 py-2.5 rounded-xl text-[13px] text-[#eff3f4] placeholder-[#71767b] outline-none focus:border-[#1d9bf0] transition-all"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 w-5 h-5 flex items-center justify-center rounded-full bg-[#71767b]/30 hover:bg-[#71767b]/50 transition-colors"
                  aria-label="Clear search"
                >
                  <span className="text-[#eff3f4] text-[10px] font-bold leading-none">✕</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="px-5 md:px-6 py-4 space-y-6 pb-20 text-[#eff3f4] animate-slide-up duration-[400ms]">
        <div className="flex flex-col gap-8 pb-32 mt-4 text-[#eff3f4]">
          {Object.entries(groupedByPhase).length === 0 && (
            <div className="text-center py-16 bg-white/[0.01] border border-dashed border-[#2f3336] rounded-3xl">
              <TrendingUp className="w-10 h-10 text-[#71767b]/40 mx-auto mb-4" />
              <p className="text-[#71767b] text-base font-bold">No categories tracked yet</p>
              <p className="text-[#71767b]/60 text-sm mt-1">Click "Add Workspace" to start your journey!</p>
            </div>
          )}

          {Object.entries(groupedByPhase).map(([phaseKey, phaseGroup]) => {
            const { phase, habits: phaseHabits } = phaseGroup as { phase: typeof TIME_PHASES[number]; habits: Habit[] };

            return (
              <div key={phaseKey} className="space-y-4">
                {/* Phase Header - Compacted */}
                <div className="flex items-center gap-3 px-0.5">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-[11px] md:text-[13px] font-black uppercase tracking-[0.2em]" style={{ color: phase.color }}>
                      {phase.label}
                    </span>
                    <div className="h-px w-8 bg-[#2f3336] hidden md:block" />
                    <span className="text-[9px] font-bold text-[#71767b] uppercase tracking-widest whitespace-nowrap">
                      {phaseHabits.length} {phaseHabits.length === 1 ? 'Category' : 'Categories'}
                    </span>
                  </div>
                  <div className="flex-1 h-px bg-gradient-to-r from-[#2f3336] to-transparent" />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 md:gap-4">
                  {phaseHabits.map(habit => {
                    const totalMonthly = days.filter(d => habit.history[d.dateStr]).length;
                    const target = habit.monthlyTarget || days.length;
                    const completionRate = Math.min(Math.round((totalMonthly / target) * 100), 100);

                    return (
                      <div
                        key={habit.id}
                        onClick={() => setShowActionsId(showActionsId === habit.id ? null : habit.id)}
                        className="w-full flex flex-row items-center justify-between gap-2 md:gap-4 p-3 md:p-5 rounded-2xl bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.05] hover:border-white/10 transition-all duration-300 group relative overflow-hidden cursor-pointer"
                      >
                        <div
                          className="absolute left-0 top-0 bottom-0 transition-all duration-1000 opacity-[0.03]"
                          style={{ width: `${isLoaded ? completionRate : 0}%`, backgroundColor: phase.color }}
                        />

                        <div className="flex items-center gap-3 flex-1 min-w-0 relative z-10">
                          <div className="relative w-10 h-10 md:w-12 md:h-12 shrink-0">
                            <svg className="w-full h-full -rotate-90" viewBox="0 0 48 48">
                              <circle cx="24" cy="24" r="21" fill="transparent" stroke="white" strokeOpacity="0.05" strokeWidth="4" />
                               <circle
                                cx="24" cy="24" r="21"
                                fill="transparent"
                                stroke={phase.color}
                                strokeWidth="4"
                                strokeDasharray={2 * Math.PI * 21}
                                strokeDashoffset={2 * Math.PI * 21 * (1 - (isLoaded ? completionRate : 0) / 100)}
                                strokeLinecap="round"
                                className="transition-all duration-1000"
                              />
                            </svg>
                            <div className="absolute inset-0 flex items-center justify-center">
                              <span className="text-[9px] md:text-[11px] font-black" style={{ color: phase.color }}>{completionRate}%</span>
                            </div>
                          </div>

                          <div className="min-w-0">
                            <h4 className="text-[13px] md:text-[15px] font-black text-[#eff3f4] uppercase tracking-tight truncate">
                              {habit.name}
                            </h4>
                            {/* Weekly Mini-Graph */}
                            <div className="flex gap-1 mt-1.5 overflow-x-auto no-scrollbar scrollbar-hide pb-0.5">
                              {currentWeekDates.map((d, i) => (
                                <div
                                  key={i}
                                  className={`w-3.5 md:w-4.5 h-3 md:h-4 rounded-[3px] border transition-all flex items-center justify-center overflow-hidden shrink-0 ${
                                    habit.history[d.dateStr] 
                                    ? '' 
                                    : 'bg-white/[0.04] border-white/5'
                                  }`}
                                  style={habit.history[d.dateStr] ? { backgroundColor: `${phase.color}25`, borderColor: `${phase.color}50` } : {}}
                                  title={d.dateStr}
                                >
                                  {habit.history[d.dateStr] && (
                                    <div className="w-full h-full opacity-80" style={{ backgroundColor: phase.color }} />
                                  )}
                                  {!habit.history[d.dateStr] && (
                                    <span className="text-[6px] md:text-[7px] font-bold text-[#71767b] select-none">{d.label}</span>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center justify-end gap-3 md:gap-6 relative z-10 shrink-0">
                          <div className="flex flex-col items-end">
                            <span className="text-[15px] md:text-[18px] font-black text-[#eff3f4] leading-none">
                              {totalMonthly}<span className="text-[11px] text-[#71767b]">/{target}</span>
                            </span>
                            <p className="text-[8px] md:text-[9px] font-black text-[#71767b] uppercase tracking-widest mt-1">Consistency</p>
                          </div>

                          {showActionsId === habit.id && (
                            <div className="flex items-center gap-1 border-l border-[#2f3336] pl-3 animate-fade-in z-20">
                              <button
                                onClick={(e) => { e.stopPropagation(); onEditHabit(habit.id); }}
                                className="p-2 md:p-2.5 text-[#71767b] hover:text-[#1d9bf0] hover:bg-[#1d9bf0]/10 rounded-xl transition-all"
                              >
                                <Edit2 className="w-4 h-4 md:w-[18px] md:h-[18px]" />
                              </button>
                              <button
                                onClick={(e) => { e.stopPropagation(); onDeleteHabit(habit.id); }}
                                className="p-2 md:p-2.5 text-[#71767b] hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all"
                              >
                                <Trash2 className="w-4 h-4 md:w-[18px] md:h-[18px]" />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
