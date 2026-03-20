import React, { useState, useMemo } from 'react';
import { SavingGoal, Habit } from '../types';
import { BarChart3, CalendarDays, ChevronLeft, ChevronRight, Check, X, TrendingUp, Target, Flame, Award } from 'lucide-react';
import { getCategoryStyles } from '../utils/colors';
import { getEffectiveDateStr, getEffectiveDate } from '../utils/dateUtils';

interface AnalyticsProps {
  habits: Habit[];
  savings?: SavingGoal[];
}

type ViewMode = 'weekly' | 'monthly' | 'full';

const formatDateStr = (d: Date): string => {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

export const Analytics: React.FC<AnalyticsProps> = ({ habits, savings = [] }) => {
  const [view, setView] = useState<ViewMode>('weekly');
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const todayStr = getEffectiveDateStr();
  const today = getEffectiveDate();

  // Week navigation
  const [weekOffset, setWeekOffset] = useState(0);
  // Month navigation  
  const [monthOffset, setMonthOffset] = useState(0);
  // Full view month navigation
  const [fullMonthOffset, setFullMonthOffset] = useState(0);

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

  // ── Full View Data ──
  const fullData = useMemo(() => {
    const base = new Date(today.getFullYear(), today.getMonth() + fullMonthOffset, 1);
    const year = base.getFullYear();
    const month = base.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    const days = [];
    for (let i = 1; i <= daysInMonth; i++) {
      const d = new Date(year, month, i);
      const dateStr = formatDateStr(d);
      const completed = habits.filter(h => h.history[dateStr]).length;
      days.push({
        date: d,
        dateStr,
        dayNum: i,
        dayName: d.toLocaleString('default', { weekday: 'short' }),
        completed,
        total: habits.length,
        pct: habits.length > 0 ? Math.round((completed / habits.length) * 100) : 0,
        isToday: dateStr === todayStr,
        isFuture: d > today,
      });
    }
    return { days, label: `${new Date(year, month).toLocaleString('default', { month: 'long' })} ${year}` };
  }, [habits, fullMonthOffset, today, todayStr]);

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
    if (pct === 100) return '#00ba7c';
    if (pct >= 70) return '#1d9bf0';
    if (pct >= 40) return '#ffad1f';
    return '#71767b';
  };

  const navOffset = view === 'weekly' ? weekOffset : view === 'monthly' ? monthOffset : fullMonthOffset;
  const setNavOffset = view === 'weekly' ? setWeekOffset : view === 'monthly' ? setMonthOffset : setFullMonthOffset;
  const navLabel = view === 'weekly' ? weekLabel : view === 'monthly' ? monthData.label : fullData.label;

  return (
    <div className="max-w-[1200px] mx-auto border-x border-[#2f3336] min-h-full bg-black relative">

      {/* Header */}
      <div className="sticky top-0 bg-black/80 backdrop-blur-xl z-20 border-b border-[#2f3336]">
        <div className="px-4 py-3 md:px-6 md:py-4 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-[18px] md:text-[22px] font-black text-[#eff3f4] tracking-tight">Analytics</h2>
              <p className="text-[11px] font-black text-[#71767b] uppercase tracking-[0.2em] mt-0.5">Based on your real habits</p>
            </div>
            {/* Quick Stats */}
            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="text-[13px] md:text-[15px] font-black text-[#eff3f4] leading-tight">
                  {view === 'weekly' ? weekAvg : monthAvg}%
                </p>
                <p className="text-[7px] md:text-[8px] font-bold text-[#71767b] uppercase">Avg Rate</p>
              </div>
              <div className="w-px h-7 bg-[#2f3336]" />
              <div className="text-right">
                <p className="text-[13px] md:text-[15px] font-black text-[#eff3f4] leading-tight">{habits.length}</p>
                <p className="text-[7px] md:text-[8px] font-bold text-[#71767b] uppercase">Habits</p>
              </div>
            </div>
          </div>

          {/* View Switcher + Navigation */}
          <div className="flex items-center justify-between gap-3">
            <div className="flex bg-[#16181c] p-1 rounded-2xl border border-[#2f3336]">
              {(['weekly', 'monthly', 'full'] as const).map(v => (
                <button
                  key={v}
                  onClick={() => { setView(v); setSelectedDay(null); }}
                  className={`px-3 md:px-4 py-1.5 rounded-xl text-[11px] md:text-[12px] font-bold transition-all duration-300 ${
                    view === v
                      ? 'bg-[#eff3f4] text-black shadow-[0_0_20px_rgba(255,255,255,0.1)]'
                      : 'text-[#71767b] hover:text-[#eff3f4] hover:bg-white/5'
                  }`}
                >
                  {v === 'full' ? 'Full View' : v.charAt(0).toUpperCase() + v.slice(1)}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-1 bg-white/[0.03] p-1 rounded-2xl border border-white/10">
              <button onClick={() => setNavOffset(prev => prev - 1)} className="p-1.5 hover:bg-white/10 rounded-xl transition-all text-[#71767b] hover:text-[#eff3f4]">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button 
                onClick={() => setNavOffset(0)}
                className={`px-2 py-1 rounded-xl text-[9px] md:text-[10px] font-black transition-all min-w-[80px] md:min-w-[120px] text-center ${
                  navOffset === 0 ? 'bg-[#1d9bf0] text-white' : 'text-[#71767b] bg-white/[0.05] border border-white/5'
                }`}
              >
                {navLabel}
              </button>
              <button onClick={() => setNavOffset(prev => prev + 1)} className="p-1.5 hover:bg-white/10 rounded-xl transition-all text-[#71767b] hover:text-[#eff3f4]">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="p-4 md:p-6 space-y-6 pb-28">

        {/* ═══════ WEEKLY VIEW ═══════ */}
        {view === 'weekly' && (
          <div className="space-y-4">
            {/* Bar Chart */}
            <div className="bg-white/[0.02] border border-[#2f3336] rounded-3xl p-4 md:p-6">
              <div className="h-[200px] md:h-[240px] flex items-end justify-between gap-2 md:gap-4">
                {weekData.map((d, i) => (
                  <button
                    key={i}
                    onClick={() => !d.isFuture && setSelectedDay(d.dateStr === selectedDay ? null : d.dateStr)}
                    disabled={d.isFuture}
                    className={`flex-1 flex flex-col items-center group/bar h-full justify-end ${d.isFuture ? 'opacity-30' : 'cursor-pointer'}`}
                  >
                    <div className="relative w-full flex flex-col items-center justify-end h-full">
                      {/* Tooltip */}
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover/bar:flex flex-col items-center pointer-events-none z-50 animate-slide-up">
                        <div className="px-2.5 py-1.5 bg-[#16181c] text-[#eff3f4] text-[10px] font-bold rounded-lg border border-[#2f3336] shadow-2xl whitespace-nowrap">
                          {d.completed}/{d.total} · {d.pct}%
                        </div>
                        <div className="w-2 h-2 bg-[#16181c] border-r border-b border-[#2f3336] rotate-45 -mt-1" />
                      </div>
                      <div
                        className={`w-full max-w-[36px] rounded-t-xl transition-all duration-700 group-hover/bar:brightness-125 ${
                          d.dateStr === selectedDay ? 'ring-2 ring-white/30' : ''
                        }`}
                        style={{
                          height: `${Math.max(4, d.pct)}%`,
                          backgroundColor: getBarColor(d.pct),
                          boxShadow: d.pct > 0 ? `0 0 12px ${getBarColor(d.pct)}22` : 'none',
                        }}
                      />
                    </div>
                    <div className="mt-3 text-center">
                      <span className={`text-[10px] md:text-[11px] font-black uppercase block ${d.isToday ? 'text-[#1d9bf0]' : 'text-[#71767b]'}`}>
                        {d.dayName}
                      </span>
                      <span className={`text-[9px] font-bold ${d.isToday ? 'text-[#1d9bf0]' : 'text-[#71767b]/50'}`}>
                        {d.dayNum}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Per-Habit Weekly Breakdown */}
            <div className="space-y-2">
              <p className="text-[10px] font-black text-[#71767b] uppercase tracking-[0.2em] px-1">Per Habit This Week</p>
              {habits.map(habit => {
                const style = getCategoryStyles(habit.category);
                const weekCompleted = weekData.filter(d => !d.isFuture && habit.history[d.dateStr]).length;
                const weekTotal = weekData.filter(d => !d.isFuture).length;
                const weekPct = weekTotal > 0 ? Math.round((weekCompleted / weekTotal) * 100) : 0;

                return (
                  <div key={habit.id} className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.02] border border-[#2f3336] hover:bg-white/[0.04] transition-all">
                    <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: style.hex }} />
                    <span className="text-[13px] font-bold text-[#eff3f4] flex-1 truncate">{habit.name}</span>
                    <div className="flex items-center gap-2 shrink-0">
                      <div className="flex gap-0.5">
                        {weekData.map((d, i) => (
                          <div
                            key={i}
                            className={`w-3 h-3 md:w-3.5 md:h-3.5 rounded-[2px] border transition-all ${
                              d.isFuture ? 'border-[#2f3336]/50 bg-transparent' :
                              habit.history[d.dateStr] ? 'border-transparent' : 'border-[#2f3336] bg-transparent'
                            }`}
                            style={!d.isFuture && habit.history[d.dateStr] ? { backgroundColor: style.hex } : {}}
                            title={`${d.dayName} ${d.dayNum}`}
                          />
                        ))}
                      </div>
                      <span className="text-[11px] font-black min-w-[32px] text-right" style={{ color: style.hex }}>
                        {weekPct}%
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ═══════ MONTHLY VIEW ═══════ */}
        {view === 'monthly' && (
          <div className="space-y-4">
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
                      className={`aspect-square rounded-xl flex flex-col items-center justify-center transition-all relative ${
                        !d.isCurrentMonth ? 'opacity-20' :
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
                      <span className={`text-[11px] md:text-[13px] font-black ${
                        d.isToday ? 'text-[#1d9bf0]' : d.isCurrentMonth ? 'text-[#eff3f4]' : 'text-[#71767b]'
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

        {/* ═══════ FULL VIEW ═══════ */}
        {view === 'full' && (
          <div className="space-y-2">
            <p className="text-[10px] font-black text-[#71767b] uppercase tracking-[0.2em] px-1">Tap any day to see details</p>
            {fullData.days.map(d => {
              const isSelected = d.dateStr === selectedDay;
              return (
                <button
                  key={d.dateStr}
                  onClick={() => !d.isFuture && setSelectedDay(isSelected ? null : d.dateStr)}
                  disabled={d.isFuture}
                  className={`w-full flex items-center gap-3 p-3 md:p-4 rounded-xl transition-all border ${
                    d.isFuture ? 'opacity-30 border-[#2f3336]/50' :
                    isSelected ? 'bg-white/[0.05] border-[#1d9bf0]/40' :
                    'border-[#2f3336] hover:bg-white/[0.02]'
                  }`}
                >
                  {/* Day Info */}
                  <div className="w-10 md:w-12 text-center shrink-0">
                    <p className={`text-[16px] md:text-[18px] font-black leading-tight ${d.isToday ? 'text-[#1d9bf0]' : 'text-[#eff3f4]'}`}>
                      {d.dayNum}
                    </p>
                    <p className={`text-[9px] font-bold uppercase ${d.isToday ? 'text-[#1d9bf0]' : 'text-[#71767b]'}`}>
                      {d.dayName}
                    </p>
                  </div>

                  <div className="w-px h-8 bg-[#2f3336] shrink-0" />

                  {/* Progress Bar */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[11px] font-bold text-[#71767b]">
                        {d.completed}/{d.total} habits
                      </span>
                      <span className="text-[11px] font-black" style={{ color: getBarColor(d.pct) }}>
                        {d.pct}%
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-white/[0.03] border border-white/10 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{ width: `${d.pct}%`, backgroundColor: getBarColor(d.pct) }}
                      />
                    </div>
                  </div>

                  {/* Status Icon */}
                  <div className="shrink-0">
                    {d.pct === 100 ? (
                      <div className="w-7 h-7 rounded-full bg-[#00ba7c]/10 flex items-center justify-center">
                        <Check className="w-4 h-4 text-[#00ba7c]" strokeWidth={3} />
                      </div>
                    ) : d.pct > 0 ? (
                      <div className="w-7 h-7 rounded-full bg-[#ffad1f]/10 flex items-center justify-center">
                        <TrendingUp className="w-4 h-4 text-[#ffad1f]" />
                      </div>
                    ) : !d.isFuture ? (
                      <div className="w-7 h-7 rounded-full bg-[#71767b]/10 flex items-center justify-center">
                        <X className="w-4 h-4 text-[#71767b]" />
                      </div>
                    ) : null}
                  </div>
                </button>
              );
            })}
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
                  const style = getCategoryStyles(h.category);
                  return (
                    <div key={h.id} className="flex items-center gap-3 p-2 rounded-xl bg-white/[0.02] border border-white/[0.03]">
                      <div className="w-5 h-5 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: style.hex }}>
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
    </div>
  );
};
