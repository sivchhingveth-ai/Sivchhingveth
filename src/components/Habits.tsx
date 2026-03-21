import React, { useMemo, useState, useEffect, useCallback, useRef } from 'react';
import { Habit } from '../types';
import { Edit2, Trash2, Check, Plus, ChevronLeft, ChevronRight, Activity, TrendingUp, Sun, CloudSun, Moon, Stars, Search } from 'lucide-react';
import { getEffectiveDateStr, getEffectiveDate } from '../utils/dateUtils';
import { Tabs } from './Tabs';
import { MonthPicker } from './MonthPicker';

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
}

// Time phase definitions
const TIME_PHASES = [
  { key: 'morning', label: 'Morning', time: '08:00', icon: Sun, color: '#ffad1f' },
  { key: 'afternoon', label: 'Afternoon', time: '14:00', icon: CloudSun, color: '#ff6b00' },
  { key: 'night', label: 'Night', time: '20:00', icon: Moon, color: '#7856ff' },
  { key: 'midnight', label: 'Midnight', time: '02:00', icon: Stars, color: '#1d9bf0' },
  { key: 'daily_rule', label: 'Daily Rule', time: 'any', icon: Activity, color: '#34c759' },
] as const;

const getPhaseForHabit = (habit: Habit) => {
  if (!habit.time) return TIME_PHASES[0]; // Default to morning
  const phase = TIME_PHASES.find(p => p.time === habit.time);
  return phase || TIME_PHASES[0];
};

export const Habits: React.FC<HabitsProps> = ({
  habits, onToggleHabit, onDeleteHabit, onAddHabit, onEditHabit, currentMonth, onMonthChange,
  tabs, activeTab, onTabChange, onLogout, isLoggingOut
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [showActionsId, setShowActionsId] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoaded(true), 50);
    return () => clearTimeout(timer);
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

  const isCurrentOrFutureMonth = useMemo(() => {
    const today = getEffectiveDate();
    return currentMonth.getFullYear() > today.getFullYear() ||
      (currentMonth.getFullYear() === today.getFullYear() && currentMonth.getMonth() >= today.getMonth());
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
        dateStr: date.toISOString().split('T')[0],
        label: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      };
    });
  }, [daysInMonth, currentMonth]);

  const changeMonth = (offset: number) => {
    const newDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + offset, 1);
    onMonthChange(newDate);
  };

  return (
    <div className="flex flex-col relative w-full h-full">

      {/* Visual Header / Summary */}
      <div className="sticky top-0 z-20 bg-black/80 backdrop-blur-xl border-b border-[#2f3336]">
        <Tabs tabs={tabs} activeTab={activeTab} onTabChange={onTabChange} onLogout={onLogout} isLoggingOut={isLoggingOut} />
      </div>
      <div>
        <div className="px-5 md:px-6 py-4 md:py-6 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#2f3336]">
            {/* Row 1: Title */}
            <div className="min-w-0">
              <h2 className="text-[18px] md:text-[20px] font-black text-[#eff3f4] leading-tight tracking-tight whitespace-nowrap">
                Set Routine
              </h2>
              <p className="text-[#8b98a5] text-[9px] md:text-[11px] font-black uppercase tracking-[0.2em] mt-1 truncate">
                Tracking {habits.length} daily goals
              </p>
            </div>

            {/* Row 2: Controls */}
            <div className="flex flex-col md:flex-row md:items-center gap-3 w-full">
              <button
                onClick={onAddHabit}
                className="w-full md:w-auto bg-[#eff3f4] text-[#0f1419] py-2.5 px-6 rounded-xl flex items-center justify-center gap-2 shadow-[0_8px_20px_rgba(255,255,255,0.1)] transition-all hover:opacity-90 active:scale-[0.98]"
              >
                <Plus className="w-5 h-5" strokeWidth={3} />
                <span className="font-black tracking-tight text-[13px] md:text-[14px]">Add Routine</span>
              </button>

              <div className="relative flex-1 md:max-w-[280px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#71767b]" />
                <input
                  type="text"
                  placeholder="Search routines..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-[#16181c] border border-[#2f3336] pl-9 pr-8 py-2.5 rounded-xl text-[13px] text-[#eff3f4] placeholder-[#71767b] outline-none focus:border-[#1d9bf0] transition-all"
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 w-5 h-5 flex items-center justify-center rounded-full bg-[#71767b]/30 hover:bg-[#71767b]/50 transition-colors"
                  >
                    <span className="text-[#eff3f4] text-[10px] font-bold leading-none">✕</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>


      <div className="p-5 md:p-6 space-y-6 pb-20 text-[#eff3f4] animate-slide-up duration-[3000ms]">
        {/* Habit List - Balanced Row Layout */}
        {/* Habit List - Grouped by Time Phase to match Daily Habits */}
      <div className="flex flex-col gap-8 pb-32">
        {Object.entries(groupedByPhase).length === 0 && (
          <div className="text-center py-16 bg-white/[0.01] border border-dashed border-[#2f3336] rounded-3xl">
            <TrendingUp className="w-10 h-10 text-[#71767b]/40 mx-auto mb-4" />
            <p className="text-[#71767b] text-base font-bold">No routines tracked yet</p>
            <p className="text-[#71767b]/60 text-sm mt-1">Click "Add Routine" to start your journey!</p>
          </div>
        )}

        {Object.entries(groupedByPhase).map(([phaseKey, phaseGroup]) => {
          const { phase, habits: phaseHabits } = phaseGroup as { phase: typeof TIME_PHASES[number]; habits: Habit[] };
          const PhaseIcon = phase.icon;

          return (
            <div key={phaseKey} className="space-y-4">
              {/* Phase Header - Same as Daily Habits */}
              <div className="flex items-center gap-3 px-1">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 shadow-lg"
                  style={{ backgroundColor: `${phase.color}15`, border: `1px solid ${phase.color}30` }}
                >
                  <PhaseIcon className="w-4 h-4" style={{ color: phase.color }} />
                </div>
                <div className="flex items-center gap-3 min-w-0">
                  <span className="text-[12px] md:text-[13px] font-black uppercase tracking-[0.2em]" style={{ color: phase.color }}>
                    {phase.label}{phase.key !== 'daily_rule' ? ' Phase' : ''}
                  </span>
                  <div className="h-px w-12 bg-[#2f3336] hidden md:block" />
                  <span className="text-[10px] font-bold text-[#71767b] uppercase tracking-widest whitespace-nowrap">
                    {phaseHabits.length} {phaseHabits.length === 1 ? 'Routine' : 'Routines'}
                  </span>
                </div>
                <div className="flex-1 h-px bg-gradient-to-r from-[#2f3336] to-transparent" />
              </div>

              {/* Habit Cards in this Phase - 2 columns on large screens */}
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
                      {/* Background Progress Glow */}
                      <div
                        className="absolute left-0 top-0 bottom-0 transition-all duration-1000 opacity-[0.03]"
                        style={{ width: `${isLoaded ? completionRate : 0}%`, backgroundColor: phase.color }}
                      />

                      {/* Left Section: Progress Circle + Identity */}
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
                          <h4 className="text-[14px] md:text-[17px] font-black text-[#eff3f4] uppercase tracking-tight truncate mt-1">
                            {habit.name}
                          </h4>
                        </div>
                      </div>

                      {/* Right Section: Stats + Desktop Actions */}
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
