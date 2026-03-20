import React, { useMemo } from 'react';
import { Habit } from '../types';
import { Check, Circle, Flame, Target, Sparkles, Sun, CloudSun, Moon, Stars, ChevronDown, ChevronUp } from 'lucide-react';
import { getEffectiveDateStr, getEffectiveDate } from '../utils/dateUtils';

interface DailyHabitsProps {
  habits: Habit[];
  onToggleHabit: (id: any, dateStr: string) => void;
  onLoadDemo?: () => void;
}

// Time phase definitions
const TIME_PHASES = [
  { key: 'morning', label: 'Morning', time: '08:00', range: '5 AM – 12 PM', icon: Sun, color: '#ffad1f', emoji: '☀️' },
  { key: 'afternoon', label: 'Afternoon', time: '14:00', range: '12 PM – 6 PM', icon: CloudSun, color: '#ff6b00', emoji: '🌤️' },
  { key: 'night', label: 'Night', time: '20:00', range: '6 PM – 12 AM', icon: Moon, color: '#7856ff', emoji: '🌙' },
  { key: 'midnight', label: 'Midnight', time: '02:00', range: '12 AM – 5 AM', icon: Stars, color: '#1d9bf0', emoji: '🌑' },
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

export const DailyHabits: React.FC<DailyHabitsProps> = ({ habits, onToggleHabit, onLoadDemo }) => {
  const todayStr = getEffectiveDateStr();
  const todayDate = getEffectiveDate();
  const currentPhaseKey = getCurrentPhaseKey();
  const [focusedHabitId, setFocusedHabitId] = React.useState<string | null>(null);
  const [moveDirection, setMoveDirection] = React.useState<'down' | 'up'>('down');

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

  // Scroll to Pending Tool Logic - Strictly follows UI order (Morning -> Midnight)
  const pendingHabitList = useMemo(() => {
    return groupedByPhase.flatMap(group => group.habits).filter(h => !h.history[todayStr]);
  }, [groupedByPhase, todayStr]);

  const handleScrollToPending = () => {
    if (pendingHabitList.length === 0) return;

    // Find where we are relative to the UI-ordered list (from groupedByPhase)
    const uiOrderedFullList = groupedByPhase.flatMap(g => g.habits);
    const lastFocusedIdx = focusedHabitId ? uiOrderedFullList.findIndex(h => h.id === focusedHabitId) : -1;

    // Find the next/previous habit in the pending list based on our current position in the FULL list
    let nextIdx;
    if (moveDirection === 'down') {
      // Find the first pending habit that is AFTER our last focused habit
      const nextPendingIdx = pendingHabitList.findIndex(h => {
        const fullIdx = uiOrderedFullList.findIndex(f => f.id === h.id);
        return fullIdx > lastFocusedIdx;
      });

      if (nextPendingIdx !== -1) {
        nextIdx = nextPendingIdx;
      } else {
        // Nothing below, start moving up
        setMoveDirection('up');
        nextIdx = pendingHabitList.length - 1;
      }
    } else {
      // Find the last pending habit that is BEFORE our last focused habit
      const prevPendingList = [...pendingHabitList].reverse();
      const prevPendingIdxInReverse = prevPendingList.findIndex(h => {
        const fullIdx = uiOrderedFullList.findIndex(f => f.id === h.id);
        return fullIdx < lastFocusedIdx;
      });

      if (prevPendingIdxInReverse !== -1) {
        nextIdx = (pendingHabitList.length - 1) - prevPendingIdxInReverse;
      } else {
        // Nothing above, start moving down
        setMoveDirection('down');
        nextIdx = 0;
      }
    }

    const target = pendingHabitList[nextIdx];
    if (target) {
      setFocusedHabitId(target.id);
      document.getElementById(`habit-${target.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });

      // Update direction for NEXT click based on final position
      if (nextIdx === pendingHabitList.length - 1) setMoveDirection('up');
      else if (nextIdx === 0) setMoveDirection('down');
    }
  };

  // Streak: consecutive days up to today
  const currentStreak = useMemo(() => {
    if (totalCount === 0) return 0;
    let streak = 0;
    const d = new Date(todayDate);
    for (let i = 0; i < 365; i++) {
      const dStr = d.toISOString().split('T')[0];
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

  // Motivational message
  const getMessage = () => {
    if (totalCount === 0) return "Add some habits to get started!";
    if (completionPct === 100) return "🎉 Perfect day! All habits completed!";
    if (completionPct >= 75) return "Almost there! Keep pushing! 💪";
    if (completionPct >= 50) return "Great progress — over halfway!";
    if (completionPct > 0) return "Good start! Keep going!";
    return "Let's crush it today!";
  };

  const longPressTimer = React.useRef<NodeJS.Timeout | null>(null);
  const isLongPressRef = React.useRef(false);
  const [showTopSignal, setShowTopSignal] = React.useState(false);

  const handlePointerDown = () => {
    isLongPressRef.current = false;
    longPressTimer.current = setTimeout(() => {
      const scrollTarget = document.querySelector('main') || window;
      scrollTarget.scrollTo({ top: 0, behavior: 'smooth' });
      setFocusedHabitId(null);
      setMoveDirection('down');
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

  return (
    <div className="max-w-[1200px] mx-auto border-x border-[#2f3336] min-h-full bg-black flex flex-col relative">

      {/* Scroll to Top Signal Overlay */}
      {showTopSignal && (
        <div className="fixed inset-x-0 top-0 z-[100] pointer-events-none flex justify-center pt-24 animate-fade-in">
          <div className="bg-white px-4 py-2 rounded-full text-black font-black text-[12px] tracking-[0.2em] shadow-[0_0_50px_rgba(255,255,255,0.4)] flex items-center gap-2">
            <ChevronUp className="w-3.5 h-3.5" />
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
            {moveDirection === 'up' ? (
              <ChevronUp className="w-6 h-6" strokeWidth={3} />
            ) : (
              <ChevronDown className="w-6 h-6" strokeWidth={3} />
            )}
          </button>
        </div>
      )}
      {/* Header with inline stats */}
      <div className="sticky top-0 z-20 bg-black/80 backdrop-blur-xl border-b border-[#2f3336]">
        <div className="px-5 py-3 md:px-6 md:py-4 flex items-center justify-between">
          <div className="min-w-0">
            <h2 className="text-[18px] md:text-[22px] font-black text-[#eff3f4] tracking-tight truncate">Daily Habits</h2>
            <p className="text-[10px] md:text-[13px] font-bold text-[#71767b] whitespace-nowrap">
              {todayDate.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
              <span className="hidden md:inline text-[#71767b]/50"> · Resets at 5:00 AM</span>
            </p>
            {onLoadDemo && (
              <button
                onClick={onLoadDemo}
                className="flex items-center gap-1.5 px-2 py-0.5 mt-1 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-all text-[10px] font-bold text-[#eff3f4]"
              >
                <Sparkles className="w-3 h-3 text-[#ffad1f]" />
                Demo Test
              </button>
            )}
          </div>

          <div className="flex items-center gap-3 md:gap-4">
            <div className="flex items-center gap-1.5 md:gap-2">
              <div className="w-7 h-7 md:w-8 md:h-8 rounded-lg bg-[#00ba7c]/10 border border-[#00ba7c]/20 flex items-center justify-center">
                <Target className="w-3.5 h-3.5 md:w-4 md:h-4 text-[#00ba7c]" />
              </div>
              <div>
                <p className="text-[13px] md:text-[15px] font-black text-[#eff3f4] leading-tight">{completedCount}<span className="text-[#71767b]">/{totalCount}</span></p>
                <p className="text-[7px] md:text-[8px] font-bold text-[#71767b] uppercase">Completed</p>
              </div>
            </div>
            <div className="w-px h-7 bg-[#2f3336]" />
            <div className="flex items-center gap-1.5 md:gap-2">
              <div className="w-7 h-7 md:w-8 md:h-8 rounded-lg bg-[#ff6b00]/10 border border-[#ff6b00]/20 flex items-center justify-center">
                <Flame className="w-3.5 h-3.5 md:w-4 md:h-4 text-[#ff6b00]" />
              </div>
              <div>
                <p className="text-[13px] md:text-[15px] font-black text-[#eff3f4] leading-tight">{currentStreak}</p>
                <p className="text-[7px] md:text-[8px] font-bold text-[#71767b] uppercase">Day Streak</p>
              </div>
            </div>
          </div>
        </div>
      </div>


      {/* Habit Checklist — Grouped by Time Phase */}
      <div className="p-5 md:p-6 space-y-7 pb-32">
        {habits.length === 0 && (
          <div className="text-center py-16">
            <Sparkles className="w-10 h-10 text-[#71767b]/40 mx-auto mb-4" />
            <p className="text-[#71767b] text-base font-bold">No habits yet</p>
            <p className="text-[#71767b]/60 text-sm mt-1">Go to Manual Habits to add your first habit!</p>
          </div>
        )}

        {groupedByPhase.map(({ phase, habits: phaseHabits }) => {
          const PhaseIcon = phase.icon;
          const isCurrentPhase = phase.key === currentPhaseKey;
          const phaseCompleted = phaseHabits.filter(h => h.history[todayStr]).length;

          return (
            <div key={phase.key} className="space-y-1.5">
              {/* Phase Header */}
              <div className={`flex items-center gap-2.5 px-1 mb-2 py-1.5 rounded-xl ${isCurrentPhase ? 'bg-white/[0.02]' : ''}`}>
                <div
                  className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                  style={{ backgroundColor: `${phase.color}15`, border: `1px solid ${phase.color}30` }}
                >
                  <PhaseIcon className="w-3.5 h-3.5" style={{ color: phase.color }} />
                </div>
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-[11px] md:text-[12px] font-black uppercase tracking-[0.15em]" style={{ color: phase.color }}>
                    {phase.label}
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

              {/* Habit Items */}
              {phaseHabits.map(habit => {
                const isDone = !!habit.history[todayStr];
                return (
                  <button
                    key={habit.id}
                    id={`habit-${habit.id}`}
                    onClick={() => {
                      onToggleHabit(habit.id, todayStr);
                      setFocusedHabitId(habit.id);
                    }}
                    className={`w-full flex items-center gap-3 md:gap-4 p-3 md:p-4 rounded-2xl transition-all duration-[1ms] group border ${isDone
                      ? 'bg-white/[0.03] border-white/[0.06]'
                      : 'bg-transparent border-[#2f3336] hover:bg-white/[0.02] hover:border-white/10'
                      } ${focusedHabitId === habit.id ? 'habit-shine scale-[1.01] z-10' : ''}`}
                    style={{
                      '--shine-color': focusedHabitId === habit.id ? `${phase.color}60` : 'transparent'
                    } as React.CSSProperties}
                  >
                    {/* Checkbox */}
                    <div className={`w-7 h-7 md:w-8 md:h-8 rounded-full flex items-center justify-center shrink-0 transition-all duration-[1ms] border-2 ${isDone
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

                    {/* Habit Info */}
                    <div className="flex-1 text-left min-w-0">
                      <p className={`text-[14px] md:text-[15px] font-bold transition-all duration-[1ms] ease-in-out truncate ${isDone ? 'text-[#71767b] opacity-60 line-through' : 'text-[#eff3f4]'
                        }`}>
                        {habit.name}
                      </p>
                    </div>

                    {/* Done indicator */}
                    {isDone && (
                      <div className="shrink-0 animate-fade-in flex items-center justify-center">
                        <svg className="w-5 h-5 animate-check-mark" style={{ color: phase.color }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12" className="check-mark-path" />
                        </svg>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
};
