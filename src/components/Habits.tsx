import React, { useMemo, useState, useEffect, useCallback, useRef } from 'react';
import { Habit } from '../types';
import { Edit2, Trash2, Check, Plus, ChevronLeft, ChevronRight, Activity, TrendingUp } from 'lucide-react';
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

export const Habits: React.FC<HabitsProps> = ({ habits, onToggleHabit, onDeleteHabit, onAddHabit, onEditHabit, currentMonth, onMonthChange }) => {
  const [activeHeatmapCell, setActiveHeatmapCell] = useState<number | null>(null);
  const heatmapRef = useRef<HTMLDivElement>(null);

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

  const sortedCategoryNames = ['HEALTH', 'HYGIENE', 'RECOVERY', 'BODY', 'FINANCE', 'LEARNING', 'OTHER'];

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
    <div className="w-full bg-black text-[#eff3f4] p-6 space-y-6 pb-20">
      
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

        <button 
          onClick={onAddHabit} 
          className="x-button-primary w-full md:w-auto text-[14px] md:text-[15px]"
        >
          <Plus className="w-4 h-4" strokeWidth={3} />
          Add Habit
        </button>
      </div>

      {/* Yearly Heatmap (GitHub Style) */}
      <section className="space-y-4">
        <h3 className="text-[12px] font-black text-[#71767b] uppercase tracking-[0.3em] px-1">
          Activity Map (90 Days)
        </h3>
        <div ref={heatmapRef} className="bg-white/[0.02] border border-[#2f3336] p-4 md:p-6 pt-10 md:pt-12 rounded-3xl relative" style={{ overflowX: 'clip', overflowY: 'visible' }}>
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
      <div className="flex flex-col gap-3">
        {habits.map(habit => {
          const totalMonthly = days.filter(d => habit.history[d.dateStr]).length;
          const target = habit.monthlyTarget || days.length;
          const completionRate = Math.min(Math.round((totalMonthly / target) * 100), 100);
          const style = getCategoryStyles(habit.category);
          
          return (
            <div key={habit.id} className="bg-white/[0.02] border border-[#2f3336] rounded-xl p-2 md:p-3.5 hover:bg-white/[0.04] transition-all group relative flex flex-col md:flex-row md:items-center overflow-hidden gap-1.5 md:gap-4">
               {/* Background Water Fill Effect */}
               <div className="absolute inset-0 overflow-hidden pointer-events-none">
                 <div 
                    className="absolute bottom-0 left-0 right-0 transition-all duration-1000 opacity-5" 
                    style={{ height: `${completionRate}%`, backgroundColor: style.hex }}
                 />
               </div>

               <div className="relative z-10 flex items-center justify-between md:justify-start md:w-[320px] shrink-0 gap-2 md:gap-4">
                  <div className="flex items-center gap-3 md:gap-4 min-w-0">
                    <div className="relative w-10 md:w-12 h-10 md:h-12 shrink-0">
                      <svg className="w-full h-full -rotate-90" viewBox="0 0 48 48">
                        <circle cx="24" cy="24" r="21" fill="transparent" stroke="white" strokeOpacity="0.05" strokeWidth="4" />
                        <circle 
                          cx="24" cy="24" r="21" 
                          fill="transparent" 
                          stroke={style.hex} 
                          strokeWidth="4" 
                          strokeDasharray={2 * Math.PI * 21}
                          strokeDashoffset={2 * Math.PI * 21 * (1 - completionRate / 100)}
                          strokeLinecap="round"
                          className="transition-all duration-1000"
                        />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-[10px] md:text-[11px] font-black">{completionRate}%</span>
                      </div>
                    </div>

                    <div className="overflow-hidden">
                      <h4 className="text-[15px] font-black text-[#eff3f4] uppercase tracking-tight truncate leading-tight">
                        {habit.name}
                      </h4>
                    </div>
                  </div>
                  
                  {/* Actions (visible on mobile next to identity) */}
                  <div className="flex gap-0.5 md:hidden">
                    <button 
                      onClick={(e) => { e.stopPropagation(); onEditHabit(habit.id); }}
                      className="p-2 text-[#71767b] hover:text-x-blue transition-all"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={(e) => { e.stopPropagation(); onDeleteHabit(habit.id); }}
                      className="p-2 text-[#71767b] hover:text-red-500 transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
               </div>



               {/* RIGHT SECTION: Stats & Desktop Actions */}
                <div className="flex items-center justify-between md:justify-end gap-2 md:gap-6 md:ml-auto shrink-0 w-full md:w-auto mt-0 md:mt-0">
                  <div className="flex-1 md:w-[120px] space-y-1">
                    <div className="flex justify-between items-end">
                      <span className="text-[14px] md:text-[16px] font-black text-[#eff3f4]">
                        {totalMonthly}<span className="text-[10px] md:text-[11px] text-[#71767b]">/{target}</span>
                      </span>
                      <span className="text-[9px] font-black text-[#71767b] uppercase tracking-tighter">
                        {habit.monthlyTarget ? 'Target' : 'Monthly'}
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-white/[0.03] border border-white/20 rounded-full overflow-hidden">
                       <div className="h-full transition-all duration-1000" style={{ width: `${completionRate}%`, backgroundColor: style.hex }} />
                    </div>
                  </div>

                  <div className="hidden md:flex gap-0.5 border-l border-[#2f3336] pl-3">
                    <button 
                      onClick={(e) => { e.stopPropagation(); onEditHabit(habit.id); }}
                      className="p-2 text-[#71767b] hover:text-x-blue transition-all opacity-40 group-hover:opacity-100"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={(e) => { e.stopPropagation(); onDeleteHabit(habit.id); }}
                      className="p-2 text-[#71767b] hover:text-red-500 transition-all opacity-40 group-hover:opacity-100"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
               </div>
            </div>
          );
        })}
      </div>



    </div>
  );
};
