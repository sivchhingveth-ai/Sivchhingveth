import React from 'react';
import { Habit, SavingGoal, Task, Routine, Transaction, BudgetStats, AppNotification } from '../types';
import { CheckCircle2, Circle, TrendingUp, Calendar, Wallet, ShoppingCart, Coffee, Car, Plus, Bell, Clock, ChevronRight, Edit2 } from 'lucide-react';
import { getCategoryStyles } from '../utils/colors';

interface OverviewProps {
  habits: Habit[];
  onToggleHabit: (id: number) => void;
  tasks: Task[];
  routines: Routine[];
  savings: SavingGoal[];
  transactions: Transaction[];
  budgetStats: BudgetStats;
  notifications: AppNotification[];
  setActiveTab: (tab: string) => void;
  onAddHabit: () => void;
  onEditHabit: (id: number) => void;
  onAddTask: () => void;
  onAddExpense: () => void;
}

export function Overview({
  habits,
  onToggleHabit,
  tasks,
  routines,
  savings,
  transactions,
  budgetStats,
  notifications,
  setActiveTab,
  onAddHabit,
  onEditHabit,
  onAddTask,
  onAddExpense
}: OverviewProps) {

  const todayStr = new Date().toISOString().split('T')[0];
  const today = new Date();
  const currentDay = today.getDate();
  const currentMonthDays = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();

  const filteredHabits = habits.filter(h => {
    if (h.history[todayStr]) return true;
    if (!h.monthlyTarget) return true;
    
    const offset = h.id % currentMonthDays;
    return ((currentDay - 1 + offset) * h.monthlyTarget) % currentMonthDays < h.monthlyTarget;
  });

  const completedHabits = habits.filter(h => h.history[todayStr]).length;
  
  const upcomingEvents = [...tasks, ...routines.map(r => ({ ...r, tag: 'routine' as const }))]
    .filter(item => !item.done)
    .sort((a, b) => a.time.localeCompare(b.time))
    .slice(0, 5);

  return (
    <div className="max-w-[600px] mx-auto border-x border-[#2f3336] min-h-screen bg-black">
      
      {/* Quick Actions Listing */}
      <div className="p-6 border-b border-[#2f3336]">
        <h2 className="text-[20px] font-black text-[#eff3f4] mb-4">Quick Actions</h2>
        <div className="flex flex-wrap gap-3">
          <button onClick={onAddHabit} className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-white/[0.03] border border-[#2f3336] text-[#eff3f4] font-bold hover:bg-white/[0.06] transition-colors group">
            <Plus className="w-4 h-4 text-[#1d9bf0]" />
            <span>Habit</span>
          </button>
          <button onClick={onAddTask} className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-white/[0.03] border border-[#2f3336] text-[#eff3f4] font-bold hover:bg-white/[0.06] transition-colors group">
            <Clock className="w-4 h-4 text-[#1d9bf0]" />
            <span>Task</span>
          </button>
          <button onClick={onAddExpense} className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-white/[0.03] border border-[#2f3336] text-[#eff3f4] font-bold hover:bg-white/[0.06] transition-colors group">
            <Wallet className="w-4 h-4 text-[#1d9bf0]" />
            <span>Expense</span>
          </button>
        </div>
      </div>

      {/* Announcements / Notifications Listing */}
      {notifications.length > 0 && (
        <div className="border-b border-[#2f3336]">
          {notifications.map(note => (
            <div key={note.id} className="p-4 flex items-start gap-4 hover:bg-white/[0.02] transition-colors">
              <div className="w-8 h-8 rounded-full bg-amber-500/10 flex items-center justify-center shrink-0">
                <Bell className="w-4 h-4 text-amber-500" />
              </div>
              <div className="flex-1">
                <p className="text-[#eff3f4] font-bold text-[15px]">Notification</p>
                <p className="text-[#71767b] text-[14px] mt-0.5">{note.message}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Habits Progress Section */}
      <div className="p-6 border-b border-[#2f3336] hover:bg-white/[0.01] transition-colors group cursor-pointer" onClick={() => setActiveTab('Habits')}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-[20px] font-black text-[#eff3f4]">Daily Habits</h2>
          <div className="flex items-center gap-2 text-[#71767b] group-hover:text-[#1d9bf0] transition-colors">
            <span className="text-[14px] font-bold">{completedHabits}/{habits.length} Completed</span>
            <ChevronRight className="w-4 h-4" />
          </div>
        </div>
        
        <div className="space-y-2">
          {filteredHabits.slice(0, 4).map(habit => (
            <div 
              key={habit.id} 
              className="flex items-center justify-between p-4 rounded-xl border border-[#2f3336] bg-white/[0.02] transition-all"
            >
              <div className="flex items-center gap-3">
                {habit.history[todayStr] ? <CheckCircle2 className="w-5 h-5 text-[#00ba7c]" /> : <Circle className="w-5 h-5 text-[#71767b]" />}
                <span className={`font-bold ${habit.history[todayStr] ? 'text-[#71767b] line-through font-medium' : 'text-[#eff3f4]'}`}>{habit.name}</span>
              </div>
              <div className="flex items-center gap-3">
                <div onClick={(e) => { e.stopPropagation(); onEditHabit(habit.id); }} className="p-1 hover:text-x-blue transition-colors cursor-pointer opacity-40 hover:opacity-100">
                  <Edit2 className="w-3.5 h-3.5" />
                </div>
                <span className="text-[13px] font-bold text-[#71767b]">{habit.streak}d streak</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Upcoming Tasks Section */}
      <div className="p-6 border-b border-[#2f3336] hover:bg-white/[0.01] transition-colors group cursor-pointer" onClick={() => setActiveTab('Schedule')}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-[20px] font-black text-[#eff3f4]">Upcoming</h2>
          <div className="flex items-center gap-2 text-[#71767b] group-hover:text-[#1d9bf0] transition-colors">
            <span className="text-[14px] font-bold">View Schedule</span>
            <ChevronRight className="w-4 h-4" />
          </div>
        </div>
        
        <div className="space-y-4">
          {upcomingEvents.map(event => (
            <div key={event.id} className="flex items-start gap-4">
              <div className="text-[#71767b] font-bold text-[13px] w-12 pt-0.5">{event.time}</div>
              <div className="flex-1">
                <p className="text-[#eff3f4] font-bold">{event.name}</p>
                <div className="flex items-center gap-1.5 mt-1">
                  <div className={`w-2 h-2 rounded-full ${getCategoryStyles('tag' in event ? event.tag : 'routine').hex}`} style={{ backgroundColor: getCategoryStyles('tag' in event ? event.tag : 'routine').hex }} />
                  <span className={`text-[12px] font-bold uppercase tracking-wider ${getCategoryStyles('tag' in event ? event.tag : 'routine').text}`}>{'tag' in event ? event.tag : 'routine'}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Financial Health Section */}
      <div className="p-6 hover:bg-white/[0.01] transition-colors group cursor-pointer" onClick={() => setActiveTab('Savings')}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-[20px] font-black text-[#eff3f4]">Finances</h2>
          <div className="flex items-center gap-2 text-[#71767b] group-hover:text-[#1d9bf0] transition-colors">
            <span className="text-[14px] font-bold">Manage Wallet</span>
            <ChevronRight className="w-4 h-4" />
          </div>
        </div>
        
        <div className="bg-white/[0.03] rounded-2xl p-5 border border-[#2f3336]">
          <p className="text-[#71767b] text-[14px] font-bold uppercase tracking-tight">Total Balance</p>
          <p className="text-4xl font-black text-[#eff3f4] mt-1 mb-6">${budgetStats.balance.toLocaleString()}</p>
          
          <div className="space-y-3">
            <div className="flex justify-between items-end">
              <span className="text-[#71767b] text-[14px] font-bold">Monthly Budget</span>
              <span className="text-[#eff3f4] font-bold">${budgetStats.budgetLeft} / ${budgetStats.monthlyBudget}</span>
            </div>
            <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden">
              <div 
                className="bg-[#00ba7c] h-full transition-all duration-1000" 
                style={{ width: `${(budgetStats.budgetLeft/budgetStats.monthlyBudget)*100}%` }} 
              />
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
