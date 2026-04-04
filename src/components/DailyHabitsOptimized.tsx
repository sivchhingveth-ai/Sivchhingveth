import React, { useMemo, useCallback } from 'react';
import useAppStore from '../store/appStore';
import { Habit } from '../types';
import { Circle, Flame, Target, ChevronDown, ChevronUp, Minus, Clock, ChevronLeft, ChevronRight } from 'lucide-react';
import { formatDateStr } from '../utils/dateUtils';
import { Tabs } from './Tabs';

interface DailyHabitsProps {
  habits: Habit[];
  onToggleHabit: (id: any, dateStr: string) => void;
  onLogout: () => void;
  filterPhase?: string | string[];
  startDate?: string;
  maxDate?: string;
}

// Time phase definitions
const TIME_PHASES = [
  { key: 'reset', label: 'Health', time: 'reset', icon: Target, color: '#34c759', emoji: '🌱' },
  { key: 'daily_rule', label: 'Eliminate', time: 'any', icon: Target, color: '#FF69B4', emoji: '🎯' },
  { key: 'growth', label: 'Growth', time: 'growth', icon: Target, color: '#bf7af0', emoji: '🚀' },
  { key: 'distraction', label: 'Discipline', time: 'distraction', icon: Target, color: '#1d9bf0', emoji: '🚫' },
  { key: 'spending', label: 'Boundary', time: 'spending', icon: Target, color: '#FFD700', emoji: '💰' },
] as const;

const getPhaseForHabit = (habit: Habit) => {
  if (!habit.time) return TIME_PHASES[0];
  const time = habit.time;
  // Find by time value - works for all category types
  const phase = TIME_PHASES.find(p => p.time === time);
  if (phase) return phase;
  // Fallback for legacy time strings
  if (time === '08:00') return TIME_PHASES[0]; // Health
  if (time === '14:00') return TIME_PHASES[2]; // Growth  
  if (time === '20:00' || time === '02:00') return TIME_PHASES[3]; // Discipline
  return TIME_PHASES[0];
};

const getCurrentPhaseKey = (): string | null => {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return 'reset';
  if (hour >= 12 && hour < 18) return 'growth';
  return 'distraction';
};

export const DailyHabits: React.FC<DailyHabitsProps> = ({
  habits, onToggleHabit, onLogout, filterPhase, startDate, maxDate
}) => {
  // Get state from Zustand store instead of props
  const activeTab = useAppStore((state) => state.activeTab);
  const isLoggingOut = useAppStore((state) => state.isLoggingOut);
  const historyDate = useAppStore((state) => state.historyDate);
  const now = useAppStore((state) => state.now);
  const storeTodayStr = useAppStore((state) => state.todayStr);
  const storeTodayDate = useAppStore((state) => state.todayDate);
  const tabs = ['To Do List', 'Add Workspace', 'History'];
  
  const isHistory = activeTab === 'History';
  const todayStr = isHistory ? historyDate : storeTodayStr;
  const todayDate = isHistory ? new Date(historyDate) : storeTodayDate;
  const currentPhaseKey = getCurrentPhaseKey();

  // Memoized grouped habits
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

    return groups.filter(g => {
      if (g.habits.length === 0) return false;
      if (filterPhase) {
        if (Array.isArray(filterPhase)) {
          return filterPhase.includes(g.phase.key);
        }
        return g.phase.key === filterPhase;
      }
      return true;
    });
  }, [habits, filterPhase]);

  const visibleHabits = useMemo(() => {
    return groupedByPhase.flatMap(g => g.habits);
  }, [groupedByPhase]);

  const completedCount = visibleHabits.filter(h => h.history[todayStr]).length;
  const totalCount = visibleHabits.length;
  const completionPct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  // Optimized streak calculation with early exit
  const currentStreak = useMemo(() => {
    if (totalCount === 0) return 0;
    let streak = 0;
    const d = new Date(todayDate);
    
    const todayStr = formatDateStr(d);
    const todayCompleted = visibleHabits.every(h => h.history[todayStr]);
    if (todayCompleted) streak++;
    
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
  const ChipIcon = activePhase ? activePhase.icon : Circle;

  let globalIdx = 0;

  return (
    <div className="flex flex-col relative w-full h-full">
      <div className="sticky top-0 z-20 bg-black/80 backdrop-blur-xl border-b border-[#2f3336]">
        <Tabs tabs={tabs} activeTab={activeTab} onTabChange={(tab) => useAppStore.getState().setActiveTab(tab)} onLogout={onLogout} isLoggingOut={isLoggingOut} />
      </div>

      {isHistory && (
        <div className="bg-[#16181c] border-b border-[#2f3336] p-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            {startDate !== todayStr ? (
              <button 
                onClick={() => {
                  const d = new Date(todayStr);
                  d.setDate(d.getDate() - 1);
                  useAppStore.getState().setHistoryDate(formatDateStr(d));
                }}
                className="w-10 h-10 rounded-full hover:bg-white/5 flex items-center justify-center transition-colors text-[#71767b] hover:text-[#eff3f4] touch-manipulation"
                style={{ touchAction: 'manipulation' }}
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
                  useAppStore.getState().setHistoryDate(formatDateStr(d));
                }}
                className="w-10 h-10 rounded-full hover:bg-white/5 flex items-center justify-center transition-colors text-[#71767b] hover:text-[#eff3f4] touch-manipulation"
                style={{ touchAction: 'manipulation' }}
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
          <div className="min-w-0">
            <h2 className="text-[18px] md:text-[22px] font-black text-[#eff3f4] leading-tight tracking-tight">
              {activeTab}
            </h2>
            {!isHistory && (
              <div className="flex items-center gap-2 mt-0.5">
                <Clock className="w-3 h-3 text-[#71767b] shrink-0" />
                <span className="text-[#8b98a5] text-[9px] md:text-[11px] font-black uppercase tracking-[0.15em]">
                  {now.toLocaleDateString('en-US', { weekday: 'short' })}, {now.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} · {now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })}
                </span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 md:gap-4 shrink-0">
            <div className="bg-[#16181c] border border-[#2f3336] rounded-xl p-1.5 md:p-2 flex items-center gap-2 shadow-xl flex-1 md:flex-none justify-center md:justify-start">
                <div 
                  className="w-6 h-6 md:w-8 md:h-8 rounded-lg border flex items-center justify-center transition-colors"
                  style={{ backgroundColor: `${chipColor}10`, borderColor: `${chipColor}20` }}
                >
                  <ChipIcon className="w-3.5 h-3.5 md:w-4 md:h-4" style={{ color: chipColor }} />
                </div>
              <div className="text-right pr-1">
                <p className="text-[13px] md:text-[15px] font-black text-[#eff3f4] leading-none">
                  {completedCount}<span className="text-[#71767b] text-[9px] md:text-[11px]">/{totalCount}</span>
                </p>
                <p className="text-[7px] md:text-[8px] font-bold text-[#71767b] uppercase mt-0.5 tracking-wider">Done</p>
              </div>
            </div>

            <div className="bg-[#16181c] border border-[#2f3336] rounded-xl p-1.5 md:p-2 flex items-center gap-2 shadow-xl flex-1 md:flex-none justify-center md:justify-start">
              <div className="w-6 h-6 md:w-8 md:h-8 rounded-lg bg-[#ff6b00]/10 border border-[#ff6b00]/20 flex items-center justify-center">
                <Flame className="w-3.5 h-3.5 md:w-4 md:h-4 text-[#ff6b00] animate-fire" />
              </div>
              <div className="text-right pr-1">
                <p className="text-[13px] md:text-[15px] font-black text-[#eff3f4] leading-none">{currentStreak}</p>
                <p className="text-[7px] md:text-[8px] font-bold text-[#71767b] uppercase mt-0.5 tracking-wider">Streak</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="p-5 md:p-6 space-y-7" style={{ paddingBottom: 'max(8rem, env(safe-area-inset-bottom) + 4rem)' }}>
        {totalCount === 0 && (
          <div className="text-center py-16">
            <Circle className="w-10 h-10 text-[#71767b]/40 mx-auto mb-4" />
            <p className="text-[#71767b] text-base font-bold">No {activeTab} tracked yet</p>
            <p className="text-[#71767b]/60 text-sm mt-1">Go to Add Workspace to add your first {activeTab.toLowerCase()}!</p>
          </div>
        )}

        {groupedByPhase.map((phaseGroup) => {
          const { phase, habits: phaseHabits } = phaseGroup as { phase: typeof TIME_PHASES[number]; habits: Habit[] };
          const isCurrentPhase = !isHistory && (filterPhase ? phase.key === filterPhase : phase.key === currentPhaseKey);
          const phaseCompleted = phaseHabits.filter(h => h.history[todayStr]).length;

          return (
            <div key={phase.key} className="space-y-1.5">
              <div className={`flex items-center gap-3 px-1 mb-1.5 py-1 rounded-xl ${isCurrentPhase ? 'bg-white/[0.02]' : ''}`}>
                <div className="flex items-center gap-3 min-w-0">
                  <span className="text-[11px] md:text-[13px] font-black uppercase tracking-[0.2em] leading-none" style={{ color: isHistory ? '#71767b' : phase.color }}>
                    {phase.label.toUpperCase()}
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
                {phaseHabits.map((habit) => {
                  const isDone = !!habit.history[todayStr];
                  // Cap animation delay at 10 items to prevent mobile performance issues
                  const animationDelay = `${Math.min(globalIdx++, 10) * 50}ms`;
                  return (
                    <div
                      key={habit.id}
                      className="animate-pop-in fill-mode-backwards"
                      style={{ animationDelay, willChange: 'transform, opacity' }}
                    >
                      <button
                        id={`habit-${habit.id}`}
                        onClick={() => {
                          if (!isHistory) onToggleHabit(habit.id, todayStr);
                        }}
                        className={`w-full flex items-center gap-3 md:gap-4 p-3 md:p-4 rounded-2xl transition-all duration-300 group border bit-click-spring touch-manipulation ${isDone
                          ? 'border-transparent'
                          : 'bg-transparent border-[#2f3336] hover:bg-white/[0.02] hover:border-white/10'
                          } ${isHistory ? 'cursor-default' : ''}`}
                        style={{
                          backgroundColor: isDone ? (isHistory ? '#71767b20' : `${phase.color}15`) : 'transparent',
                          touchAction: 'manipulation'
                        } as React.CSSProperties}
                        disabled={isHistory}
                      >
                        <div className={`w-7 h-7 md:w-8 md:h-8 rounded-full flex items-center justify-center shrink-0 transition-all duration-300 border-2 ${isDone
                          ? 'border-transparent scale-100 animate-check-pop'
                          : 'border-[#2f3336] group-hover:border-[#71767b]'
                          }`}
                          style={isDone ? { 
                            backgroundColor: isHistory ? '#71767b' : phase.color, 
                            boxShadow: isHistory ? 'none' : `0 0 16px ${phase.color}44`,
                            willChange: 'transform'
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
                                <Flame className="w-2.5 h-2.5 text-[#ff6b00] animate-fire" />
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
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
