import React, { useState, useEffect, useRef } from 'react';
import { SavingGoal } from '../types';
import { Plus, Trash2, Calendar, ChevronDown, ChevronUp, ArrowUpRight } from 'lucide-react';

interface SavingsProps {
  savings: SavingGoal[];
  onDeleteGoal: (id: any) => void;
  onAddGoal: () => void;
  onAddSaving: (id: any, amount: number, date: string) => void;
}

const SavingItem: React.FC<{
  s: SavingGoal;
  onDelete: (id: any) => void;
  onAddSaving: (id: any, amount: number, date: string) => void;
}> = ({ s, onDelete, onAddSaving }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showAddSaving, setShowAddSaving] = useState(false);
  const [savingAmount, setSavingAmount] = useState('');
  const [savingDate, setSavingDate] = useState(new Date().toISOString().split('T')[0]);
  const addSavingRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!showAddSaving) return;
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      if (addSavingRef.current && !addSavingRef.current.contains(event.target as Node)) {
        setShowAddSaving(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [showAddSaving]);

  const goalPct = Math.min(100, Math.round(s.saved / s.goal * 100));
  const left = s.goal - s.saved;
  const accentColor = "#ffffff";

  const handleAddSaving = () => {
    const amt = parseFloat(savingAmount);
    if (!isNaN(amt) && amt > 0) {
      onAddSaving(s.id, amt, savingDate);
      setSavingAmount('');
      setShowAddSaving(false);
    }
  };

  const getDisplayDates = () => {
    const dates = [];
    const start = new Date(s.startDate);
    const end = new Date(s.targetDate);
    const curr = new Date(start);
    
    while (curr <= end) {
      dates.push(curr.toISOString().split('T')[0]);
      curr.setDate(curr.getDate() + 1);
      if (dates.length > 365) break; 
    }
    return dates.reverse(); 
  };

  return (
    <div className="x-card overflow-hidden group">
      <div className="p-4 md:p-5 flex flex-col gap-3 md:gap-4">
        <div className="flex justify-between items-start gap-4">
          <div className="min-w-0 flex-1">
            <h3 className="text-[16px] md:text-[18px] font-bold text-[#eff3f4] leading-tight mb-2">
              {s.name}
            </h3>
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-white/5 border border-white/10 w-fit">
              <Calendar className="w-2.5 h-2.5 text-[#71767b]" />
              <span className="text-[8px] md:text-[9px] font-bold text-[#71767b] uppercase tracking-wider">
                {new Date(s.startDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} – {new Date(s.targetDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-1.5 md:gap-2 shrink-0 pt-0.5">
            <button
               onClick={() => {
                 if (!showAddSaving) {
                   setSavingDate(new Date().toISOString().split('T')[0]);
                 }
                 setShowAddSaving(!showAddSaving);
               }}
               className="w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center bg-white/[0.05] border border-white/10 text-[#71767b] hover:text-white hover:bg-white/10 transition-all active:scale-90"
            >
              <Plus className="w-4 h-4 md:w-5 md:h-5" />
            </button>
            <button
              onClick={() => onDelete(s.id)}
              className="w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center bg-white/[0.05] border border-white/10 text-[#71767b] md:opacity-0 md:group-hover:opacity-100 hover:text-red-500 hover:bg-red-500/10 hover:border-red-500/20 transition-all active:scale-90"
            >
              <Trash2 className="w-4 h-4 md:w-5 md:h-5" />
            </button>
          </div>
        </div>

        {showAddSaving && (
          <div ref={addSavingRef} className="p-3 md:p-4 rounded-xl md:rounded-2xl bg-white/[0.03] border border-white/10 space-y-3 animate-slide-down relative z-10">
            <div className="flex flex-col md:grid md:grid-cols-2 gap-2 md:gap-3">
              <input 
                type="number" 
                placeholder="Amount ($)" 
                className="w-full bg-black/40 border border-[#2f3336] px-3 py-2 rounded-xl text-sm text-white outline-none focus:border-x-blue"
                value={savingAmount}
                onChange={e => setSavingAmount(e.target.value)}
                autoComplete="off"
              />
              <input 
                type="date" 
                className="w-full bg-black/40 border border-[#2f3336] px-3 py-2 rounded-xl text-sm text-[#71767b] outline-none cursor-default"
                style={{ colorScheme: 'dark' }}
                value={savingDate}
                readOnly
              />
            </div>
            <button 
              onClick={handleAddSaving}
              className="w-full py-2.5 bg-[#eff3f4] text-black font-extrabold text-[13px] md:text-sm rounded-xl hover:bg-white transition-all uppercase tracking-wider active:scale-[0.95]"
            >
              Record Saving
            </button>
          </div>
        )}

        <div className="space-y-1.5 md:space-y-2">
          <div className="flex justify-between items-end gap-2">
            <span className="text-[11px] md:text-[13px] font-black text-[#eff3f4] whitespace-nowrap">{goalPct}% Complete</span>
            <p className="text-[10px] md:text-[12px] font-medium text-[#71767b] text-right truncate">
              <span className="text-[#00ba7c] font-black">${s.saved.toLocaleString()}</span> of <span className="text-white/40">${s.goal.toLocaleString()}</span>
            </p>
          </div>
          <div className="w-full h-2 md:h-2.5 bg-white/[0.03] border border-white/20 rounded-full overflow-hidden">
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
          className="flex items-center justify-center gap-2 py-1 md:py-2 text-[10px] md:text-[11px] font-bold text-[#71767b] hover:text-[#eff3f4] uppercase tracking-wider transition-colors"
        >
          {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          {isExpanded ? 'Hide Details' : 'See Details'}
        </button>
      </div>

      {isExpanded && (
        <div className="border-t border-[#2f3336] bg-white/[0.01] animate-fade-in">
          <div className="p-3 md:p-4 space-y-2 md:space-y-3">
            <p className="text-[9px] md:text-[11px] font-bold text-[#71767b] uppercase tracking-wider px-2">Saving History</p>
            <div className="max-h-[250px] md:max-h-[300px] overflow-y-auto pr-1 space-y-0.5 custom-scrollbar">
              {getDisplayDates().map(date => {
                const amount = s.history[date] || 0;
                return (
                  <div key={date} className="flex items-center justify-between p-2 md:p-3 rounded-lg md:rounded-xl hover:bg-white/[0.03] transition-colors group/row">
                    <div className="flex items-center gap-2 md:gap-3">
                      <div className={`w-1.5 h-1.5 md:w-2 md:h-2 rounded-full ${amount > 0 ? 'bg-[#00ba7c]' : 'bg-[#2f3336]'}`} />
                      <span className="text-[11px] md:text-[13px] font-bold text-[#eff3f4]">
                        {new Date(date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                      </span>
                    </div>
                    <div>
                      {amount > 0 ? (
                        <div className="flex items-center gap-1 bg-[#00ba7c]/10 border border-[#00ba7c]/20 px-1.5 py-0.5 rounded-lg">
                          <ArrowUpRight className="w-2.5 h-2.5 text-[#00ba7c]" />
                          <span className="text-[11px] md:text-[13px] font-bold text-[#00ba7c]">+${amount.toLocaleString()}</span>
                        </div>
                      ) : (
                        <span className="text-[11px] md:text-[13px] font-medium text-[#2f3336]">--</span>
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
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const totalSaved = savings.reduce((a, s) => a + s.saved, 0);
  const totalGoal = savings.reduce((a, s) => a + s.goal, 0);
  const pct = totalGoal ? Math.round(totalSaved / totalGoal * 100) : 0;

  return (
    <div className="max-w-[1200px] mx-auto border-x border-[#2f3336] min-h-full bg-black">
      
      {/* Header */}
      <div className="px-4 py-3 md:p-6 border-b border-[#2f3336] flex items-center justify-between bg-black/80 backdrop-blur-md z-30 sticky top-0">
        <div className="flex flex-col">
          <h2 className="text-[18px] md:text-[22px] font-black text-[#eff3f4]">
            Savings
          </h2>
          <p className="text-[11px] md:text-[14px] font-bold text-[#71767b]">
            {currentTime.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })} • {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </p>
        </div>
        <button onClick={onAddGoal} className="x-button-glass py-1.5 px-3 md:px-4 text-[12px] md:text-[14px] shrink-0">
          <Plus className="w-3.5 h-3.5" />
          <span className="ml-1.5 md:ml-2">Goal</span>
        </button>
      </div>

      {/* Summary View */}
      <div className="grid grid-cols-3 divide-x divide-[#2f3336] border-b border-[#2f3336] bg-white/[0.01]">
        <div className="p-3 md:p-4 text-center">
          <p className="text-[10px] md:text-[12px] font-bold text-[#71767b] uppercase tracking-wider text-[10px]">Saved</p>
          <p className="text-[18px] md:text-[24px] font-bold text-[#00ba7c] mt-1">${totalSaved.toLocaleString()}</p>
        </div>
        <div className="p-3 md:p-4 text-center">
          <p className="text-[10px] md:text-[12px] font-bold text-[#71767b] uppercase tracking-wider text-[10px]">Goal</p>
          <p className="text-[18px] md:text-[24px] font-bold text-[#eff3f4] mt-1">${totalGoal.toLocaleString()}</p>
        </div>
        <div className="p-3 md:p-4 text-center">
          <p className="text-[10px] md:text-[12px] font-bold text-[#71767b] uppercase tracking-wider text-[10px]">Progress</p>
          <p className="text-[18px] md:text-[24px] font-bold text-white mt-1">{pct}%</p>
        </div>
      </div>

      {/* Saving Goals List */}
      <div className="p-3 md:p-4 grid gap-3 md:gap-4">
        {savings.map(s => (
          <SavingItem key={s.id} s={s} onDelete={onDeleteGoal} onAddSaving={onAddSaving} />
        ))}
      </div>

      {savings.length === 0 && (
        <div className="p-10 text-center">
          <p className="text-[#71767b] text-base md:text-lg">No saving goals yet. Time to plan ahead!</p>
        </div>
      )}

      {/* Spacing for mobile nav */}
      <div className="h-24 md:h-20" />
    </div>
  );
};
