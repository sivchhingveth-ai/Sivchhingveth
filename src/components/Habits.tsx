import React, { useMemo, useState, useEffect, useCallback, useRef } from 'react';
import { Habit } from '../types';
import { Edit2, Trash2, Check, Plus, ChevronLeft, ChevronRight, Activity, TrendingUp, Sun, CloudSun, Moon, Stars, Search } from 'lucide-react';
import { getCategoryStyles } from '../utils/colors';
import { getEffectiveDateStr, getEffectiveDate } from '../utils/dateUtils';

interface HabitsProps {
  habits: Habit[];
  onToggleHabit: (id: any, dateStr: string) => void;
  onDeleteHabit: (id: any) => void;
  onAddHabit: () => void;
  onEditHabit: (id: any) => void;
  currentMonth: Date;
  onMonthChange: (date: Date) => void;
}

// Time phase definitions
const TIME_PHASES = [
  { key: 'morning',   label: 'Morning',   time: '08:00', icon: Sun,      color: '#ffad1f' },
  { key: 'afternoon', label: 'Afternoon', time: '14:00', icon: CloudSun, color: '#ff6b00' },
  { key: 'night',     label: 'Night',     time: '20:00', icon: Moon,     color: '#7856ff' },
  { key: 'midnight',  label: 'Midnight',  time: '02:00', icon: Stars,    color: '#1d9bf0' },
] as const;

const getPhaseForHabit = (habit: Habit) => {
  if (!habit.time) return TIME_PHASES[0]; // Default to morning
  const phase = TIME_PHASES.find(p => p.time === habit.time);
  return phase || TIME_PHASES[0];
};

export const Habits: React.FC<HabitsProps> = ({ habits, onToggleHabit, onDeleteHabit, onAddHabit, onEditHabit, currentMonth, onMonthChange }) => {
  const [activeHeatmapCell, setActiveHeatmapCell] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const heatmapRef = useRef<HTMLDivElement>(null);

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

  // Dismiss tooltip when tapping outside the heatmap
  useEffect(() => {
    if (activeHeatmapCell === null) return;
    const handleOutsideClick = (e: MouseEvent | TouchEvent) => {
      if (heatmapRef.current && !heatmapRef.current.contains(e.target as Node)) {
        setActiveHeatmapCell(null);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('touchstart', handleOutsideClick);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('touchstart', handleOutsideClick);
    };
  }, [activeHeatmapCell]);

  const handleCellTap = useCallback((index: number) => {
    setActiveHeatmapCell(prev => prev === index ? null : index);
  }, []);
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
        dateStr: date.toISOString().split('T')[0],
        label: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      };
    });
  }, [daysInMonth, currentMonth]);

  const changeMonth = (offset: number) => {
    const newDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + offset, 1);
    onMonthChange(newDate);
  };

  const handleMonthSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.value) return;
    const parts = e.target.value.split('-').map(Number);
    if (parts.length === 2 && !parts.some(isNaN)) {
      onMonthChange(new Date(parts[0], parts[1] - 1, 1));
    }
  };

  // Group habits by category
  const categories = useMemo(() => {
    const groups: Record<string, Habit[]> = {};
    habits.forEach(habit => {
      if (!groups[habit.category]) groups[habit.category] = [];
      groups[habit.category].push(habit);
    });
    return groups;
  }, [habits]);

  const sortedCategoryNames = ['HEALTH', 'BODY', 'FINANCE', 'LEARNING', 'OTHER'];

  // Calculate consistency for heatmap (last 90 days relative to current viewed month)
  const heatmapData = useMemo(() => {
    const data = [];
    const baseDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0); // End of selected month
    for (let i = 89; i >= 0; i--) {
      const d = new Date(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate() - i);
      const dStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      let completedCount = 0;
      habits.forEach(h => { if(h.history[dStr]) completedCount++; });
      data.push({ 
        date: dStr, 
        count: completedCount, 
        level: habits.length > 0 ? (completedCount / habits.length) : 0,
        label: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      });
    }
    return data;
  }, [habits, currentMonth]);

  return (
    <div className="max-w-[1200px] mx-auto border-x border-[#2f3336] min-h-full bg-black text-[#eff3f4] p-5 md:p-6 space-y-6 pb-20 flex flex-col">
      
      {/* Visual Header / Summary */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 md:gap-6 border-b border-[#2f3336] pb-6 md:pb-8">
        <div className="text-center md:text-left">
          <h2 className="text-[22px] md:text-[28px] font-black leading-tight">
            Habit Consistency
          </h2>
          <p className="text-[#8b98a5] text-[11px] md:text-[14px] font-black uppercase tracking-tight">
            Tracking {habits.length} daily goals
          </p>
        </div>
        
        <div className="flex items-center gap-1 md:gap-2 bg-white/[0.03] p-1 md:p-1.5 rounded-2xl border border-white/10 backdrop-blur-md">
          <button 
            onClick={() => changeMonth(-1)}
            className="p-1.5 md:p-2 hover:bg-white/10 rounded-xl transition-all text-[#71767b] hover:text-[#eff3f4]"
          >
            <ChevronLeft className="w-4 h-4 md:w-5 md:h-5" />
          </button>
          <button 
            onClick={() => onMonthChange(getEffectiveDate())}
            className="px-2 md:px-3 py-1 md:py-1.5 rounded-xl transition-all text-[9px] md:text-[11px] font-black text-[#71767b] hover:text-[#eff3f4] bg-white/[0.05] border border-white/5 uppercase"
          >
            TODAY
          </button>
          <div className="relative group/month">
            <input 
              type="month" 
              className="absolute inset-0 opacity-0 cursor-pointer z-10"
              value={`${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}`}
              onChange={handleMonthSelect}
            />
            <div className="text-center min-w-[110px] md:min-w-[140px] px-2 md:px-4 py-1 md:py-1.5 rounded-xl group-hover/month:bg-white/5 transition-colors cursor-pointer border border-transparent group-hover/month:border-white/10">
              <span className="block text-[11px] md:text-[13px] font-black uppercase tracking-[0.1em] md:tracking-[0.2em] whitespace-nowrap">
                {monthYearLabel}
              </span>
            </div>
          </div>
          <button 
            onClick={() => changeMonth(1)}
            className="p-1.5 md:p-2 hover:bg-white/10 rounded-xl transition-all text-[#71767b] hover:text-[#eff3f4]"
          >
            <ChevronRight className="w-4 h-4 md:w-5 md:h-5" />
          </button>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <button 
            onClick={onAddHabit} 
            className="x-button-primary shrink-0 py-3.5 md:py-3 px-5 text-[14px] md:text-[15px]"
          >
            <Plus className="w-5 h-5 md:w-4 md:h-4" strokeWidth={3} />
            <span className="hidden md:inline">Add Habit</span>
          </button>
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#71767b]" />
            <input
              type="text"
              placeholder="Search habits..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-[#16181c] border border-[#2f3336] pl-10 pr-4 py-3.5 md:py-3 rounded-2xl text-[14px] text-[#eff3f4] placeholder-[#71767b] outline-none focus:border-[#1d9bf0] transition-all"
            />
          </div>
        </div>
      </div>

      {/* Yearly Heatmap (GitHub Style) */}
      <section className="space-y-3">
        <h3 className="text-[11px] font-black text-[#71767b] uppercase tracking-[0.3em] px-1 opacity-80">
          Activity Map (90 Days)
        </h3>
        <div ref={heatmapRef} className="bg-white/[0.02] border border-[#2f3336] p-3 md:p-5 pt-4 md:pt-5 rounded-2xl relative" style={{ overflowX: 'clip', overflowY: 'visible' }}>
          <div className="grid gap-[5px]" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(11px, 1fr))' }}>
            {heatmapData.map((d, i) => {
              // Edge detection: first 3 and last 3 cells in any row
              const isNearLeftEdge = i < 3;
              const isNearRightEdge = i > 86;
              const tooltipPositionClass = isNearLeftEdge 
                ? 'left-0' 
                : isNearRightEdge 
                  ? 'right-0'
                  : 'left-1/2 -translate-x-1/2';
              const arrowPositionClass = isNearLeftEdge
                ? 'left-1.5'
                : isNearRightEdge
                  ? 'right-1.5'
                  : 'left-1/2 -translate-x-1/2';
              const isActive = activeHeatmapCell === i;
              
              return (
                <div 
                  key={i}
                  onClick={() => handleCellTap(i)}
                  className={`aspect-square rounded-[2px] transition-all cursor-pointer relative group border
                    ${d.level === 0 ? 'bg-transparent border-[#2f3336]' : 
                      d.level < 0.3 ? 'bg-[#00ba7c]/20 border-[#00ba7c]/10' : 
                      d.level < 0.7 ? 'bg-[#00ba7c]/50 border-[#00ba7c]/20' : 
                      'bg-[#00ba7c] border-transparent'
                    }`}
                >
                  <div className={`absolute bottom-full ${tooltipPositionClass} mb-2 ${isActive ? 'flex' : 'hidden group-hover:flex'} flex-col ${isNearLeftEdge ? 'items-start' : isNearRightEdge ? 'items-end' : 'items-center'} pointer-events-none z-50 animate-slide-up`}>
                    <div className="px-3 py-1.5 bg-[#16181c] text-[#eff3f4] text-[11px] font-bold rounded-lg border border-[#2f3336] shadow-2xl whitespace-nowrap">
                      <div className="flex items-center gap-2">
                         <span className="text-[#71767b]">
                           {d.label}
                         </span>
                         <div className="w-1 h-1 rounded-full bg-[#2f3336]" />
                         <span className="text-[#00ba7c] font-black">{d.count} done</span>
                      </div>
                    </div>
                    <div className={`w-2 h-2 bg-[#16181c] border-r border-b border-[#2f3336] rotate-45 -mt-1 ${arrowPositionClass}`} />
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-4 flex items-center justify-end gap-2 text-[10px] font-black text-[#71767b]">
            <span>Less</span>
            <div className="flex gap-1">
              <div className="w-3 h-3 bg-transparent border border-[#2f3336] rounded-[1px]" />
              <div className="w-3 h-3 bg-[#00ba7c]/20 rounded-[1px]" />
              <div className="w-3 h-3 bg-[#00ba7c]/50 rounded-[1px]" />
              <div className="w-3 h-3 bg-[#00ba7c] rounded-[1px]" />
            </div>
            <span>More</span>
          </div>
        </div>
      </section>

      {/* Habit List - Balanced Row Layout */}
      {/* Habit List - Grouped by Time Phase to match Daily Habits */}
      <div className="flex flex-col gap-8 pb-32">
        {Object.entries(groupedByPhase).length === 0 && (
          <div className="text-center py-16 bg-white/[0.01] border border-dashed border-[#2f3336] rounded-3xl">
            <TrendingUp className="w-10 h-10 text-[#71767b]/40 mx-auto mb-4" />
            <p className="text-[#71767b] text-base font-bold">No habits tracked yet</p>
            <p className="text-[#71767b]/60 text-sm mt-1">Click "Add Habit" to start your journey!</p>
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
                    {phase.label} Phase
                  </span>
                  <div className="h-px w-12 bg-[#2f3336] hidden md:block" />
                  <span className="text-[10px] font-bold text-[#71767b] uppercase tracking-widest whitespace-nowrap">
                    {phaseHabits.length} {phaseHabits.length === 1 ? 'Habit' : 'Habits'}
                  </span>
                </div>
                <div className="flex-1 h-px bg-gradient-to-r from-[#2f3336] to-transparent" />
              </div>

              {/* Habit Cards in this Phase */}
              <div className="grid grid-cols-1 gap-4">
                {phaseHabits.map(habit => {
                  const totalMonthly = days.filter(d => habit.history[d.dateStr]).length;
                  const target = habit.monthlyTarget || days.length;
                  const completionRate = Math.min(Math.round((totalMonthly / target) * 100), 100);
                  
                  return (
                    <div 
                      key={habit.id} 
                      className="w-full flex flex-col md:flex-row md:items-center gap-4 p-4 md:p-5 rounded-2xl bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.05] hover:border-white/10 transition-all duration-300 group relative overflow-hidden"
                    >
                      {/* Background Progress Glow */}
                      <div 
                        className="absolute left-0 top-0 bottom-0 transition-all duration-1000 opacity-[0.03]" 
                        style={{ width: `${completionRate}%`, backgroundColor: phase.color }}
                      />

                      {/* Left Section: Progress Circle + Identity */}
                      <div className="flex items-center gap-4 flex-1 min-w-0 relative z-10">
                        <div className="relative w-11 h-11 md:w-12 md:h-12 shrink-0">
                          <svg className="w-full h-full -rotate-90" viewBox="0 0 48 48">
                            <circle cx="24" cy="24" r="21" fill="transparent" stroke="white" strokeOpacity="0.05" strokeWidth="4" />
                            <circle 
                              cx="24" cy="24" r="21" 
                              fill="transparent" 
                              stroke={phase.color} 
                              strokeWidth="4" 
                              strokeDasharray={2 * Math.PI * 21}
                              strokeDashoffset={2 * Math.PI * 21 * (1 - completionRate / 100)}
                              strokeLinecap="round"
                              className="transition-all duration-1000"
                            />
                          </svg>
                          <div className="absolute inset-0 flex items-center justify-center">
                            <span className="text-[10px] md:text-[11px] font-black" style={{ color: phase.color }}>{completionRate}%</span>
                          </div>
                        </div>

                        <div className="min-w-0">
                          <h4 className="text-[15px] md:text-[17px] font-black text-[#eff3f4] uppercase tracking-tight truncate">
                            {habit.name}
                          </h4>
                          <div className="flex items-center gap-2 mt-0.5">
                            <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: phase.color }} />
                            <span className="text-[10px] md:text-[11px] font-bold text-[#71767b] uppercase tracking-wider">{habit.category}</span>
                          </div>
                        </div>
                      </div>

                      {/* Right Section: Stats + Desktop Actions */}
                      <div className="flex items-center justify-between md:justify-end gap-6 relative z-10">
                        <div className="flex flex-col items-end">
                          <span className="text-[15px] md:text-[18px] font-black text-[#eff3f4] leading-none">
                            {totalMonthly}<span className="text-[11px] text-[#71767b]">/{target}</span>
                          </span>
                          <p className="text-[8px] md:text-[9px] font-black text-[#71767b] uppercase tracking-widest mt-1">Consistency</p>
                        </div>

                        <div className="flex items-center gap-1 border-l border-[#2f3336] pl-3">
                          <button 
                            onClick={(e) => { e.stopPropagation(); onEditHabit(habit.id); }}
                            className="p-2.5 text-[#71767b] hover:text-[#1d9bf0] hover:bg-[#1d9bf0]/10 rounded-xl transition-all"
                          >
                            <Edit2 className="w-4.5 h-4.5" />
                          </button>
                          <button 
                            onClick={(e) => { e.stopPropagation(); onDeleteHabit(habit.id); }}
                            className="p-2.5 text-[#71767b] hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all"
                          >
                            <Trash2 className="w-4.5 h-4.5" />
                          </button>
                        </div>
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
  );
};
