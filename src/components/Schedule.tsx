import React from 'react';
import { Habit, Routine } from '../types';
import { Check, Plus, Clock, LayoutGrid, Trash2, Edit2 } from 'lucide-react';
import { getCategoryStyles } from '../utils/colors';

interface ScheduleProps {
  habits: Habit[];
  routines: Routine[];
  onToggleHabit: (id: number) => void;
  onToggleRoutine: (id: number) => void;
  onDeleteRoutine: (id: number) => void;
  onAddTask: () => void;
  onAddRoutine: () => void;
}

const TaskItem: React.FC<{ 
  habit: Habit; 
  onToggle: (id: number) => void; 
  onDelete: (id: number) => void;
}> = ({ habit, onToggle, onDelete }) => {
  const todayStr = new Date().toISOString().split('T')[0];
  const isDone = habit.history[todayStr];

  return (
    <div className="p-4 flex gap-4 hover:bg-white/[0.02] transition-colors group">
      <span className="text-[14px] font-bold text-[#71767b] w-12 shrink-0 pt-1.5">{habit.time}</span>
      <button 
        onClick={() => onToggle(habit.id)}
        className={`w-8 h-8 rounded-full border-2 flex items-center justify-center shrink-0 transition-all mt-0.5
          ${isDone ? 'bg-[#00ba7c] border-[#00ba7c] text-white' : 'border-[#536471] hover:border-x-blue bg-transparent'}`}
      >
        {isDone && <Check className="w-4 h-4" strokeWidth={3} />}
      </button>
      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <p className={`text-[17px] font-bold tracking-tight transition-colors ${isDone ? 'line-through text-[#71767b]' : 'text-[#eff3f4]'}`}>
            {habit.name}
          </p>
        </div>
      </div>
      <button 
        onClick={() => onDelete(habit.id)}
        className="text-[#71767b] opacity-0 group-hover:opacity-100 hover:text-red-500 transition-all p-2"
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  );
};

export const Schedule: React.FC<ScheduleProps> = ({ habits, routines, onToggleHabit, onToggleRoutine, onDeleteHabit, onDeleteRoutine, onAddTask, onAddRoutine }) => {

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
    <div className="max-w-[600px] mx-auto border-x border-[#2f3336] min-h-screen bg-black">
      
      {/* Search/Filter style Header for Tasks */}
      <div className="p-6 border-b border-[#2f3336] flex items-center justify-between bg-black z-20">
        <h2 className="text-[22px] font-black text-[#eff3f4] flex items-center gap-2">
          <Clock className="w-6 h-6 text-x-blue" />
          Today's Schedule
        </h2>
      </div>

      <div className="p-4 space-y-8">
        {/* Phase 1: The Morning Launch */}
        <section className="bg-white/[0.02] border border-[#2f3336] rounded-2xl overflow-hidden shadow-sm">
          <div className="p-4 bg-[#1d9bf0]/10 flex items-center justify-between border-b border-[#2f3336]">
             <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-x-blue animate-pulse" />
                <h3 className="text-x-blue font-black text-[14px] uppercase tracking-widest">Phase 1: The Morning Launch (5 AM – 8 AM)</h3>
             </div>
             <span className="text-x-blue text-[10px] font-black px-2.5 py-1 rounded-md bg-x-blue/10 border border-x-blue/30 uppercase tracking-tighter">Crucial</span>
          </div>
          <div className="divide-y divide-[#2f3336]">
            {scheduledHabits.filter(h => h.time! >= "05:00" && h.time! < "12:00").sort((a,b) => a.time!.localeCompare(b.time!)).map(habit => (
              <TaskItem key={habit.id} habit={habit} onToggle={onToggleHabit} onDelete={onDeleteHabit} />
            ))}
          </div>
        </section>

        {/* Phase 2: The Deep Work Zone */}
        <section className="bg-white/[0.02] border border-[#2f3336] rounded-2xl overflow-hidden shadow-sm">
          <div className="p-4 bg-[#f91880]/10 flex items-center justify-between border-b border-[#2f3336]">
             <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-[#f91880]" />
                <h3 className="text-[#f91880] font-black text-[14px] uppercase tracking-widest">Phase 2: The Deep Work Zone (PM)</h3>
             </div>
             <span className="text-[#f91880] text-[10px] font-black px-2.5 py-1 rounded-md bg-[#f91880]/10 border border-[#f91880]/30 uppercase tracking-tighter">Focused</span>
          </div>
          <div className="divide-y divide-[#2f3336]">
            {scheduledHabits.filter(h => h.time! >= "12:00" && h.time! < "20:00").sort((a,b) => a.time!.localeCompare(b.time!)).map(habit => (
              <TaskItem key={habit.id} habit={habit} onToggle={onToggleHabit} onDelete={onDeleteHabit} />
            ))}
          </div>
        </section>

        {/* Phase 3: The Evening Wind-down */}
        <section className="bg-white/[0.02] border border-[#2f3336] rounded-2xl overflow-hidden shadow-sm">
          <div className="p-4 bg-[#7856ff]/10 flex items-center justify-between border-b border-[#2f3336]">
             <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-[#7856ff]" />
                <h3 className="text-[#7856ff] font-black text-[14px] uppercase tracking-widest">Phase 3: The Evening Wind-down</h3>
             </div>
             <span className="text-[#7856ff] text-[10px] font-black px-2.5 py-1 rounded-md bg-[#7856ff]/10 border border-[#7856ff]/30 uppercase tracking-tighter">Reset</span>
          </div>
          <div className="divide-y divide-[#2f3336]">
            {scheduledHabits.filter(h => (h.time! >= "20:00" || h.time! < "05:00")).sort((a,b) => {
              if (a.time!.substring(0,2) < "05" && b.time!.substring(0,2) >= "20") return 1;
              if (a.time!.substring(0,2) >= "20" && b.time!.substring(0,2) < "05") return -1;
              return a.time!.localeCompare(b.time!);
            }).map(habit => (
              <TaskItem key={habit.id} habit={habit} onToggle={onToggleHabit} onDelete={onDeleteHabit} />
            ))}
          </div>
        </section>
      </div>

      {/* Routine Section */}
       <div className="p-6 border-y border-[#2f3336] flex items-center justify-between bg-black mt-8">
        <h2 className="text-[22px] font-black text-[#eff3f4] flex items-center gap-2">
          <LayoutGrid className="w-6 h-6 text-[#7856ff]" />
          Extra Routines
        </h2>
        <button onClick={onAddRoutine} className="border border-[#536471] text-[#eff3f4] font-bold px-5 py-2 rounded-full text-[14px] hover:bg-white/10 transition-colors">
          Add Routine
        </button>
      </div>

      <div className="divide-y divide-[#2f3336]">
        {routines.map(routine => (
          <div key={routine.id} className="p-4 flex gap-4 hover:bg-white/[0.02] transition-colors group">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-[22px] bg-[#2f3336]/40 border border-[#2f3336] shrink-0">
              {routine.icon}
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className={`text-[17px] font-bold ${routine.done ? 'text-[#71767b] line-through' : 'text-[#eff3f4]'}`}>{routine.name}</h3>
                  <p className="text-[13px] text-[#71767b] font-medium">{routine.time}</p>
                </div>
                <div className="flex items-center gap-2">
                   <button 
                    onClick={() => onDeleteRoutine(routine.id)}
                    className="text-[#71767b] opacity-0 group-hover:opacity-100 hover:text-red-500 transition-all p-2"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => onToggleRoutine(routine.id)}
                    className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all
                      ${routine.done ? 'bg-[#00ba7c] border-[#00ba7c] text-white' : 'border-[#536471] hover:border-x-blue bg-transparent'}`}
                  >
                    {routine.done && <Check className="w-4 h-4" strokeWidth={3} />}
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

    </div>
  );
};
