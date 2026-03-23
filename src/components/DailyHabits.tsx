import React, { useMemo } from 'react';
import { Habit } from '../types';
import { Circle, Flame, Target, Sparkles, Sun, CloudSun, Moon, Stars, ChevronDown, ChevronUp, Minus, Clock } from 'lucide-react';
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
}

// Time phase definitions
const TIME_PHASES = [
  { key: 'morning', label: 'Morning', time: '08:00', range: '5 AM – 12 PM', icon: Sun, color: '#ffad1f', emoji: '☀️' },
  { key: 'afternoon', label: 'Afternoon', time: '14:00', range: '12 PM – 6 PM', icon: CloudSun, color: '#ff6b00', emoji: '🌤️' },
  { key: 'night', label: 'Night', time: '20:00', range: '6 PM – 12 AM', icon: Moon, color: '#7856ff', emoji: '🌙' },
  { key: 'midnight', label: 'Midnight', time: '02:00', range: '12 AM – 5 AM', icon: Stars, color: '#1d9bf0', emoji: '🌑' },
  { key: 'daily_rule', label: 'Daily Rule', time: 'any', range: 'Anytime', icon: Target, color: '#34c759', emoji: '🎯' },
] as const;

const getPhaseForHabit = (habit: Habit) => {
  if (!habit.time) return TIME_PHASES[0]; // Default to morning
  const phase = TIME_PHASES.find(p => p.time === habit.time);
  return phase || TIME_PHASES[0];
};

// Get which phase is currently active based on real clock time
const getCurrentPhaseKey = (): string => {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 18) return 'afternoon';
  if (hour >= 18 && hour < 24) return 'night';
  return 'midnight'; // 0-4
};

export const DailyHabits: React.FC<DailyHabitsProps> = ({
  habits, onToggleHabit,
  tabs, activeTab, onTabChange, onLogout, isLoggingOut
}) => {
  const todayStr = getEffectiveDateStr();
  const todayDate = getEffectiveDate();
  const currentPhaseKey = getCurrentPhaseKey();
  const [focusedHabitId, setFocusedHabitId] = React.useState<string | null>(null);
  const [canScrollMore, setCanScrollMore] = React.useState(true);
  const [now, setNow] = React.useState(new Date());

  React.useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Stats for today
  const completedCount = habits.filter(h => h.history[todayStr]).length;
  const totalCount = habits.length;
  const completionPct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  // Group habits by time phase
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

    // Only return phases that have habits
    return groups.filter(g => g.habits.length > 0);
  }, [habits]);

  // Scroll to Pending Tool Logic
  const pendingHabitList = useMemo(() => {
    return groupedByPhase.flatMap(group => group.habits).filter(h => !h.history[todayStr]);
  }, [groupedByPhase, todayStr]);

  // Use a refined position detection to toggle the tool state
  React.useEffect(() => {
    const scrollContainer = document.querySelector('main');
    const checkVisibility = () => {
      if (pendingHabitList.length === 0) {
        setCanScrollMore(false);
        return;
      }

      const center = window.innerHeight / 2;
      const lastId = pendingHabitList[pendingHabitList.length - 1].id;
      const el = document.getElementById(`habit-${lastId}`);
      const rect = el?.getBoundingClientRect();

      // If the last habit is already above the center line + small buffer, we can't scroll "down" anymore
      if (rect && rect.top <= center + 50) setCanScrollMore(false);
      else setCanScrollMore(true);
    };

    scrollContainer?.addEventListener('scroll', checkVisibility, { passive: true });
    checkVisibility(); // Initial check
    return () => scrollContainer?.removeEventListener('scroll', checkVisibility);
  }, [pendingHabitList]);

  const handleScrollToPending = () => {
    if (pendingHabitList.length === 0) return;

    // Position-aware down-only logic
    const viewportCenter = window.innerHeight / 2;
    const targetHabit = pendingHabitList.find(h => {
      const el = document.getElementById(`habit-${h.id}`);
      const top = el?.getBoundingClientRect().top ?? 0;
      // Find the first pending habit that is significantly below the center
      return top > viewportCenter + 40; 
    });

    const main = document.querySelector('main');
    if (targetHabit && main) {
      setFocusedHabitId(targetHabit.id);
      const el = document.getElementById(`habit-${targetHabit.id}`);
      if (el) {
        const elRect = el.getBoundingClientRect();
        const mainRect = main.getBoundingClientRect();
        main.scrollTo({
          top: main.scrollTop + (elRect.top - mainRect.top) - (mainRect.height / 2) + (elRect.height / 2),
          behavior: 'smooth'
        });
      }
    } else if (main) {
      // If we're already at the end of the scrollable pending habits, reset to top
      main.scrollTo({ top: 0, behavior: 'smooth' });
      setFocusedHabitId(null);
    }
  };
  // Streak: consecutive days up to today
  const currentStreak = useMemo(() => {
    if (totalCount === 0) return 0;
    let streak = 0;
    const d = new Date(todayDate);
    
    // If today is completed, it counts toward the streak
    const todayStr = formatDateStr(d);
    const todayCompleted = habits.every(h => h.history[todayStr]);
    if (todayCompleted) streak++;
    
    // Check previous days consecutively
    d.setDate(d.getDate() - 1);
    for (let i = 0; i < 365; i++) {
      const dStr = formatDateStr(d);
      const allDone = habits.every(h => h.history[dStr]);
      if (allDone) {
        streak++;
        d.setDate(d.getDate() - 1);
      } else {
        break;
      }
    }
    return streak;
  }, [habits, totalCount, todayDate]);

  const longPressTimer = React.useRef<NodeJS.Timeout | null>(null);
  const isLongPressRef = React.useRef(false);
  const [showTopSignal, setShowTopSignal] = React.useState(false);

  const handlePointerDown = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
    }
    isLongPressRef.current = false;
    longPressTimer.current = setTimeout(() => {
      const scrollTarget = document.querySelector('main') || window;
      scrollTarget.scrollTo({ top: 0, behavior: 'smooth' });
      setFocusedHabitId(null);
      isLongPressRef.current = true;
      setShowTopSignal(true);
      setTimeout(() => setShowTopSignal(false), 800);
    }, 450);
  };

  const handlePointerUp = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

  let globalIdx = 0;

  return (
    <div className="flex flex-col relative w-full h-full">

      {/* Scroll to Top Signal Overlay */}
      {showTopSignal && (
        <div className="fixed inset-x-0 top-0 z-[100] pointer-events-none flex justify-center pt-24 animate-fade-in">
          <div className="bg-white px-3 py-1.5 rounded-full text-black font-black text-[9px] tracking-[0.2em] shadow-[0_0_50px_rgba(255,255,255,0.4)] flex items-center gap-1.5 transition-all">
            <ChevronUp className="w-3 h-3" />
            GO TO TOP
          </div>
        </div>
      )}

      {/* Scroll to Pending Tool */}
      {completedCount < totalCount && totalCount > 0 && (
        <div className="fixed bottom-12 md:bottom-24 right-5 md:right-8 z-50">
          {showTopSignal && (
            <div className="absolute inset-0 rounded-full bg-white opacity-50 animate-ping-once" />
          )}
          <button
            onPointerDown={handlePointerDown}
            onPointerUp={handlePointerUp}
            onPointerLeave={handlePointerUp}
            onContextMenu={(e) => e.preventDefault()}
            onClick={(e) => {
              if (isLongPressRef.current) {
                isLongPressRef.current = false;
                return;
              }
              handleScrollToPending();
            }}
            className="w-11 h-11 rounded-full bg-white text-black shadow-[0_8px_32px_rgba(255,255,255,0.3)] hover:scale-110 active:scale-95 transition-all animate-bounce-subtle flex items-center justify-center border border-white/40 touch-none select-none relative z-10"
            title="Click to cycle, hold to go to top"
          >
            {canScrollMore ? (
              <ChevronDown className="w-6 h-6" strokeWidth={3} />
            ) : (
              <Minus className="w-6 h-6" strokeWidth={3} />
            )}
          </button>
        </div>
      )}

      {/* Header with inline navigation + stats */}
      <div className="sticky top-0 z-20 bg-black/80 backdrop-blur-xl border-b border-[#2f3336]">
        <Tabs tabs={tabs} activeTab={activeTab} onTabChange={onTabChange} onLogout={onLogout} isLoggingOut={isLoggingOut} />
      </div>

      <div>
        <div className="px-5 py-3 md:px-6 md:py-4 flex flex-col md:flex-row md:items-center justify-between gap-2 md:gap-4 border-b border-[#2f3336]">
          <div className="min-w-0">
            <h2 className="text-[18px] md:text-[22px] font-black text-[#eff3f4] leading-tight tracking-tight">
              To-Do List
            </h2>
            <div className="flex items-center gap-2 mt-0.5">
              <Clock className="w-3 h-3 text-[#71767b] shrink-0" />
              <span className="text-[#8b98a5] text-[9px] md:text-[11px] font-black uppercase tracking-[0.15em]">
                {now.toLocaleDateString('en-US', { weekday: 'short' })}, {now.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} &middot; {now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 md:gap-4 shrink-0">
            {/* Done Chip */}
            <div className="bg-[#16181c] border border-[#2f3336] rounded-xl p-1.5 md:p-2 flex items-center gap-2 shadow-xl flex-1 md:flex-none justify-center md:justify-start">
              <div className="w-6 h-6 md:w-8 md:h-8 rounded-lg bg-[#00ba7c]/10 border border-[#00ba7c]/20 flex items-center justify-center">
                <Target className="w-3.5 h-3.5 md:w-4 md:h-4 text-[#00ba7c]" />
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
            <p className="text-[#71767b] text-base font-bold">No routines yet</p>
            <p className="text-[#71767b]/60 text-sm mt-1">Go to Set Routine to add your first routine!</p>
          </div>
        )}

        {groupedByPhase.map((phaseGroup) => {
          const { phase, habits: phaseHabits } = phaseGroup as { phase: typeof TIME_PHASES[number]; habits: Habit[] };
          const isCurrentPhase = phase.key === currentPhaseKey;
          const phaseCompleted = phaseHabits.filter(h => h.history[todayStr]).length;

          return (
            <div key={phase.key} className="space-y-1.5">
              <div className={`flex items-center gap-3 px-1 mb-1.5 py-1 rounded-xl ${isCurrentPhase ? 'bg-white/[0.02]' : ''}`}>
                <div className="flex items-center gap-3 min-w-0">
                  <span className="text-[11px] md:text-[13px] font-black uppercase tracking-[0.2em] leading-none" style={{ color: phase.color }}>
                    {phase.label}{phase.key !== 'daily_rule' ? ' Phase' : ''}
                  </span>
                  <span className="text-[9px] font-bold text-[#71767b]/50">
                    {phase.range}
                  </span>
                  {isCurrentPhase && (
                    <span className="text-[8px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-full animate-pulse"
                      style={{ backgroundColor: `${phase.color}20`, color: phase.color }}>
                      Now
                    </span>
                  )}
                </div>
                <div className="flex-1 h-px bg-[#2f3336]" />
                <span className="text-[10px] font-bold text-[#71767b]">
                  {phaseCompleted}/{phaseHabits.length}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-3">
                {phaseHabits.map((habit) => {
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
                          onToggleHabit(habit.id, todayStr);
                          setFocusedHabitId(habit.id);
                        }}
                        className={`w-full flex items-center gap-3 md:gap-4 p-3 md:p-4 rounded-2xl transition-all duration-300 group border bit-click-spring ${isDone
                          ? 'border-transparent'
                          : 'bg-transparent border-[#2f3336] hover:bg-white/[0.02] hover:border-white/10'
                          } ${focusedHabitId === habit.id ? 'habit-shine' : 'z-10'}`}
                        style={{
                          '--shine-color': focusedHabitId === habit.id ? `${phase.color}60` : 'transparent',
                          backgroundColor: isDone ? `${phase.color}15` : 'transparent',
                        } as React.CSSProperties}
                      >
                        <div className={`w-7 h-7 md:w-8 md:h-8 rounded-full flex items-center justify-center shrink-0 transition-all duration-300 border-2 ${isDone
                          ? 'border-transparent scale-100 animate-check-pop'
                          : 'border-[#2f3336] group-hover:border-[#71767b]'
                          }`}
                          style={isDone ? { backgroundColor: phase.color, boxShadow: `0 0 16px ${phase.color}44` } : {}}
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
                          <p className={`text-[14px] md:text-[15px] font-bold transition-all duration-300 ease-in-out truncate ${isDone ? 'text-[#71767b] opacity-60 line-through' : 'text-[#eff3f4]'
                            }`}>
                            {habit.name}
                          </p>
                        </div>

                        {isDone && (
                          <div className="shrink-0 animate-fade-in flex items-center justify-center">
                            <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: phase.color }} />
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
