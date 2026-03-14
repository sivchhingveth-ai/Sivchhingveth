import React from 'react';
import { SavingGoal } from '../types';
import { Plus, Trash2 } from 'lucide-react';

interface SavingsProps {
  savings: SavingGoal[];
  onDeleteGoal: (id: number) => void;
  onAddGoal: () => void;
}

export const Savings: React.FC<SavingsProps> = ({ savings, onDeleteGoal, onAddGoal }) => {
  const totalSaved = savings.reduce((a, s) => a + s.saved, 0);
  const totalGoal = savings.reduce((a, s) => a + s.goal, 0);
  const pct = totalGoal ? Math.round(totalSaved / totalGoal * 100) : 0;

  return (
    <div className="max-w-[600px] mx-auto border-x border-[#2f3336] min-h-screen bg-black">
      
      {/* Header */}
      <div className="p-4 border-b border-[#2f3336] flex items-center justify-between">
        <h2 className="text-[19px] font-black text-[#eff3f4]">Savings</h2>
        <button onClick={onAddGoal} className="bg-x-blue text-white font-bold px-4 py-1.5 rounded-full text-[14px] hover:opacity-90 transition-opacity">
          Add Goal
        </button>
      </div>

      {/* Summary View */}
      <div className="grid grid-cols-3 divide-x divide-[#2f3336] border-b border-[#2f3336] bg-white/[0.01]">
        <div className="p-4 text-center">
          <p className="text-[13px] font-bold text-[#71767b] uppercase">Saved</p>
          <p className="text-[20px] font-black text-[#eff3f4] mt-1">${totalSaved.toLocaleString()}</p>
        </div>
        <div className="p-4 text-center">
          <p className="text-[13px] font-bold text-[#71767b] uppercase">Goal</p>
          <p className="text-[20px] font-black text-[#eff3f4] mt-1">${totalGoal.toLocaleString()}</p>
        </div>
        <div className="p-4 text-center">
          <p className="text-[13px] font-bold text-[#71767b] uppercase">Progress</p>
          <p className="text-[20px] font-black text-x-blue mt-1">{pct}%</p>
        </div>
      </div>

      {/* Saving Goals List */}
      <div className="divide-y divide-[#2f3336]">
        {savings.map(s => {
          const goalPct = Math.min(100, Math.round(s.saved / s.goal * 100));
          const left = s.goal - s.saved;
          return (
            <div key={s.id} className="p-4 hover:bg-white/[0.02] transition-colors group">
              <div className="flex justify-between items-start mb-3">
                <div className="min-w-0 flex-1">
                  <h3 className="text-[17px] font-bold text-[#eff3f4] truncate">{s.name}</h3>
                  <p className="text-[14px] text-[#71767b] mt-0.5">
                    <span className="text-x-blue font-bold">${s.saved.toLocaleString()}</span> saved of ${s.goal.toLocaleString()}
                  </p>
                </div>
                <button 
                  onClick={() => onDeleteGoal(s.id)}
                  className="text-[#71767b] opacity-0 group-hover:opacity-100 hover:text-red-500 transition-all p-2"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
              
              <div className="w-full h-[8px] bg-white/5 rounded-full overflow-hidden mb-3">
                <div 
                  className="h-full transition-all duration-1000" 
                  style={{ 
                    width: `${goalPct}%`, 
                    backgroundColor: s.color === '#34c759' ? '#00ba7c' : s.color === '#007aff' ? '#1d9bf0' : s.color === '#ff9500' ? '#f59e0b' : s.color 
                  }} 
                />
              </div>

              <div className="flex justify-between items-center">
                <span className="text-[13px] font-bold text-x-blue">{goalPct}% complete</span>
                <span className="text-[13px] font-bold text-[#71767b]">${left.toLocaleString()} left</span>
              </div>
            </div>
          );
        })}
      </div>

      {savings.length === 0 && (
        <div className="p-10 text-center">
          <p className="text-[#71767b] text-lg">No saving goals yet. Time to plan ahead!</p>
        </div>
      )}
    </div>
  );
};
