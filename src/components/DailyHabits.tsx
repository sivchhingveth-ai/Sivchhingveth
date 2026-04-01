import React, { useMemo, useState } from 'react';
import { Habit } from '../types';
import { Circle, Flame, Target, Sparkles, Sun, CloudSun, Moon, Stars, ChevronDown, ChevronUp, Minus, Clock, CircleDollarSign, ChevronLeft, ChevronRight, Filter, ChevronRight as ChevronRightIcon } from 'lucide-react';
import { getEffectiveDateStr, getEffectiveDate, formatDateStr } from '../utils/dateUtils';
import { Tabs } from './Tabs';

interface DailyHabitsProps {
  habits: Habit[];
  onToggleHabit: (id: any, dateStr: string) => void;
  // Navigation props
  tabs: string[];
  activeTab: string;
  onTabChange: (tab: string) => void;
  onLogout: () => void;
  isLoggingOut: boolean;
  filterPhase?: string | string[];
  historyDate?: string;
  onDateChange?: (dateStr: string) => void;
  startDate?: string;
  maxDate?: string;
}

// Time phase definitions
const TIME_PHASES = [
  { key: 'reset', label: 'Reset', time: 'reset', icon: Sun, color: '#34c759', emoji: '🌱' },
  { key: 'daily_rule', label: 'Rules', time: 'any', icon: Circle, color: '#1d9bf0', emoji: '🎯' },
  { key: 'growth', label: 'Growth', time: 'growth', icon: Target, color: '#bf7af0', emoji: '🚀' },
  { key: 'distraction', label: 'Distraction', time: 'distraction', icon: Sparkles, color: '#ff3b30', emoji: '🚫' },
  { key: 'spending', label: 'Spending', time: 'spending', icon: CircleDollarSign, color: '#ff9500', emoji: '💰' },
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

// Phase selection is no longer strictly time-based as requested
const getCurrentPhaseKey = (): string | null => {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return 'reset';
  if (hour >= 12 && hour < 18) return 'growth';
  return 'distraction';
};

export const DailyHabits: React.FC<DailyHabitsProps> = ({
  habits, onToggleHabit,
  tabs, activeTab, onTabChange, onLogout, isLoggingOut, filterPhase,
  historyDate, onDateChange, startDate, maxDate
}) => {
  const isHistory = !!historyDate;
  const todayStr = isHistory ? historyDate : getEffectiveDateStr();
  const todayDate = isHistory ? new Date(historyDate) : getEffectiveDate();
  const currentPhaseKey = getCurrentPhaseKey();
  const [now, setNow] = React.useState(new Date());
  
  // Category dropdown state and priority ordering
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [priorityCategory, setPriorityCategory] = useState<string | null>(null);
  
  // Track scroll position to maintain it during reordering
  const scrollPositionRef = React.useRef(0);

  React.useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);
  
  // Restore scroll position after reordering
  React.useEffect(() => {
    if (scrollPositionRef.current > 0) {
      window.scrollTo(0, scrollPositionRef.current);
      scrollPositionRef.current = 0;
    }
  }, [priorityCategory]);

  // Group habits by time phase with priority ordering
  const groupedByPhase = useMemo(() => {
    const groups: { phase: typeof TIME_PHASES[number]; habits: Habit[] }[] = TIME_PHASES.map(p => ({
      phase: p,
      habits: [],
    }));

    habits.forEach(h => {
      const phase = getPhaseForHabit(h);
      const group = groups.find(g => g.phase.key === phase.key);
      if (group) group.habits.push(h);
    });

    // Filter out empty groups
    const nonEmptyGroups = groups.filter(g => g.habits.length > 0);
    
    // If there's a priority category, move it to the front
    if (priorityCategory) {
      const priorityIndex = nonEmptyGroups.findIndex(g => g.phase.key === priorityCategory);
      if (priorityIndex > 0) {
        const priorityGroup = nonEmptyGroups.splice(priorityIndex, 1)[0];
        nonEmptyGroups.unshift(priorityGroup);
      }
    }
    
    return nonEmptyGroups;
  }, [habits, priorityCategory]);

  // Derived habits to show based on filter
  const visibleHabits = useMemo(() => {
    return groupedByPhase.flatMap(g => g.habits);
  }, [groupedByPhase]);

  // Stats for today
  const completedCount = visibleHabits.filter(h => h.history[todayStr]).length;
  const totalCount = visibleHabits.length;
  const completionPct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  // Streak: consecutive days up to today
  const currentStreak = useMemo(() => {
    if (totalCount === 0) return 0;
    let streak = 0;
    const d = new Date(todayDate);
    
    // If today is completed, it counts toward the streak
    const todayStr = formatDateStr(d);
    const todayCompleted = visibleHabits.every(h => h.history[todayStr]);
    if (todayCompleted) streak++;
    
    // Check previous days consecutively
    d.setDate(d.getDate() - 1);
    for (let i = 0; i < 365; i++) {
      const dStr = formatDateStr(d);
      const allDone = visibleHabits.every(h => h.history[dStr]);
      if (allDone) {
        streak++;
        d.setDate(d.getDate() - 1);
      } else {
        break;
      }
    }
    return streak;
  }, [visibleHabits, totalCount, todayDate]);

  const activePhase = filterPhase ? TIME_PHASES.find(p => p.key === filterPhase) : null;
  const chipColor = activePhase ? (isHistory ? '#71767b' : activePhase.color) : '#eff3f4';
  const ChipIcon = activePhase ? activePhase.icon : Target;

  let globalIdx = 0;

  return (
    <div className="flex flex-col relative w-full h-full">

      {/* Header with inline navigation + stats */}
      <div className="sticky top-0 z-20 bg-black/80 backdrop-blur-xl border-b border-[#2f3336]">
        <Tabs tabs={tabs} activeTab={activeTab} onTabChange={onTabChange} onLogout={onLogout} isLoggingOut={isLoggingOut} />
      </div>

      {/* History Date Picker (if in history mode) */}
      {isHistory && (
        <div className="bg-[#16181c] border-b border-[#2f3336] p-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            {startDate !== todayStr ? (
              <button 
                onClick={() => {
                  const d = new Date(todayStr);
                  d.setDate(d.getDate() - 1);
                  onDateChange?.(formatDateStr(d));
                }}
                className="w-10 h-10 rounded-full hover:bg-white/5 flex items-center justify-center transition-colors text-[#71767b] hover:text-[#eff3f4]"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
            ) : (
              <div className="w-10 h-10" />
            )}
          </div>
          
          <div className="flex flex-col items-center">
            <span className="text-[#eff3f4] font-black text-sm">{formatDateStr(new Date(todayStr))}</span>
            <span className="text-[#8b98a5] text-[10px] font-bold uppercase tracking-widest">{new Date(todayStr).toLocaleDateString(undefined, { weekday: 'long' })}</span>
          </div>

          <div className="flex items-center gap-4">
            {maxDate !== todayStr ? (
              <button 
                 onClick={() => {
                  const d = new Date(todayStr);
                  d.setDate(d.getDate() + 1);
                  onDateChange?.(formatDateStr(d));
                }}
                className="w-10 h-10 rounded-full hover:bg-white/5 flex items-center justify-center transition-colors text-[#71767b] hover:text-[#eff3f4]"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            ) : (
              <div className="w-10 h-10" />
            )}
          </div>
        </div>
      )}

      <div>
        <div className="px-5 py-3 md:px-6 md:py-4 flex flex-col md:flex-row md:items-center justify-between gap-2 md:gap-4 border-b border-[#2f3336]">
          <div className="min-w-0 flex items-center gap-3">
            {/* Category Filter Button */}
            <div className="relative">
              <button
                onClick={() => setShowCategoryDropdown(!showCategoryDropdown)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#16181c] border border-[#2f3336] hover:bg-[#1f2126] transition-all"
              >
                <Filter className="w-3.5 h-3.5 text-[#71767b]" />
                <span className="text-[11px] font-bold text-[#71767b] uppercase tracking-wider">
                  Categories
                </span>
                <ChevronRightIcon className={`w-3 h-3 text-[#71767b] transition-transform ${showCategoryDropdown ? 'rotate-90' : ''}`} />
              </button>
              
              {/* Category Dropdown */}
              <div 
                className={`absolute top-full left-0 mt-2 w-[220px] bg-[#16181c] border border-[#2f3336] rounded-xl shadow-2xl z-50 overflow-hidden transition-all duration-300 ease-out origin-top-left ${
                  showCategoryDropdown ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 -translate-y-2 pointer-events-none'
                }`}
              >
                <div className="py-1">
                  {TIME_PHASES.map((phase, index) => {
                    const PhaseIcon = phase.icon;
                    const isLast = index === TIME_PHASES.length - 1;
                    return (
                      <button
                        key={phase.key}
                        onClick={() => {
                          setShowCategoryDropdown(false);
                          // Save current scroll position before reordering
                          scrollPositionRef.current = window.scrollY;
                          setPriorityCategory(phase.key);
                        }}
                        className={`w-full px-4 py-3 text-left text-[13px] font-bold flex items-center gap-3 transition-all duration-200 hover:bg-white/5 hover:scale-[1.02] active:scale-[0.98] group ${!isLast ? 'border-b border-[#2f3336]' : ''}`}
                        style={{ 
                          color: phase.color,
                          animationDelay: `${index * 50}ms`
                        }}
                      >
                        <PhaseIcon 
                          className="w-4 h-4 transition-transform duration-200 group-hover:scale-110"
                          style={{ color: phase.color }}
                        />
                        <span className="group-hover:translate-x-1 transition-transform duration-200">{phase.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
            
            {!isHistory && (
              <div className="flex items-center gap-2">
                <Clock className="w-3 h-3 text-[#71767b] shrink-0" />
                <span className="text-[#8b98a5] text-[9px] md:text-[11px] font-black uppercase tracking-[0.15em]">
                  {now.toLocaleDateString('en-US', { weekday: 'short' })}, {now.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} &middot; {now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })}
                </span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 md:gap-4 shrink-0">
            {/* Done Chip */}
            <div className="bg-[#16181c] border border-[#2f3336] rounded-xl p-1.5 md:p-2 flex items-center gap-2 shadow-xl flex-1 md:flex-none justify-center md:justify-start">
                <div 
                  className="w-6 h-6 md:w-8 md:h-8 rounded-lg border flex items-center justify-center transition-colors"
                  style={{ backgroundColor: `${chipColor}10`, borderColor: `${chipColor}20` }}
                >
                  <Target className="w-3.5 h-3.5 md:w-4 md:h-4 transition-colors" style={{ color: chipColor }} />
                </div>
              <div className="text-right pr-1">
                <p className="text-[13px] md:text-[15px] font-black text-[#eff3f4] leading-none">
                  {completedCount}<span className="text-[#71767b] text-[9px] md:text-[11px]">/{totalCount}</span>
                </p>
                <p className="text-[7px] md:text-[8px] font-bold text-[#71767b] uppercase mt-0.5 tracking-wider">Done</p>
              </div>
            </div>

            {/* Streak Chip */}
            <div className="bg-[#16181c] border border-[#2f3336] rounded-xl p-1.5 md:p-2 flex items-center gap-2 shadow-xl flex-1 md:flex-none justify-center md:justify-start">
              <div className="w-6 h-6 md:w-8 md:h-8 rounded-lg bg-[#ff6b00]/10 border border-[#ff6b00]/20 flex items-center justify-center">
                <Flame className="w-3.5 h-3.5 md:w-4 md:h-4 text-[#ff6b00]" />
              </div>
              <div className="text-right pr-1">
                <p className="text-[13px] md:text-[15px] font-black text-[#eff3f4] leading-none">{currentStreak}</p>
                <p className="text-[7px] md:text-[8px] font-bold text-[#71767b] uppercase mt-0.5 tracking-wider">Streak</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="p-5 md:p-6 space-y-7 pb-32">
        {totalCount === 0 && (
          <div className="text-center py-16">
            <Sparkles className="w-10 h-10 text-[#71767b]/40 mx-auto mb-4" />
            <p className="text-[#71767b] text-base font-bold">No {activeTab} tracked yet</p>
            <p className="text-[#71767b]/60 text-sm mt-1">Go to Add Workspace to add your first {activeTab.toLowerCase()}!</p>
          </div>
        )}

        {groupedByPhase.map((phaseGroup) => {
          const { phase, habits: phaseHabits } = phaseGroup as { phase: typeof TIME_PHASES[number]; habits: Habit[] };
          const isCurrentPhase = !isHistory && (filterPhase ? phase.key === filterPhase : phase.key === currentPhaseKey);
          const phaseCompleted = phaseHabits.filter(h => h.history[todayStr]).length;

          return (
            <div key={phase.key} id={`phase-${phase.key}`} className="space-y-1.5 scroll-mt-20">
              <div className={`flex items-center gap-3 px-1 mb-1.5 py-1 rounded-xl ${isCurrentPhase ? 'bg-white/[0.02]' : ''}`}>
                <div className="flex items-center gap-3 min-w-0">
                  <span className="text-[11px] md:text-[13px] font-black uppercase tracking-[0.2em] leading-none" style={{ color: isHistory ? '#71767b' : phase.color }}>
                    {phase.label}
                  </span>
                  {isCurrentPhase && (
                    <span className="text-[8px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-full animate-pulse"
                      style={{ backgroundColor: `${phase.color}20`, color: phase.color }}>
                      Now
                    </span>
                  )}
                </div>
                <div className="flex-1 h-px bg-[#2f3336]" />
                <span className="text-[10px] font-black text-[#71767b] uppercase tracking-wider">
                  {phaseHabits.length} {phaseHabits.length === 1 ? 'CATEGORY' : 'CATEGORIES'}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-3">
                {phaseHabits.length === 0 ? (
                  <div className="col-span-1 md:col-span-2 py-4 px-4 rounded-xl bg-[#16181c]/50 border border-[#2f3336]/50">
                    <span className="text-[11px] font-bold text-[#71767b]/60 uppercase tracking-wider">No tasks yet</span>
                  </div>
                ) : (
                  phaseHabits.map((habit) => {
                  const isDone = !!habit.history[todayStr];
                  const animationDelay = `${globalIdx++ * 60}ms`;
                  return (
                    <div
                      key={habit.id}
                      className="animate-pop-in fill-mode-backwards"
                      style={{ animationDelay }}
                    >
                      <button
                        id={`habit-${habit.id}`}
                        onClick={() => {
                          if (!isHistory) onToggleHabit(habit.id, todayStr);
                        }}
                        className={`w-full flex items-center gap-3 md:gap-4 p-3 md:p-4 rounded-2xl transition-all duration-300 group border bit-click-spring ${isDone
                          ? 'border-transparent'
                          : 'bg-transparent border-[#2f3336] hover:bg-white/[0.02] hover:border-white/10'
                          } ${isHistory ? 'cursor-default' : ''}`}
                        style={{
                          backgroundColor: isDone ? (isHistory ? '#71767b20' : `${phase.color}15`) : 'transparent',
                        } as React.CSSProperties}
                        disabled={isHistory}
                      >
                        <div className={`w-7 h-7 md:w-8 md:h-8 rounded-full flex items-center justify-center shrink-0 transition-all duration-300 border-2 ${isDone
                          ? 'border-transparent scale-100 animate-check-pop'
                          : 'border-[#2f3336] group-hover:border-[#71767b]'
                          }`}
                          style={isDone ? { 
                            backgroundColor: isHistory ? '#71767b' : phase.color, 
                            boxShadow: isHistory ? 'none' : `0 0 16px ${phase.color}44` 
                          } : {}}
                        >
                          {isDone ? (
                            <svg className="w-4 h-4 text-white animate-check-mark" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="20 6 9 17 4 12" className="check-mark-path" />
                            </svg>
                          ) : (
                            <Circle className="w-4 h-4 text-[#2f3336] group-hover:text-[#71767b] transition-colors" />
                          )}
                        </div>

                        <div className="flex-1 text-left min-w-0">
                          <div className="flex items-center gap-2">
                            <p className={`text-[14px] md:text-[15px] font-bold transition-all duration-300 ease-in-out truncate ${isDone ? 'text-[#71767b] opacity-60 line-through' : 'text-[#eff3f4]'
                              }`}>
                               {habit.name.toUpperCase()}
                            </p>
                            {habit.streak > 0 && (
                              <div className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-[#ff6b00]/10 border border-[#ff6b00]/20 shrink-0">
                                <Flame className="w-2.5 h-2.5 text-[#ff6b00]" />
                                <span className="text-[9px] font-black text-[#ff6b00]">{habit.streak}</span>
                              </div>
                            )}
                          </div>
                        </div>

                        {isDone && (
                          <div className="shrink-0 animate-fade-in flex items-center justify-center">
                            <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: isHistory ? '#71767b' : phase.color }} />
                          </div>
                        )}
                      </button>
                    </div>
                  );
                })
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
