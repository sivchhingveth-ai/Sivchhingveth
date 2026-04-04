import React, { useMemo, useState, useEffect } from 'react';
import { Habit } from '../types';
import { Edit2, Trash2, Plus, Activity, TrendingUp, Search, Target, Clock, ChevronLeft, ChevronRight, Check, Circle, AlignLeft, Info, Flame, Pencil } from 'lucide-react';
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
  { key: 'reset', label: 'Health', time: 'reset', icon: Target, color: '#34c759' },
  { key: 'growth', label: 'Growth', time: 'growth', icon: Target, color: '#bf7af0' },
  { key: 'distraction', label: 'Discipline', time: 'distraction', icon: Target, color: '#1d9bf0' },
  { key: 'daily_rule', label: 'Eliminate', time: 'any', icon: Target, color: '#ff3b30' },
  { key: 'spending', label: 'Boundary', time: 'spending', icon: Target, color: '#FFD700' },
] as const;

const getPhaseForHabit = (habit: Habit) => {
  if (!habit.time) return TIME_PHASES[0];
  const time = habit.time;
  // Find by time value - works for all category types
  const phase = TIME_PHASES.find(p => p.time === time);
  if (phase) return phase;
  // Fallback for legacy time strings
  if (time === '08:00') return TIME_PHASES[0]; // Health
  if (time === '14:00') return TIME_PHASES[1]; // Growth
  if (time === '20:00' || time === '02:00') return TIME_PHASES[2]; // Discipline
  return TIME_PHASES[0];
};

export const Habits: React.FC<HabitsProps> = ({
  habits, onDeleteHabit, onAddHabit, onEditHabit, currentMonth, onMonthChange,
  tabs, activeTab, onTabChange, onLogout, isLoggingOut, startDate
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showCategoryFilter, setShowCategoryFilter] = useState(false);
  const [showActionsId, setShowActionsId] = useState<any>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setTimeout(() => setIsLoaded(true), 50);
    // Reduced from 1000ms to 60000ms (1 minute) for better mobile performance
    const clockTimer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => {
      clearTimeout(timer);
      clearInterval(clockTimer);
    };
  }, []);

  // Auto-scroll to expanded card with header offset
  useEffect(() => {
    if (showActionsId) {
      setTimeout(() => {
        const expandedCard = document.querySelector(`[data-habit-id="${String(showActionsId)}"]`);
        const mainContainer = document.querySelector('main');
        if (expandedCard && mainContainer) {
          const headerOffset = 280; // More space for header + breathing room
          const cardRect = expandedCard.getBoundingClientRect();
          const scrollPosition = mainContainer.scrollTop + cardRect.top - headerOffset;
          mainContainer.scrollTo({ top: Math.max(0, scrollPosition), behavior: 'smooth' });
        }
      }, 100);
    }
  }, [showActionsId]);

  // Group habits by time phase
  const groupedByPhase = useMemo(() => {
    const groups: Record<string, { phase: typeof TIME_PHASES[number]; habits: Habit[] }> = {};

    // Initialize groups in order
    TIME_PHASES.forEach(p => {
      groups[p.key] = { phase: p, habits: [] };
    });

    const searchLower = searchTerm.trim().toLowerCase();
    let filteredHabits = habits.filter(h =>
      h.name.toLowerCase().includes(searchLower)
    );

    // Filter by selected category if one is selected
    if (selectedCategory) {
      filteredHabits = filteredHabits.filter(h => {
        const phase = getPhaseForHabit(h);
        return phase.key === selectedCategory;
      });
    }

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
  }, [habits, searchTerm, selectedCategory]);

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

  // Animation delay counter for card entry animations
  let globalIdx = 0;

  return (
    <div className="flex flex-col relative w-full h-full">

      {/* Visual Header / Summary */}
      <div className="sticky top-0 z-20 bg-black/80 backdrop-blur-xl border-b border-[#2f3336]">
        <Tabs tabs={tabs} activeTab={activeTab} onTabChange={onTabChange} onLogout={onLogout} isLoggingOut={isLoggingOut} />
      </div>

      <div className="px-5 md:px-6 py-2 md:py-3 flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-[#2f3336]">
        {/* Row 1: Empty title area for spacing */}
        <div className="min-w-0" />

          <div className="flex flex-col gap-2 w-full md:w-auto">

            {/* Add Workspace Button */}
            <button
              onClick={onAddHabit}
              className="w-full bg-[#eff3f4] text-[#0f1419] py-2.5 px-6 rounded-xl flex items-center justify-center gap-2 shadow-[0_8px_20px_rgba(255,255,255,0.1)] transition-all hover:opacity-90 active:scale-[0.98] font-black tracking-tight text-[13px] md:text-[14px] touch-manipulation"
              style={{ touchAction: 'manipulation' }}
            >
              <Plus className="w-5 h-5" strokeWidth={3} />
              Add Workspace
            </button>

            {/* Search and Category Row - Side by side */}
            <div className="flex flex-row gap-3 items-center w-full">
              {/* Search Input - Takes most space on the LEFT */}
              <div className="relative flex-1">
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
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 w-5 h-5 flex items-center justify-center rounded-full bg-[#71767b]/30 hover:bg-[#71767b]/50 transition-colors touch-manipulation"
                    aria-label="Clear search"
                    style={{ touchAction: 'manipulation' }}
                  >
                    <span className="text-[#eff3f4] text-[10px] font-bold leading-none">✕</span>
                  </button>
                )}
              </div>
              
              {/* Category Filter Button - Auto width on the RIGHT with dynamic color */}
              <div className="relative shrink-0">
                <button
                  onClick={() => setShowCategoryFilter(!showCategoryFilter)}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-[13px] font-bold border justify-center whitespace-nowrap select-none touch-manipulation"
                  style={selectedCategory ? {
                    backgroundColor: `${TIME_PHASES.find(p => p.key === selectedCategory)?.color}15`,
                    borderColor: `${TIME_PHASES.find(p => p.key === selectedCategory)?.color}40`,
                    color: TIME_PHASES.find(p => p.key === selectedCategory)?.color,
                    touchAction: 'manipulation'
                  } : {
                    backgroundColor: '#16181c',
                    borderColor: '#2f3336',
                    color: '#71767b',
                    touchAction: 'manipulation'
                  }}
                >
                  <Target className="w-4 h-4" style={{ color: selectedCategory ? TIME_PHASES.find(p => p.key === selectedCategory)?.color : 'currentColor' }} />
                  <span className="hidden sm:inline">{selectedCategory ? TIME_PHASES.find(p => p.key === selectedCategory)?.label.toUpperCase() : 'ALL CATEGORIES'}</span>
                  <span className="sm:hidden">{selectedCategory ? TIME_PHASES.find(p => p.key === selectedCategory)?.label.toUpperCase() : 'ALL'}</span>
                  <ChevronRight className={`w-4 h-4 ${showCategoryFilter ? 'rotate-90' : ''}`} style={{ transition: 'none' }} />
                </button>
                
                {/* Category Dropdown - ChatGPT-style with separators */}
                {showCategoryFilter && (
                  <div 
                    className="absolute top-full right-0 mt-2 w-[260px] z-[100] max-w-[calc(100vw-1rem)] animate-dropdown-in"
                    style={{ touchAction: 'manipulation' }}
                  >
                    {/* Glow wrapper */}
                    <div className="relative rounded-2xl p-[1px] bg-gradient-to-b from-white/25 via-white/10 to-white/20 shadow-[0_0_40px_rgba(255,255,255,0.06),0_0_80px_rgba(255,255,255,0.03),inset_0_1px_1px_rgba(255,255,255,0.15)] overflow-hidden">
                      {/* Full shimmer overlay */}
                      <div className="absolute inset-0 pointer-events-none z-10">
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full animate-shimmer-full" />
                      </div>
                      {/* Inner black background */}
                      <div className="relative bg-black rounded-2xl overflow-hidden">
                        {/* Clean minimal header */}
                        <div className="px-4 py-2.5 border-b border-white/[0.08]">
                          <span className="text-[10px] font-medium text-white/40 tracking-widest uppercase">
                            Filter by category
                          </span>
                        </div>
                        
                        {/* All Categories Option */}
                        <button
                          onClick={() => { setSelectedCategory(null); setShowCategoryFilter(false); }}
                          className={`w-full px-4 py-2 text-left flex items-center justify-between group transition-all duration-200 touch-manipulation border-b border-white/[0.06] ${
                            !selectedCategory 
                              ? 'bg-white/[0.06]' 
                              : 'hover:bg-white/[0.03]'
                          }`}
                          style={{ touchAction: 'manipulation' }}
                        >
                          <span className="flex items-center gap-3">
                            <div className={`w-6 h-6 rounded-md flex items-center justify-center transition-all duration-200 ${
                              !selectedCategory ? 'bg-white/10' : 'bg-white/[0.05]'
                            }`}>
                              <Target className="w-3 h-3 text-white/50 animate-target-pulse" />
                            </div>
                            <span className={`text-[13px] font-medium tracking-wide uppercase ${
                              !selectedCategory ? 'text-white' : 'text-white/60'
                            }`}>
                              All Categories
                            </span>
                          </span>
                          <span className={`text-[12px] font-semibold px-2 py-0.5 rounded-md transition-all duration-200 ${
                            !selectedCategory 
                              ? 'bg-white/10 text-white' 
                              : 'text-white/40'
                          }`}>
                            {habits.length}
                          </span>
                        </button>
                        
                        {/* Category Options */}
                        <div>
                          {(() => {
                            // Filter to only visible categories first
                            const visiblePhases = TIME_PHASES.map(phase => ({
                              ...phase,
                              count: habits.filter(h => getPhaseForHabit(h).key === phase.key).length
                            })).filter(p => p.count > 0);
                            
                            return visiblePhases.map((phase, index) => {
                              const PhaseIcon = phase.icon;
                              const isSelected = selectedCategory === phase.key;
                              const isLast = index === visiblePhases.length - 1;
                              return (
                                <button
                                  key={phase.key}
                                  onClick={() => { setSelectedCategory(phase.key); setShowCategoryFilter(false); }}
                                  className={`w-full px-4 py-2 text-left flex items-center justify-between group transition-all duration-200 touch-manipulation animate-dropdown-item ${
                                    !isLast ? 'border-b border-white/[0.06]' : ''
                                  } ${
                                    isSelected ? 'bg-white/[0.06]' : 'hover:bg-white/[0.03]'
                                  }`}
                                  style={{ 
                                    touchAction: 'manipulation',
                                    animationDelay: `${index * 40}ms`
                                  }}
                                >
                                  <span className="flex items-center gap-3">
                                    <div 
                                      className={`w-6 h-6 rounded-md flex items-center justify-center transition-all duration-200 ${
                                        isSelected ? '' : 'bg-white/[0.05] group-hover:bg-white/[0.08]'
                                      }`}
                                      style={isSelected ? { backgroundColor: `${phase.color}20` } : {}}
                                    >
                                      <PhaseIcon 
                                        className={`w-3 h-3 transition-all duration-200 animate-target-pulse ${
                                          isSelected ? '' : 'text-white/50 group-hover:text-white/70'
                                        }`}
                                        style={isSelected ? { color: phase.color } : {}} 
                                      />
                                    </div>
                                    <span 
                                      className={`text-[13px] font-medium tracking-wide uppercase transition-colors duration-200 ${
                                        isSelected ? '' : 'text-white/60 group-hover:text-white/80'
                                      }`}
                                      style={isSelected ? { color: phase.color } : {}}
                                    >
                                      {phase.label.toUpperCase()}
                                    </span>
                                  </span>
                                  <span 
                                    className={`text-[12px] font-semibold px-2 py-0.5 rounded-md transition-all duration-200 ${
                                      isSelected ? '' : 'text-white/40'
                                    }`}
                                    style={isSelected ? { 
                                      backgroundColor: `${phase.color}20`,
                                      color: phase.color 
                                    } : {}}
                                  >
                                    {phase.count}
                                  </span>
                                </button>
                              );
                            });
                          })()}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
            </div>
          </div>
        </div>
      </div>

      <div className="px-5 md:px-6 py-2 space-y-4 pb-8 md:pb-20 text-[#eff3f4] animate-slide-up duration-[400ms]">
        <div className="flex flex-col gap-8 pb-20 md:pb-32 mt-0 text-[#eff3f4]" style={{ paddingBottom: 'max(5rem, env(safe-area-inset-bottom))' }}>
          {Object.entries(groupedByPhase).length === 0 && (
            <div className="text-center py-16 bg-white/[0.01] border border-dashed border-[#2f3336] rounded-3xl">
              <TrendingUp className="w-10 h-10 text-[#71767b]/40 mx-auto mb-4" />
              <p className="text-[#71767b] text-base font-bold">No categories tracked yet</p>
              <p className="text-[#71767b]/60 text-sm mt-1">Click "Add Workspace" to start your journey!</p>
            </div>
          )}          {Object.entries(groupedByPhase).map(([phaseKey, phaseGroup]) => {
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

                <div className="grid gap-3 md:gap-4 grid-cols-1">
                  {phaseHabits.map(habit => {
                    const totalMonthly = days.filter(d => habit.history[d.dateStr]).length;
                    const daysInCurrentMonth = days.length;
                    const target = habit.monthlyTarget || daysInCurrentMonth;
                    const completionRate = Math.min(Math.round((totalMonthly / target) * 100), 100);
                    const isExpanded = String(showActionsId) === String(habit.id);
                    // Cap animation delay at 10 items to prevent mobile performance issues
                    const animationDelay = `${Math.min(globalIdx++, 10) * 50}ms`;

                    return (
                      <div
                        key={habit.id}
                        className="animate-pop-in fill-mode-backwards"
                        style={{ animationDelay, willChange: 'transform, opacity' }}
                      >
                      <div
                        data-habit-id={String(habit.id)}
                        onClick={() => setShowActionsId(isExpanded ? null : habit.id)}
                        className={`w-full flex flex-col rounded-[24px] transition-all duration-500 group relative overflow-hidden cursor-pointer border-2 touch-manipulation ${
                          isExpanded 
                          ? 'bg-[#0a0a0a] border-white/[0.25] shadow-2xl z-[1]' 
                          : 'bg-white/[0.02] border-white/[0.15] hover:bg-white/[0.04] hover:border-white/[0.25]'
                        }`}
                        style={{ touchAction: 'manipulation' }}
                      >
                        {/* Background Accent Progress */}
                        <div
                          className="absolute left-0 top-0 bottom-0 transition-all duration-1000 opacity-[0.02]"
                          style={{ width: `${isLoaded ? completionRate : 0}%`, backgroundColor: phase.color }}
                        />

                        {/* Card Front Content */}
                        <div className="flex flex-row items-center justify-between p-4 md:p-6 relative z-10 w-full">
                          <div className="flex items-center gap-4 flex-1 min-w-0">
                            <div className="relative w-12 h-12 shrink-0">
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
                                  style={{ willChange: 'stroke-dashoffset' }}
                                />
                              </svg>
                              <div className="absolute inset-0 flex items-center justify-center">
                                <span className="text-[10px] md:text-[11px] font-black" style={{ color: phase.color }}>{completionRate}%</span>
                              </div>
                            </div>

                            <div className="min-w-0">
                              <h4 className={`text-[15px] md:text-[17px] font-black text-[#eff3f4] uppercase tracking-tight group-hover:text-white transition-all ${
                                isExpanded ? 'whitespace-normal break-words' : 'truncate'
                              }`}>
                                 {habit.name.toUpperCase()}
                              </h4>
                              <div className="flex items-center gap-3 mt-2">
                                <div className="flex items-center gap-1 bg-[#ff6b00]/10 px-2 py-0.5 rounded-full">
                                  <Flame className="w-3.5 h-3.5 text-[#ff6b00] animate-fire" />
                                  <span className="text-[11px] font-black text-[#ff6b00]">{habit.streak}</span>
                                </div>
                                <span className="text-[11px] font-bold text-[#71767b] uppercase tracking-widest">{totalMonthly}/{target} Days</span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 relative z-10">
                             <AlignLeft className={`w-6 h-6 transition-all duration-300 ${isExpanded ? 'text-white' : 'text-[#71767b]'}`} />
                          </div>
                        </div>

                        {/* Expanded Content */}
                        {isExpanded && (
                          <div className="px-4 md:px-6 pb-6 pt-1 animate-in fade-in zoom-in-95 slide-in-from-top-4 duration-400 ease-out relative z-10 w-full max-w-full overflow-hidden">
                            <div className="h-px bg-white/5 mb-6" />
                            
                            <div className="space-y-4">
                              {/* Action Row - Slim Line Style */}
                              <div className="flex items-center justify-center gap-6 py-2 border-y border-white/5" onClick={e => e.stopPropagation()}>
                                <button
                                  onClick={() => { setShowActionsId(null); onEditHabit(habit.id); }}
                                  className="flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest text-[#71767b] hover:text-[#eff3f4] transition-all touch-manipulation"
                                  style={{ touchAction: 'manipulation' }}
                                >
                                  <Pencil className="w-3 h-3" />
                                  Edit Category
                                </button>
                                <div className="w-[1px] h-3 bg-white/10" />
                                <button
                                  onClick={() => { setShowActionsId(null); onDeleteHabit(habit.id); }}
                                  className="flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest text-[#71767b] hover:text-red-400 transition-all touch-manipulation"
                                  style={{ touchAction: 'manipulation' }}
                                >
                                  <Trash2 className="w-3 h-3" />
                                  Delete
                                </button>
                              </div>

                              {/* Description Section */}
                              <div className="bg-white/[0.02] border border-white/5 rounded-[20px] p-4">
                                <h5 className="text-[10px] font-black text-[#71767b] uppercase tracking-[0.25em] mb-2.5 flex items-center gap-2">
                                  <Info className="w-3 h-3" />
                                  Description & Summary
                                </h5>
                                <div className="text-[13px] md:text-[14px] text-[#eff3f4]/90 leading-relaxed font-medium italic whitespace-pre-wrap px-1">
                                  {habit.description || "No detailed info provided."}
                                </div>
                              </div>

                              {/* Recent Activity Bar */}
                              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/[0.01] p-4 rounded-xl border border-white/5">
                                <span className="text-[11px] font-black text-[#71767b] uppercase tracking-widest">Recent Activity</span>
                                <div className="flex gap-2 overflow-x-auto no-scrollbar py-1" style={{ WebkitOverflowScrolling: 'touch' }}>
                                  {currentWeekDates.map((d, i) => (
                                    <div
                                      key={i}
                                      className={`w-6 h-6 rounded-full border transition-all flex items-center justify-center shrink-0 ${
                                        habit.history[d.dateStr] 
                                        ? '' 
                                        : 'bg-white/[0.04] border-white/5'
                                      }`}
                                      style={habit.history[d.dateStr] ? { backgroundColor: `${phase.color}20`, borderColor: `${phase.color}40` } : {}}
                                      title={d.dateStr}
                                    >
                                      {habit.history[d.dateStr] && (
                                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: phase.color }} />
                                      )}
                                      {!habit.history[d.dateStr] && (
                                        <span className="text-[8px] font-black text-[#71767b] select-none uppercase">{d.label}</span>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>
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
