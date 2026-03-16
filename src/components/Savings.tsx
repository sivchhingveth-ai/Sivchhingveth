import React, { useState, useEffect, useRef } from 'react';
import { SavingGoal } from '../types';
import { Plus, Trash2, Calendar, ChevronDown, ChevronUp, ArrowUpRight } from 'lucide-react';

interface SavingsProps {
  savings: SavingGoal[];
  onDeleteGoal: (id: number) => void;
  onAddGoal: () => void;
  onAddSaving: (id: number, amount: number, date: string) => void;
}

const SavingItem: React.FC<{
  s: SavingGoal;
  onDelete: (id: number) => void;
  onAddSaving: (id: number, amount: number, date: string) => void;
}> = ({ s, onDelete, onAddSaving }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showAddSaving, setShowAddSaving] = useState(false);
  const [savingAmount, setSavingAmount] = useState('');
  const [savingDate, setSavingDate] = useState(new Date().toISOString().split('T')[0]);
  const addSavingRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!showAddSaving) return;
    const handleClickOutside = (event: MouseEvent) => {
      if (addSavingRef.current && !addSavingRef.current.contains(event.target as Node)) {
        setShowAddSaving(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showAddSaving]);

  const goalPct = Math.min(100, Math.round(s.saved / s.goal * 100));
  const left = s.goal - s.saved;
  const accentColor = s.color === '#34c759' ? '#00ba7c' : s.color === '#007aff' ? '#1d9bf0' : s.color === '#ff9500' ? '#f59e0b' : s.color;

  const handleAddSaving = () => {
    const amt = parseFloat(savingAmount);
    if (!isNaN(amt) && amt > 0) {
      onAddSaving(s.id, amt, savingDate);
      setSavingAmount('');
      setShowAddSaving(false);
    }
  };

  // Generate range of dates from start to target OR current
  const getDisplayDates = () => {
    const dates = [];
    const start = new Date(s.startDate);
    const end = new Date(s.targetDate);
    const curr = new Date(start);
    
    while (curr <= end) {
      dates.push(curr.toISOString().split('T')[0]);
      curr.setDate(curr.getDate() + 1);
      if (dates.length > 365) break; // Safety
    }
    return dates.reverse(); // Newest first
  };

  return (
    <div className="x-card overflow-hidden group">
      <div className="p-5 flex flex-col gap-4">
        <div className="flex justify-between items-start">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-[18px] font-black text-[#eff3f4] truncate">{s.name}</h3>
              <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-white/5 border border-white/10">
                <Calendar className="w-3 h-3 text-[#71767b]" />
                <span className="text-[9px] font-black text-[#71767b] uppercase tracking-widest">
                  {new Date(s.startDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} – {new Date(s.targetDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                </span>
              </div>
            </div>
            <p className="text-[14px] font-medium text-[#71767b]">
              <span className="text-white font-black">${s.saved.toLocaleString()}</span> of <span className="text-white/40">${s.goal.toLocaleString()}</span>
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
               onClick={() => setShowAddSaving(!showAddSaving)}
               className="w-10 h-10 rounded-full flex items-center justify-center bg-white/[0.05] border border-white/10 text-[#71767b] hover:text-white hover:bg-white/10 transition-all"
            >
              <Plus className="w-5 h-5" />
            </button>
            <button
              onClick={() => onDelete(s.id)}
              className="w-10 h-10 rounded-full flex items-center justify-center bg-white/[0.05] border border-white/10 text-[#71767b] md:opacity-0 md:group-hover:opacity-100 hover:text-red-500 hover:bg-red-500/10 hover:border-red-500/20 transition-all"
            >
              <Trash2 className="w-5 h-5" />
            </button>
          </div>
        </div>

        {showAddSaving && (
          <div ref={addSavingRef} className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 space-y-3 animate-slide-down relative z-10">
            <div className="grid grid-cols-2 gap-3">
              <input 
                type="number" 
                placeholder="Amount ($)" 
                className="bg-black/40 border border-[#2f3336] px-3 py-2 rounded-xl text-sm text-white outline-none focus:border-x-blue"
                value={savingAmount}
                onChange={e => setSavingAmount(e.target.value)}
              />
              <input 
                type="date" 
                className="bg-black/40 border border-[#2f3336] px-3 py-2 rounded-xl text-sm text-white outline-none focus:border-x-blue"
                style={{ colorScheme: 'dark' }}
                value={savingDate}
                onChange={e => setSavingDate(e.target.value)}
              />
            </div>
            <button 
              onClick={handleAddSaving}
              className="w-full py-2 bg-[#eff3f4] text-black font-black text-xs rounded-xl hover:bg-white transition-all uppercase tracking-widest"
            >
              Record Saving
            </button>
          </div>
        )}

        <div className="space-y-2">
          <div className="flex justify-between items-end">
            <span className="text-[13px] font-black text-[#eff3f4]">{goalPct}% Complete</span>
            <span className="text-[11px] font-bold text-[#71767b] uppercase tracking-tighter">${left.toLocaleString()} left to target</span>
          </div>
          <div className="w-full h-2.5 bg-white/[0.03] border border-white/20 rounded-full overflow-hidden">
            <div
              className="h-full transition-all duration-1000 relative"
              style={{
                width: `${goalPct}%`,
                backgroundColor: accentColor
              }}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 animate-shimmer" />
            </div>
          </div>
        </div>

        <button 
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center justify-center gap-2 py-2 text-[11px] font-black text-[#71767b] hover:text-[#eff3f4] uppercase tracking-[0.2em] transition-colors"
        >
          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          {isExpanded ? 'Hide Details' : 'See Details'}
        </button>
      </div>

      {isExpanded && (
        <div className="border-t border-[#2f3336] bg-white/[0.01] animate-fade-in">
          <div className="p-4 space-y-3">
            <p className="text-[11px] font-black text-[#71767b] uppercase tracking-[0.2em] px-2">Saving History</p>
            <div className="max-h-[300px] overflow-y-auto pr-1 space-y-1 custom-scrollbar">
              {getDisplayDates().map(date => {
                const amount = s.history[date] || 0;
                return (
                  <div key={date} className="flex items-center justify-between p-3 rounded-xl hover:bg-white/[0.03] transition-colors group/row">
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full ${amount > 0 ? '' : 'bg-[#2f3336]'}`} style={amount > 0 ? { backgroundColor: accentColor } : {}} />
                      <span className="text-[13px] font-bold text-[#eff3f4]">{new Date(date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      {amount > 0 ? (
                        <div className="flex items-center gap-1.5 bg-green-500/10 border border-green-500/20 px-2 py-0.5 rounded-lg">
                          <ArrowUpRight className="w-3 h-3 text-green-500" />
                          <span className="text-[13px] font-black text-green-500">+${amount.toLocaleString()}</span>
                        </div>
                      ) : (
                        <span className="text-[13px] font-medium text-[#2f3336]">No entry</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export const Savings: React.FC<SavingsProps> = ({ savings, onDeleteGoal, onAddGoal, onAddSaving }) => {
  const totalSaved = savings.reduce((a, s) => a + s.saved, 0);
  const totalGoal = savings.reduce((a, s) => a + s.goal, 0);
  const pct = totalGoal ? Math.round(totalSaved / totalGoal * 100) : 0;

  return (
    <div className="max-w-[1200px] mx-auto border-x border-[#2f3336] min-h-screen bg-black">
      
      {/* Header */}
      <div className="p-4 border-b border-[#2f3336] flex items-center justify-between">
        <h2 className="text-[19px] font-black text-[#eff3f4]">Savings</h2>
        <button onClick={onAddGoal} className="x-button-glass py-1.5 text-[14px]">
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
      <div className="p-4 grid gap-4">
        {savings.map(s => (
          <SavingItem key={s.id} s={s} onDelete={onDeleteGoal} onAddSaving={onAddSaving} />
        ))}
      </div>

      {savings.length === 0 && (
        <div className="p-10 text-center">
          <p className="text-[#71767b] text-lg">No saving goals yet. Time to plan ahead!</p>
        </div>
      )}

      {/* Spacing for mobile nav */}
      <div className="h-20" />
    </div>
  );
};
