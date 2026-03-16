import React from 'react';
import { Habit, Routine } from '../types';
import { Check, Plus, Clock, LayoutGrid, Trash2, Edit2 } from 'lucide-react';
import { getCategoryStyles } from '../utils/colors';

interface ScheduleProps {
  habits: Habit[];
  onToggleHabit: (id: any) => void;
  onDeleteHabit: (id: any) => void;
  onAddTask: () => void;
}

const TaskItem = React.memo<{ 
  habit: Habit; 
  onToggle: (id: any) => void; 
  onDelete: (id: any) => void;
}>(({ habit, onToggle, onDelete }) => {
  const todayStr = new Date().toISOString().split('T')[0];
  const isDone = habit.history[todayStr];

  return (
    <div className="p-2 md:p-3 flex gap-3 md:gap-4 hover:bg-white/[0.02] transition-colors group">
      <span className="text-[12px] md:text-[13px] font-bold text-[#71767b] w-9 md:w-12 shrink-0 pt-1">{habit.time}</span>
      <button 
        onClick={(e) => {
          e.preventDefault();
          onToggle(habit.id);
        }}
        className={`w-6 h-6 md:w-7 md:h-7 rounded-full border-2 flex items-center justify-center shrink-0 transition-all active:scale-90
          ${isDone ? 'bg-[#00ba7c] border-[#00ba7c] text-white shadow-lg shadow-[#00ba7c]/20' : 'border-white/20 hover:border-white/40 bg-white/[0.03]'}`}
        style={{ touchAction: 'manipulation' }}
      >
        {isDone && <Check className="w-3.5 h-3.5" strokeWidth={4} />}
      </button>
      <div className="flex-1 min-w-0">
        <p className={`text-[14px] md:text-[16px] font-bold tracking-tight leading-tight transition-colors ${isDone ? 'line-through text-[#71767b]' : 'text-[#eff3f4]'}`}>
          {habit.name}
        </p>
      </div>
      <button 
        onClick={() => onDelete(habit.id)}
        className="text-[#71767b] opacity-100 md:opacity-0 md:group-hover:opacity-100 hover:text-red-500 transition-all p-1"
      >
        <Trash2 className="w-3.5 h-3.5" />
      </button>
    </div>
  );
});

export const Schedule: React.FC<ScheduleProps> = ({ habits, onToggleHabit, onDeleteHabit, onAddTask }) => {

  const [currentTime, setCurrentTime] = React.useState(new Date());

  React.useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const today = new Date();
  const currentDay = today.getDate();
  const currentMonthDays = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
  const todayStr = today.toISOString().split('T')[0];

  const scheduledHabits = habits.filter(h => {
    if (!h.time) return false;
    
    // If it's a daily habit (no target set), always show
    if (!h.monthlyTarget) return true;
    
    // Always show if it's already done today
    if (h.history[todayStr]) return true;
    
    // Distribute target over daysInMonth using a deterministic pattern per habit
    // This avoids big gaps while keeping the schedule balanced
    const offset = h.id % currentMonthDays;
    const isScheduledToday = ((currentDay - 1 + offset) * h.monthlyTarget) % currentMonthDays < h.monthlyTarget;
    
    return isScheduledToday;
  });

  return (
    <div className="max-w-[1200px] mx-auto border-x border-[#2f3336] min-h-full bg-black">
      
      {/* Search/Filter style Header for Tasks */}
      <div className="px-4 py-3 md:p-6 border-b border-[#2f3336] flex items-center justify-between bg-black/90 backdrop-blur-sm z-20 sticky top-0 md:relative">
        <div className="flex flex-col w-full text-center md:text-left">
          <h2 className="text-[16px] md:text-[20px] font-black text-[#eff3f4]">
            Daily Habits
          </h2>
          <p className="text-[12px] md:text-[14px] font-bold text-[#71767b]">
            {currentTime.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })} • {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </p>
        </div>
      </div>

      <div className="p-2 md:p-4 space-y-3 md:space-y-6">
        {/* Phase 1: Morning */}
        <section className="bg-white/[0.02] border border-[#2f3336] rounded-xl md:rounded-2xl overflow-hidden shadow-sm">
          <div className="p-2 md:p-4 bg-[#f97316]/10 flex items-center justify-between border-b border-[#2f3336]">
             <div className="flex items-center gap-2">
                <h3 className="text-[#f97316] font-bold text-[11px] md:text-[14px] uppercase tracking-wider">Phase 1: Morning (5 AM – 12 PM)</h3>
             </div>
             <span className="text-[#f97316] text-[8px] md:text-[10px] font-bold px-1.5 py-0.5 md:px-2.5 md:py-1 rounded-md bg-[#f97316]/10 border border-[#f97316]/30 uppercase tracking-tight">Crucial</span>
          </div>
          <div className="divide-y divide-[#2f3336]">
            {scheduledHabits.filter(h => h.time! >= "05:00" && h.time! < "12:00").sort((a,b) => a.time!.localeCompare(b.time!)).map(habit => (
              <TaskItem key={habit.id} habit={habit} onToggle={onToggleHabit} onDelete={onDeleteHabit} />
            ))}
          </div>
        </section>

        {/* Phase 2: Afternoon */}
        <section className="bg-white/[0.02] border border-[#2f3336] rounded-xl md:rounded-2xl overflow-hidden shadow-sm">
          <div className="p-2 md:p-4 bg-[#ffd400]/10 flex items-center justify-between border-b border-[#2f3336]">
             <div className="flex items-center gap-2">
                <h3 className="text-[#ffd400] font-bold text-[11px] md:text-[14px] uppercase tracking-wider">Phase 2: Afternoon (12 PM – 6 PM)</h3>
             </div>
             <span className="text-[#ffd400] text-[8px] md:text-[10px] font-bold px-1.5 py-0.5 md:px-2.5 md:py-1 rounded-md bg-[#ffd400]/10 border border-[#ffd400]/30 uppercase tracking-tight">Focused</span>
          </div>
          <div className="divide-y divide-[#2f3336]">
            {scheduledHabits.filter(h => h.time! >= "12:00" && h.time! < "18:00").sort((a,b) => a.time!.localeCompare(b.time!)).map(habit => (
              <TaskItem key={habit.id} habit={habit} onToggle={onToggleHabit} onDelete={onDeleteHabit} />
            ))}
          </div>
        </section>

        {/* Phase 3: Night */}
        <section className="bg-white/[0.02] border border-[#2f3336] rounded-xl md:rounded-2xl overflow-hidden shadow-sm">
          <div className="p-2 md:p-4 bg-[#7856ff]/10 flex items-center justify-between border-b border-[#2f3336]">
             <div className="flex items-center gap-2">
                <h3 className="text-[#7856ff] font-bold text-[11px] md:text-[14px] uppercase tracking-wider">Phase 3: Night (6 PM – 12 AM)</h3>
             </div>
             <span className="text-[#7856ff] text-[8px] md:text-[10px] font-bold px-1.5 py-0.5 md:px-2.5 md:py-1 rounded-md bg-[#7856ff]/10 border border-[#7856ff]/30 uppercase tracking-tight">Today</span>
          </div>
          <div className="divide-y divide-[#2f3336]">
            {scheduledHabits.filter(h => h.time! >= "18:00" && h.time! <= "23:59").sort((a,b) => a.time!.localeCompare(b.time!)).map(habit => (
              <TaskItem key={habit.id} habit={habit} onToggle={onToggleHabit} onDelete={onDeleteHabit} />
            ))}
          </div>
        </section>

        {/* Phase 4: Midnight */}
        <section className="bg-white/[0.02] border border-[#2f3336] rounded-xl md:rounded-2xl overflow-hidden shadow-sm">
          <div className="p-2 md:p-4 bg-[#22c55e]/10 flex items-center justify-between border-b border-[#2f3336]">
             <div className="flex items-center gap-2">
                <h3 className="text-[#22c55e] font-bold text-[11px] md:text-[14px] uppercase tracking-wider">Phase 4: Midnight (12 AM – 5 AM)</h3>
             </div>
             <span className="text-[#22c55e] text-[8px] md:text-[10px] font-bold px-1.5 py-0.5 md:px-2.5 md:py-1 rounded-md bg-[#22c55e]/10 border border-[#22c55e]/30 uppercase tracking-tight">Quiet</span>
          </div>
          <div className="divide-y divide-[#2f3336]">
            {scheduledHabits.filter(h => h.time! >= "00:00" && h.time! < "05:00").sort((a,b) => a.time!.localeCompare(b.time!)).map(habit => (
              <TaskItem key={habit.id} habit={habit} onToggle={onToggleHabit} onDelete={onDeleteHabit} />
            ))}
          </div>
        </section>
      </div>



    </div>
  );
};
