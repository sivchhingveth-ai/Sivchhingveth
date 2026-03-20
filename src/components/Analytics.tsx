import React, { useState, useMemo, useEffect } from 'react';
import { SavingGoal, Habit } from '../types';
import { BarChart3, CalendarDays, ChevronLeft, ChevronRight, Check, X, TrendingUp, Target, Flame, Award } from 'lucide-react';
import { getCategoryStyles } from '../utils/colors';
import { getEffectiveDateStr, getEffectiveDate } from '../utils/dateUtils';
import { Tabs } from './Tabs';

interface AnalyticsProps {
  habits: Habit[];
  savings?: SavingGoal[];
  // Navigation props
  tabs: string[];
  activeTab: string;
  onTabChange: (tab: string) => void;
  onLogout: () => void;
  isLoggingOut: boolean;
}

type ViewMode = 'weekly' | 'monthly';

const formatDateStr = (d: Date): string => {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

export const Analytics: React.FC<AnalyticsProps> = ({
  habits: rawHabits, savings = [],
  tabs, activeTab, onTabChange, onLogout, isLoggingOut
}) => {
  // Dedupe habits by name to clean up any duplicate entries created during testing
  const habits = useMemo(() => {
    return Array.from(new Map(rawHabits.map(h => [h.name.trim().toLowerCase(), h])).values());
  }, [rawHabits]);

  const [view, setView] = useState<ViewMode>('weekly');
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const todayStr = getEffectiveDateStr();
  const today = getEffectiveDate();

  // Week navigation
  const [weekOffset, setWeekOffset] = useState(0);
  // Month navigation  
  const [monthOffset, setMonthOffset] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoaded(true), 50);
    return () => clearTimeout(timer);
  }, []);

  // ── Weekly Data ──
  const weekData = useMemo(() => {
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay() + 1 + weekOffset * 7); // Monday

    const days = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(startOfWeek);
      d.setDate(startOfWeek.getDate() + i);
      const dateStr = formatDateStr(d);
      const completed = habits.filter(h => h.history[dateStr]).length;
      days.push({
        date: d,
        dateStr,
        dayName: d.toLocaleString('default', { weekday: 'short' }),
        dayNum: d.getDate(),
        completed,
        total: habits.length,
        pct: habits.length > 0 ? Math.round((completed / habits.length) * 100) : 0,
        isToday: dateStr === todayStr,
        isFuture: d > today,
      });
    }
    return days;
  }, [habits, weekOffset, today, todayStr]);

  const weekLabel = useMemo(() => {
    if (weekData.length === 0) return '';
    const start = weekData[0].date;
    const end = weekData[6].date;
    const sameMonth = start.getMonth() === end.getMonth();
    if (sameMonth) {
      return `${start.toLocaleString('default', { month: 'short' })} ${start.getDate()} – ${end.getDate()}, ${end.getFullYear()}`;
    }
    return `${start.toLocaleString('default', { month: 'short' })} ${start.getDate()} – ${end.toLocaleString('default', { month: 'short' })} ${end.getDate()}`;
  }, [weekData]);

  const weekAvg = useMemo(() => {
    const validDays = weekData.filter(d => !d.isFuture);
    if (validDays.length === 0) return 0;
    return Math.round(validDays.reduce((a, d) => a + d.pct, 0) / validDays.length);
  }, [weekData]);

  // ── Monthly Data ──
  const monthData = useMemo(() => {
    const base = new Date(today.getFullYear(), today.getMonth() + monthOffset, 1);
    const year = base.getFullYear();
    const month = base.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const weeks: { date: Date; dateStr: string; dayNum: number; completed: number; total: number; pct: number; isToday: boolean; isFuture: boolean; isCurrentMonth: boolean }[][] = [];

    // Find the Monday before or on the 1st
    const firstDay = new Date(year, month, 1);
    const startDay = new Date(firstDay);
    const dayOfWeek = firstDay.getDay();
    startDay.setDate(firstDay.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));

    let currentWeek: typeof weeks[0] = [];
    const d = new Date(startDay);

    for (let i = 0; i < 42; i++) { // 6 weeks max
      const dateStr = formatDateStr(d);
      const completed = habits.filter(h => h.history[dateStr]).length;
      const isCurrentMonth = d.getMonth() === month;

      currentWeek.push({
        date: new Date(d),
        dateStr,
        dayNum: d.getDate(),
        completed,
        total: habits.length,
        pct: habits.length > 0 ? Math.round((completed / habits.length) * 100) : 0,
        isToday: dateStr === todayStr,
        isFuture: d > today,
        isCurrentMonth,
      });

      if (currentWeek.length === 7) {
        // Only add week if it contains at least one day from current month
        if (currentWeek.some(day => day.isCurrentMonth)) {
          weeks.push(currentWeek);
        }
        currentWeek = [];
      }
      d.setDate(d.getDate() + 1);
    }

    return { weeks, year, month, daysInMonth, label: `${new Date(year, month).toLocaleString('default', { month: 'long' })} ${year}` };
  }, [habits, monthOffset, today, todayStr]);

  const monthAvg = useMemo(() => {
    const allDays = monthData.weeks.flat().filter(d => d.isCurrentMonth && !d.isFuture);
    if (allDays.length === 0) return 0;
    return Math.round(allDays.reduce((a, d) => a + d.pct, 0) / allDays.length);
  }, [monthData]);



  // ── Selected Day Detail ──
  const selectedDayDetail = useMemo(() => {
    if (!selectedDay) return null;
    const completedHabits = habits.filter(h => h.history[selectedDay]);
    const missedHabits = habits.filter(h => !h.history[selectedDay]);

    // Day's savings
    const dailySavings = savings
      .map(s => ({
        goalName: s.name,
        color: s.color,
        amount: s.history[selectedDay] || 0
      }))
      .filter(s => s.amount > 0);

    const [y, m, d] = selectedDay.split('-').map(Number);
    const date = new Date(y, m - 1, d);
    return {
      dateStr: selectedDay,
      date,
      label: date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }),
      completedHabits,
      missedHabits,
      dailySavings,
      total: habits.length,
      completed: completedHabits.length,
      pct: habits.length > 0 ? Math.round((completedHabits.length / habits.length) * 100) : 0,
    };
  }, [selectedDay, habits, savings]);

  // ── Best streak across all habits ──
  const bestDay = useMemo(() => {
    let best = { dateStr: '', count: 0 };
    const allDates = new Set<string>();
    habits.forEach(h => Object.keys(h.history).forEach(d => { if (h.history[d]) allDates.add(d); }));
    allDates.forEach(dateStr => {
      const count = habits.filter(h => h.history[dateStr]).length;
      if (count > best.count) best = { dateStr, count };
    });
    return best;
  }, [habits]);

  const getBarColor = (pct: number) => {
    if (pct >= 75) return '#00ba7c'; // Elite (Green)
    if (pct >= 50) return '#ffad1f'; // High (Orange)
    if (pct >= 25) return '#1d9bf0'; // Steady (Blue)
    return '#ef4444'; // Low (Red)
  };

  const navOffset = view === 'weekly' ? weekOffset : monthOffset;
  const setNavOffset = view === 'weekly' ? setWeekOffset : setMonthOffset;
  const navLabel = view === 'weekly' ? weekLabel : monthData.label;

  return (
    <div className="flex flex-col relative w-full h-full pb-20">

      {/* Header */}
      <div className="sticky top-0 z-20 bg-black/80 backdrop-blur-xl border-b border-[#2f3336]">
        <Tabs tabs={tabs} activeTab={activeTab} onTabChange={onTabChange} onLogout={onLogout} isLoggingOut={isLoggingOut} />
      </div>
      <div>
        <div className="px-5 py-4 md:px-6 md:py-6 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#2f3336]">
            {/* Row 1: Title */}
            <div className="min-w-0">
              <h2 className="text-[20px] md:text-[28px] font-black text-[#eff3f4] leading-tight tracking-tight">Analytics</h2>
              <p className="text-[#8b98a5] text-[10px] md:text-[13px] font-black uppercase tracking-[0.2em] mt-1.5 truncate">Real Progress</p>
            </div>

            {/* Row 2: View Switcher + Navigation */}
            <div className="flex items-center justify-between gap-1.5 md:gap-3 overflow-x-auto no-scrollbar scrollbar-hide pb-1 md:shrink-0">
              <div className="flex bg-[#16181c] p-0.5 md:p-1 rounded-2xl border border-[#2f3336] w-fit shrink-0">
                {(['weekly', 'monthly'] as const).map(v => (
                  <button
                    key={v}
                    onClick={() => { setView(v); setSelectedDay(null); }}
                    className={`px-2.5 md:px-4 py-1 md:py-1.5 rounded-xl text-[10px] md:text-[12px] font-bold transition-all duration-300 ${view === v
                      ? 'bg-[#eff3f4] text-black shadow-[0_0_20px_rgba(255,255,255,0.1)]'
                      : 'text-[#71767b] hover:text-[#eff3f4] hover:bg-white/5'
                      }`}
                  >
                    {v.charAt(0).toUpperCase() + v.slice(1)}
                  </button>
                ))}
              </div>

              <div className="flex items-center bg-white/[0.03] p-0.5 md:p-1 rounded-2xl border border-white/10 w-fit shrink-0">
                <button onClick={() => setNavOffset(prev => prev - 1)} className="p-1 md:p-1.5 hover:bg-white/10 rounded-xl transition-all text-[#71767b] hover:text-[#eff3f4]">
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setNavOffset(0)}
                  className={`px-1.5 md:px-2 py-1 rounded-xl text-[9px] md:text-[10px] font-black transition-all min-w-[90px] md:w-[150px] text-center ${navOffset === 0 ? 'bg-white/10 text-[#eff3f4] border border-white/20' : 'text-[#71767b] bg-white/[0.05] border border-white/5'
                    }`}
                >
                  {navLabel}
                </button>
                {navOffset < 0 ? (
                  <button
                    onClick={() => setNavOffset(prev => prev + 1)}
                    className="p-1 md:p-1.5 hover:bg-white/10 rounded-xl transition-all text-[#71767b] hover:text-[#eff3f4]"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                ) : (
                  <div className="w-6 md:w-8" />
                )}
              </div>
            </div>
          </div>
        </div>

      <div className="p-5 md:p-6 space-y-7 pb-32 animate-slide-up">

        {/* ═══════ WEEKLY VIEW ═══════ */}
        {view === 'weekly' && (
          <div key="weekly" className="space-y-4 animate-slide-up">
            {/* Bar Chart */}
            <div className="bg-white/[0.02] border border-[#2f3336] p-4 md:p-8 rounded-3xl group/chart">
              <div className="flex items-end justify-between h-[160px] md:h-[220px] mb-8 px-2 md:px-4">
                {weekData.map((d, i) => {
                  const isToday = d.dateStr === todayStr;
                  const barColor = getBarColor(d.pct);

                  return (
                    <button
                      key={i}
                      onClick={() => !d.isFuture && setSelectedDay(d.dateStr === selectedDay ? null : d.dateStr)}
                      disabled={d.isFuture}
                      className={`flex flex-col items-center gap-4 flex-1 h-full justify-end group/bar relative ${d.isFuture ? 'opacity-30' : 'cursor-pointer'}`}
                    >
                      {/* Tooltip on Hover */}
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 opacity-0 group-hover/bar:opacity-100 transition-all z-50 pointer-events-none translate-y-2 group-hover/bar:translate-y-0 text-center whitespace-nowrap">
                        <div className="bg-[#16181c] border border-[#2f3336] px-3 py-1.5 rounded-xl shadow-2xl">
                          <span className="text-[14px] md:text-[16px] font-black text-[#eff3f4]">
                            {d.completed}/{d.total}
                          </span>
                          <div className="text-[10px] md:text-[11px] font-bold text-[#71767b] uppercase mt-0.5">{d.pct}% Done</div>
                        </div>
                        <div className="w-2 h-2 bg-[#16181c] border-r border-b border-[#2f3336] rotate-45 mx-auto -mt-1" />
                      </div>

                      <div className="w-full flex justify-center items-end h-full">
                        <div
                          className={`w-7 sm:w-8 md:w-14 rounded-t-xl md:rounded-t-2xl transition-all duration-700 relative overflow-hidden group-hover/bar:brightness-125 ${d.dateStr === selectedDay ? 'ring-2 ring-white/30' : ''
                            }`}
                          style={{
                            height: `${isLoaded ? Math.max(d.pct, 4) : 0}%`,
                            backgroundColor: barColor,
                            boxShadow: d.pct > 0 && isLoaded ? `0 0 20px ${barColor}20` : 'none'
                          }}
                        >
                          {isToday && (
                            <div className="absolute inset-0 bg-white/10 animate-pulse" />
                          )}
                        </div>
                      </div>
                      <div className="text-center">
                        <p className={`text-[10px] md:text-[12px] font-black uppercase tracking-widest ${isToday ? 'text-[#1d9bf0]' : 'text-[#eff3f4]'}`}>
                          {d.dayName}
                        </p>
                        <p className="text-[9px] md:text-[10px] font-bold text-[#71767b] mt-0.5">
                          {d.dayNum}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Productivity Legend */}
              <div className="border-t border-[#2f3336] pt-4 flex flex-wrap items-center justify-center gap-y-2.5 gap-x-4 md:gap-x-8">
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-[#00ba7c]" />
                  <span className="text-[9px] md:text-[10px] font-black text-[#71767b] uppercase tracking-widest">ELITE <span className="text-[#eff3f4]/40 ml-0.5">(75+)</span></span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-[#ffad1f]" />
                  <span className="text-[9px] md:text-[10px] font-black text-[#71767b] uppercase tracking-widest">HIGH <span className="text-[#eff3f4]/40 ml-0.5">(50-75)</span></span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-[#1d9bf0]" />
                  <span className="text-[9px] md:text-[10px] font-black text-[#71767b] uppercase tracking-widest">STEADY <span className="text-[#eff3f4]/40 ml-0.5">(25-50)</span></span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-[#ef4444]" />
                  <span className="text-[9px] md:text-[10px] font-black text-[#71767b] uppercase tracking-widest">LOW <span className="text-[#eff3f4]/40 ml-0.5">(0-25)</span></span>
                </div>
              </div>
            </div>

            {/* Per-Habit Weekly Breakdown */}
            <div className="space-y-2">
              <p className="text-[10px] font-black text-[#71767b] uppercase tracking-[0.2em] px-1">Per Habit This Week</p>


              {habits.map(habit => {
                const weekDays = weekData.filter(d => !d.isFuture);
                const weekCompleted = weekDays.filter(d => habit.history[d.dateStr]).length;
                const weekMissed = weekDays.length - weekCompleted;
                const weekPct = weekDays.length > 0 ? Math.round((weekCompleted / weekDays.length) * 100) : 0;

                return (
                  <div key={habit.id} className="p-4 rounded-2xl bg-white/[0.02] border border-[#2f3336] hover:bg-white/[0.04] transition-all group">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-2.5 h-2.5 rounded-full shrink-0 shadow-[0_0_10px_rgba(29,155,240,0.3)] bg-[#1d9bf0]" />
                        <span className="text-[14px] font-bold text-[#eff3f4] truncate">{habit.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-[#71767b]">
                          {weekCompleted}/{weekDays.length} Done
                        </span>
                        {weekMissed > 0 && (
                          <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-red-500/10 border border-red-500/20 text-red-500/70">
                            {weekMissed} Missing
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col md:flex-row md:items-center gap-3 md:gap-4 mt-1">
                      {/* 7-Day heatmap grid */}
                      <div className="flex gap-1 shrink-0">
                        {weekData.map((d, i) => (
                          <div
                            key={i}
                            className={`w-6 h-6 rounded-lg border transition-all flex items-center justify-center ${d.isFuture ? 'border-dashed border-[#2f3336] bg-transparent opacity-20' :
                              habit.history[d.dateStr] ? 'border-transparent shadow-lg bg-[#1d9bf0]' : 'border-[#2f3336] bg-transparent'
                              }`}
                            title={`${d.dayName} ${d.dayNum}`}
                          >
                            {!d.isFuture && habit.history[d.dateStr] ? (
                              <Check className="w-3 h-3 text-white animate-check-mark" strokeWidth={4} />
                            ) : !d.isFuture ? (
                              <span className="text-[9px] font-bold text-[#71767b]">{d.dayName[0]}</span>
                            ) : null}
                          </div>
                        ))}
                      </div>

                      {/* Progress Bar & Percentage */}
                      <div className="flex-1 space-y-1.5 w-full">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-black text-[#71767b] uppercase tracking-widest">Efficiency</span>
                          <span className="text-[12px] font-black text-[#1d9bf0]">{weekPct}%</span>
                        </div>
                        <div className="h-1.5 w-full bg-white/[0.03] border border-white/5 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-[1200ms] ease-out shadow-lg bg-[#1d9bf0]"
                            style={{ width: `${isLoaded ? weekPct : 0}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ═══════ MONTHLY VIEW ═══════ */}
        {view === 'monthly' && (
          <div key="monthly" className="space-y-4 animate-slide-up">
            {/* Calendar Grid */}
            <div className="bg-white/[0.02] border border-[#2f3336] rounded-3xl p-4 md:p-6">
              {/* Day names header */}
              <div className="grid grid-cols-7 gap-1 mb-2">
                {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
                  <div key={day} className="text-center text-[9px] md:text-[10px] font-black text-[#71767b] uppercase py-1">
                    {day}
                  </div>
                ))}
              </div>
              {/* Calendar weeks */}
              {monthData.weeks.map((week, wi) => (
                <div key={wi} className="grid grid-cols-7 gap-1 mb-1">
                  {week.map((d, di) => (
                    <button
                      key={di}
                      onClick={() => !d.isFuture && d.isCurrentMonth && setSelectedDay(d.dateStr === selectedDay ? null : d.dateStr)}
                      disabled={d.isFuture || !d.isCurrentMonth}
                      className={`aspect-square rounded-xl flex flex-col items-center justify-center transition-all relative ${!d.isCurrentMonth ? 'opacity-20' :
                        d.isFuture ? 'opacity-30' :
                          d.dateStr === selectedDay ? 'ring-2 ring-[#1d9bf0] bg-white/[0.06]' :
                            'hover:bg-white/[0.04] cursor-pointer'
                        }`}
                      style={d.isCurrentMonth && !d.isFuture && d.pct > 0 ? {
                        backgroundColor: `${getBarColor(d.pct)}${Math.round(d.pct * 0.3).toString(16).padStart(2, '0')}`,
                      } : {}}
                    >
                      {d.dateStr === selectedDay && (
                        <div className="absolute top-1 right-1">
                          <div className="w-1.5 h-1.5 rounded-full bg-[#1d9bf0] animate-ping" />
                        </div>
                      )}
                      <span className={`text-[11px] md:text-[13px] font-black ${d.isToday ? 'text-[#1d9bf0]' : d.isCurrentMonth ? 'text-[#eff3f4]' : 'text-[#71767b]'
                        }`}>
                        {d.dayNum}
                      </span>
                      {d.isCurrentMonth && !d.isFuture && (
                        <span className="text-[7px] md:text-[8px] font-bold text-[#71767b]">
                          {d.completed}/{d.total}
                        </span>
                      )}
                      {d.isToday && !selectedDay && (
                        <div className="absolute bottom-0.5 w-1 h-1 rounded-full bg-[#1d9bf0]" />
                      )}
                    </button>
                  ))}
                </div>
              ))}
            </div>

          </div>
        )}



        {/* ═══════ SELECTED DAY DETAIL ═══════ */}
        {selectedDayDetail && (
          <div className="bg-white/[0.02] border border-[#2f3336] rounded-3xl overflow-hidden animate-slide-up">
            <div className="px-4 py-3 md:px-6 md:py-4 border-b border-[#2f3336] flex items-center justify-between bg-white/[0.01]">
              <div>
                <p className="text-[14px] md:text-[16px] font-black text-[#eff3f4]">{selectedDayDetail.label}</p>
                <p className="text-[10px] font-bold text-[#71767b]">
                  {selectedDayDetail.completed}/{selectedDayDetail.total} completed · {selectedDayDetail.pct}%
                </p>
              </div>
              <button onClick={() => setSelectedDay(null)} className="p-2 hover:bg-white/10 rounded-xl transition-all text-[#71767b] hover:text-[#eff3f4]">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 md:p-4 space-y-4">
              {/* Habits Section */}
              <div className="space-y-1">
                <p className="text-[10px] font-black text-[#71767b] uppercase tracking-widest px-1 mb-1.5">Habits</p>
                {selectedDayDetail.completedHabits.map(h => {
                  return (
                    <div key={h.id} className="flex items-center gap-3 p-2 rounded-xl bg-white/[0.02] border border-white/[0.03]">
                      <div className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 bg-[#1d9bf0]">
                        <Check className="w-3 h-3 text-white" strokeWidth={3} />
                      </div>
                      <span className="text-[13px] font-bold text-[#eff3f4]">{h.name}</span>
                    </div>
                  );
                })}

                {selectedDayDetail.missedHabits.map(h => (
                  <div key={h.id} className="flex items-center gap-3 p-2 rounded-xl opacity-40">
                    <div className="w-5 h-5 rounded-full border border-[#2f3336] flex items-center justify-center shrink-0">
                      <X className="w-3 h-3 text-[#71767b]" />
                    </div>
                    <span className="text-[13px] font-medium text-[#71767b] line-through">{h.name}</span>
                  </div>
                ))}
              </div>

              {/* Savings Section (Only show if there were savings) */}
              {selectedDayDetail.dailySavings.length > 0 && (
                <div className="space-y-1.5">
                  <p className="text-[10px] font-black text-[#71767b] uppercase tracking-widest px-1 mb-1.5">Money Saved</p>
                  {selectedDayDetail.dailySavings.map((s, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 rounded-xl bg-white/[0.03] border border-white/[0.05]">
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: s.color }} />
                        <span className="text-[13px] font-bold text-[#eff3f4]">{s.goalName}</span>
                      </div>
                      <span className="text-[14px] font-black text-[#00ba7c]">+${s.amount.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div >
  );
};
