import React from 'react';
import { Habit } from '../types';
import { Check, Flame, Trash2 } from 'lucide-react';

interface HabitsProps {
  habits: Habit[];
  onToggleHabit: (id: number) => void;
  onDeleteHabit: (id: number) => void;
  onAddHabit: () => void;
}

export const Habits: React.FC<HabitsProps> = ({ habits, onToggleHabit, onDeleteHabit, onAddHabit }) => {
  const completedHabits = habits.filter(h => h.doneToday).length;
  const totalHabits = habits.length;
  const progressPercent = totalHabits > 0 ? Math.round((completedHabits / totalHabits) * 100) : 0;

  return (
    <div className="max-w-[600px] mx-auto border-x border-[#2f3336] min-h-screen bg-black">
      
      {/* Search/Filter Bar style */}
      <div className="p-4 border-b border-[#2f3336] flex items-center justify-between">
        <h2 className="text-[19px] font-black text-[#eff3f4]">Habits</h2>
        <button onClick={onAddHabit} className="bg-x-blue text-white font-bold px-4 py-1.5 rounded-full text-[14px] hover:opacity-90 transition-opacity">
          Add Habit
        </button>
      </div>

      {/* Progress Header */}
      <div className="p-4 border-b border-[#2f3336] bg-white/[0.02]">
        <div className="flex justify-between items-end mb-2">
          <span className="text-[#71767b] text-[14px] font-bold uppercase tracking-tight">Today's Progress</span>
          <span className="text-[#eff3f4] font-black text-2xl">{progressPercent}%</span>
        </div>
        <div className="w-full h-[6px] bg-[#2f3336] rounded-full overflow-hidden">
          <div className="h-full bg-x-blue transition-all duration-700" style={{ width: `${progressPercent}%` }} />
        </div>
      </div>

      {/* Habits List */}
      <div className="divide-y divide-[#2f3336]">
        {habits.map(habit => (
          <div key={habit.id} className="p-4 flex gap-4 hover:bg-white/[0.02] transition-colors group">
            <button 
              onClick={() => onToggleHabit(habit.id)}
              className={`w-9 h-9 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                habit.doneToday 
                  ? 'bg-[#00ba7c] border-[#00ba7c] text-white shadow-[0_0_10px_rgba(0,186,124,0.2)]' 
                  : 'border-[#536471] hover:border-x-blue hover:bg-x-blue/10 bg-transparent'
              }`}
            >
              {habit.doneToday && <Check className="w-5 h-5" strokeWidth={3} />}
            </button>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between w-full">
                <p className={`text-[17px] leading-tight font-bold truncate ${habit.doneToday ? 'text-[#71767b] line-through' : 'text-[#eff3f4]'}`}>
                  {habit.name}
                </p>
                <div className="flex items-center gap-1.5 text-orange-500 font-bold text-[14px]">
                  <Flame className="w-4 h-4" fill="currentColor" />
                  {habit.streak}
                </div>
              </div>
              
              <div className="flex gap-1 mt-2">
                {habit.week.map((val, i) => (
                  <div key={i} className={`flex-1 h-1 rounded-full ${val ? 'bg-[#00ba7c]' : 'bg-[#2f3336]'}`} />
                ))}
              </div>
            </div>
            
            <button 
              onClick={() => { if(confirm('Delete this habit?')) onDeleteHabit(habit.id); }}
              className="text-[#71767b] opacity-0 group-hover:opacity-100 hover:text-red-500 transition-all p-2"
            >
              <Trash2 className="w-5 h-5" />
            </button>
          </div>
        ))}
      </div>

      {totalHabits === 0 && (
        <div className="p-10 text-center">
          <p className="text-[#71767b] text-lg">No habits yet. Start a new streak!</p>
        </div>
      )}
    </div>
  );
};
