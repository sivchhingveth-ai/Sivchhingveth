/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Header } from './components/Header';
import { Tabs } from './components/Tabs';
import { Habits } from './components/Habits';
import { Savings } from './components/Savings';
import { Schedule } from './components/Schedule';
import { Modal } from './components/Modal';
import { ConfirmModal } from './components/ConfirmModal';
import { Plus } from 'lucide-react';
import { Habit, SavingGoal, Task, Routine, Transaction, BudgetStats, AppNotification } from './types';

export default function App() {
  const todayStr = new Date().toISOString().split('T')[0];
  const [activeTab, setActiveTab] = useState('Schedule');
  const tabs = ['Schedule', 'Manual habit', 'Savings'];

  // Modal state
  const [modalOpen, setModalOpen] = useState<string | null>(null);
  const [previousModal, setPreviousModal] = useState<string | null>(null);
  const [viewDate, setViewDate] = useState(new Date());

  // Form state
  const [newHabitName, setNewHabitName] = useState('');
  const [newHabitCategory, setNewHabitCategory] = useState('OTHER');
  const [newGoalName, setNewGoalName] = useState('');
  const [newGoalAmount, setNewGoalAmount] = useState('');
  const [newGoalStartDate, setNewGoalStartDate] = useState(todayStr);
  const [newGoalTargetDate, setNewGoalTargetDate] = useState(todayStr);
  const [newHabitTime, setNewHabitTime] = useState('');
  const [newHabitMonthlyTarget, setNewHabitMonthlyTarget] = useState('');
  const [newRoutineName, setNewRoutineName] = useState('');
  const [newRoutineTime, setNewRoutineTime] = useState('');
  const [newExpenseName, setNewExpenseName] = useState('');
  const [newExpenseAmount, setNewExpenseAmount] = useState('');

  // Confirmation state
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => { },
  });
  const [editingHabitId, setEditingHabitId] = useState<number | null>(null);

  const generateHistory = (days: number) => {
    const history: Record<string, boolean> = {};
    for (let i = 1; i <= days; i++) {
      const date = `2026-03-${i.toString().padStart(2, '0')}`;
      history[date] = true;
    }
    return history;
  };

  const [habits, setHabits] = useState<Habit[]>([
    // HEALTH
    { id: 1, name: "3L DRINKING WATER", category: "HEALTH", history: generateHistory(15), streak: 15 }, // 50% roughly
    { id: 2, name: "2X EATING LUNCH AND EVENING", category: "HEALTH", history: generateHistory(28), streak: 28 }, // ~90%
    { id: 3, name: "NO SUGARS", category: "HEALTH", history: {}, streak: 0 },
    { id: 4, name: "NO JUNK / SPICY FOOD", category: "HEALTH", history: {}, streak: 0 },

    // HYGIENE
    { id: 5, name: "SKINCARE MORNING / NIGHT", category: "HYGIENE", history: {}, streak: 0 },
    { id: 6, name: "3X SHOWER MORNING / AFTERNOON / EVENING", category: "HYGIENE", history: {}, streak: 0 },
    { id: 7, name: "PREPARE AND ORGANIZE BED", category: "HYGIENE", history: generateHistory(31), streak: 31, time: "05:10" }, // 100%
    { id: 8, name: "DRESS WELL", category: "HYGIENE", history: {}, streak: 0, time: "06:30" },
    { id: 9, name: "2X CLEAN FACE", category: "HYGIENE", history: {}, streak: 0 },

    // RECOVERY
    { id: 10, name: "SLEEP AT 12 AM", category: "RECOVERY", history: {}, streak: 0, time: "00:00" },
    { id: 11, name: "WAKE AT 5 AM", category: "RECOVERY", history: {}, streak: 0, time: "05:00" },
    { id: 12, name: "5 MINS STILLNESS", category: "RECOVERY", history: {}, streak: 0, time: "05:20" },
    { id: 13, name: "15 MINS POWER NAP", category: "RECOVERY", history: {}, streak: 0, time: "17:00" },
    { id: 14, name: "30 MINS NO PHONE", category: "RECOVERY", history: {}, streak: 0, time: "23:00" },

    // BODY
    { id: 15, name: "20 MINS MORNING RUNNING", category: "BODY", history: generateHistory(8), streak: 8, time: "05:30" }, // ~25%
    { id: 16, name: "10 MINS HEIGHT UNLOCK WORKOUT", category: "BODY", history: {}, streak: 0, time: "06:00" },
    { id: 17, name: "10 MINS ABS CIRCUIT", category: "BODY", history: {}, streak: 0, time: "06:15" },

    // FINANCE
    { id: 18, name: "NO GAMING", category: "FINANCE", history: {}, streak: 0 },
    { id: 19, name: "NO PORN / GOONING", category: "FINANCE", history: {}, streak: 0 },
    { id: 20, name: "NO BAD WORD TO SELF / BF", category: "FINANCE", history: {}, streak: 0 },
    { id: 21, name: "NO DELAY", category: "FINANCE", history: {}, streak: 0 },
    { id: 22, name: "NO DISTRACTION", category: "FINANCE", history: {}, streak: 0 },
    { id: 23, name: "SPEND LESS THAN 50000", category: "FINANCE", history: generateHistory(9), monthlyTarget: 10, streak: 9 },

    // LEARNING
    { id: 24, name: "20 PAGES READING", category: "LEARNING", history: {}, streak: 0, time: "22:00" },
    { id: 25, name: "4H LEARN TRADING (PM)", category: "LEARNING", history: {}, streak: 0, time: "13:00" },
    { id: 26, name: "1H MEMORIZE / REVIEW RESEARCH (AM)", category: "LEARNING", history: {}, streak: 0, time: "07:00" },
    { id: 27, name: "1H LEARN ABOUT AI (PM)", category: "LEARNING", history: {}, streak: 0, time: "17:30" },
  ]);

  const [savings, setSavings] = useState<SavingGoal[]>([
    { id: 1, name: "Emergency fund", goal: 500, saved: 310, color: "#34c759", startDate: "2026-03-01", targetDate: "2026-06-01", history: { "2026-03-01": 50, "2026-03-10": 100, "2026-03-15": 160 } },
    { id: 2, name: "Vacation", goal: 300, saved: 180, color: "#007aff", startDate: "2026-03-10", targetDate: "2026-08-15", history: { "2026-03-10": 100, "2026-03-12": 80 } },
    { id: 3, name: "New laptop", goal: 200, saved: 60, color: "#ff9500", startDate: "2026-03-15", targetDate: "2026-04-15", history: { "2026-03-15": 60 } },
  ]);

  const [tasks, setTasks] = useState<Task[]>([]);

  const [routines, setRoutines] = useState<Routine[]>([
    { id: 1, name: "Morning Ritual", time: "05:00 AM", icon: "🌅", color: "#f97316", done: false },
    { id: 2, name: "Afternoon Focus", time: "01:00 PM", icon: "🧠", color: "#ffd400", done: false },
    { id: 3, name: "Night Today", time: "10:00 PM", icon: "🌙", color: "#7856ff", done: false },
    { id: 4, name: "Midnight Calm", time: "12:00 AM", icon: "🌌", color: "#22c55e", done: false },
  ]);

  const [transactions, setTransactions] = useState<Transaction[]>([
    { id: 1, name: "Grocery Store", amount: 45.20, category: "Food", date: "Today", type: "expense", icon: "ShoppingCart", color: "#f91880" },
    { id: 2, name: "Coffee Shop", amount: 4.50, category: "Food", date: "Yesterday", type: "expense", icon: "Coffee", color: "#f91880" },
  ]);

  const [budgetStats, setBudgetStats] = useState<BudgetStats>({
    balance: 4250.00,
    budgetLeft: 1240.00,
    monthlyBudget: 3000.00,
  });

  const [notifications, setNotifications] = useState<AppNotification[]>([
    { id: 1, message: "Don't forget to review the project proposal before 10 AM", type: "reminder" },
  ]);

  // Toggle functions
  const toggleHabit = (id: number, dateStr: string = todayStr) => {
    setHabits(prev => prev.map(h => {
      if (h.id === id) {
        const newHistory = { ...h.history };
        newHistory[dateStr] = !newHistory[dateStr];
        return { ...h, history: newHistory };
      }
      return h;
    }));
  };

  const toggleTask = (id: number) => {
    toggleHabit(id);
  };

  const toggleRoutine = (id: number) => {
    setRoutines(prev => {
      const routine = prev.find(r => r.id === id);
      if (routine) {
        // Find matching habit by name
        const matchingHabit = habits.find(h => h.name.toLowerCase() === routine.name.toLowerCase());
        if (matchingHabit) {
          toggleHabit(matchingHabit.id);
        }
      }
      return prev.map(r => r.id === id ? { ...r, done: !r.done } : r);
    });
  };

  // Delete functions
  const deleteHabit = (id: number) => {
    setHabits(prev => prev.filter(h => h.id !== id));
  };

  const confirmDeleteHabit = (id: number) => {
    setConfirmModal({
      isOpen: true,
      title: 'Delete Habit',
      message: 'This will permanently delete this habit and all its history. This action cannot be undone.',
      onConfirm: () => deleteHabit(id)
    });
  };

  const deleteGoal = (id: number) => {
    setSavings(prev => prev.filter(s => s.id !== id));
  };

  const confirmDeleteGoal = (id: number) => {
    setConfirmModal({
      isOpen: true,
      title: 'Delete Goal',
      message: 'Are you sure you want to delete this saving goal?',
      onConfirm: () => deleteGoal(id)
    });
  };

  const deleteTask = (id: number) => {
    // Habits are deleted via onDeleteHabit prop in components
  };

  const deleteRoutine = (id: number) => {
    setRoutines(prev => prev.filter(r => r.id !== id));
  };

  const confirmDeleteRoutine = (id: number) => {
    setConfirmModal({
      isOpen: true,
      title: 'Delete Routine',
      message: 'Are you sure you want to delete this routine?',
      onConfirm: () => deleteRoutine(id)
    });
  };

  // Add functions
  const saveHabit = () => {
    if (newHabitName.trim()) {
      if (editingHabitId) {
        setHabits(prev => prev.map(h => h.id === editingHabitId ? {
          ...h,
          name: newHabitName,
          category: newHabitCategory,
          time: newHabitTime || undefined,
          monthlyTarget: newHabitMonthlyTarget ? parseInt(newHabitMonthlyTarget) : undefined
        } : h));
      } else {
        const newHabit: Habit = {
          id: Date.now(),
          name: newHabitName,
          category: newHabitCategory,
          history: {},
          streak: 0,
          time: newHabitTime || undefined,
          monthlyTarget: newHabitMonthlyTarget ? parseInt(newHabitMonthlyTarget) : undefined
        };
        setHabits([...habits, newHabit]);
      }
      setNewHabitName('');
      setNewHabitTime('');
      setNewHabitMonthlyTarget('');
      setEditingHabitId(null);
      setModalOpen(null);
    }
  };

  const addGoal = () => {
    if (!newGoalName.trim() || !newGoalAmount) return;
    const colors = ['#34c759', '#007aff', '#ff9500', '#ff3b30', '#af52de', '#5ac8fa'];
    const newId = Math.max(0, ...savings.map(s => s.id)) + 1;
    setSavings(prev => [...prev, {
      id: newId,
      name: newGoalName.trim(),
      goal: parseFloat(newGoalAmount),
      saved: 0,
      color: colors[newId % colors.length],
      startDate: newGoalStartDate,
      targetDate: newGoalTargetDate,
      history: {}
    }]);
    setNewGoalName('');
    setNewGoalAmount('');
    setNewGoalStartDate(todayStr);
    setNewGoalTargetDate(todayStr);
    setModalOpen(null);
  };

  const addDailySaving = (goalId: number, amount: number, date: string) => {
    setSavings(prev => prev.map(s => {
      if (s.id === goalId) {
        const newHistory = { ...s.history, [date]: (s.history[date] || 0) + amount };
        return {
          ...s,
          saved: s.saved + amount,
          history: newHistory
        };
      }
      return s;
    }));
  };


  const addRoutine = () => {
    if (!newRoutineName.trim() || !newRoutineTime) return;
    const colors = ['#ff9500', '#ff3b30', '#34c759', '#5856d6', '#007aff', '#ffcc00'];
    const newId = Math.max(0, ...routines.map(r => r.id)) + 1;
    setRoutines(prev => [...prev, { id: newId, name: newRoutineName.trim(), time: newRoutineTime, icon: "⭐", color: colors[newId % colors.length], done: false }]);
    setNewRoutineName('');
    setNewRoutineTime('');

    // Return to previous modal if any, otherwise close
    if (previousModal) {
      setModalOpen(previousModal);
      setPreviousModal(null);
    } else {
      setModalOpen(null);
    }
  };

  const addExpense = () => {
    if (!newExpenseName.trim() || !newExpenseAmount) return;
    const amount = parseFloat(newExpenseAmount);
    const newId = Math.max(0, ...transactions.map(t => t.id)) + 1;
    setTransactions(prev => [...prev, { id: newId, name: newExpenseName.trim(), amount, category: "Other", date: "Today", type: "expense", icon: "Receipt", color: "#FF3B30" }]);
    setBudgetStats(prev => ({ ...prev, balance: prev.balance - amount, budgetLeft: prev.budgetLeft - amount }));
    setNewExpenseName('');
    setNewExpenseAmount('');
    setModalOpen(null);
  };

  // Open modal helpers
  const openAddHabit = () => {
    setEditingHabitId(null);
    setNewHabitName('');
    setNewHabitTime('');
    setNewHabitMonthlyTarget('');
    setNewHabitCategory('OTHER');
    setModalOpen('habit');
  };
  const openEditHabit = (id: number) => {
    const habit = habits.find(h => h.id === id);
    if (habit) {
      setEditingHabitId(id);
      setNewHabitName(habit.name);
      setNewHabitTime(habit.time || '');
      setNewHabitMonthlyTarget(habit.monthlyTarget?.toString() || '');
      setNewHabitCategory(habit.category);
      setModalOpen('habit');
    }
  };
  const openAddGoal = () => { 
    setNewGoalStartDate(todayStr);
    setNewGoalTargetDate(todayStr);
    setModalOpen('goal'); 
  };
  const openAddTask = () => { setModalOpen('habit'); setActiveTab('Schedule'); };
  const openAddRoutine = () => {
    setPreviousModal(modalOpen);
    setModalOpen('routine');
  };
  const openAddExpense = () => { setModalOpen('expense'); setActiveTab('Savings'); };

  const inputClass = "w-full bg-transparent border border-[#2f3336] px-4 py-3 rounded-lg text-lg text-[#eff3f4] placeholder-[#71767b] outline-none focus:border-[#1d9bf0] transition-colors";
  const labelClass = "text-[14px] font-bold text-[#eff3f4] mb-1.5 block";
  const submitClass = "x-button-primary w-full py-3 text-[17px]";

  return (
    <div className="h-[100dvh] flex flex-col bg-black text-white font-sans antialiased overflow-hidden relative">
      {/* Premium Background Ambiance */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-[#1d9bf0]/10 rounded-full blur-[120px] pointer-events-none animate-pulse" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-[#7856ff]/10 rounded-full blur-[120px] pointer-events-none animate-pulse" style={{ animationDelay: '1s' }} />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[30%] h-[30%] bg-[#22c55e]/5 rounded-full blur-[100px] pointer-events-none" />

      <Tabs tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />

      <main className="flex-1 overflow-y-auto relative z-10 overscroll-contain">
        <div className="w-full">

          {activeTab === 'Manual habit' && (
            <Habits
              habits={habits}
              onToggleHabit={toggleHabit}
              onDeleteHabit={confirmDeleteHabit}
              onAddHabit={openAddHabit}
              onEditHabit={openEditHabit}
              currentMonth={viewDate}
              onMonthChange={setViewDate}
            />
          )}
          {activeTab === 'Savings' && <Savings savings={savings} onDeleteGoal={confirmDeleteGoal} onAddGoal={openAddGoal} onAddSaving={addDailySaving} />}
          {activeTab === 'Schedule' && (
            <div className="flex flex-col">
              <Schedule
                habits={habits}
                onToggleHabit={toggleHabit}
                onDeleteHabit={confirmDeleteHabit}
                onAddTask={openAddHabit}
              />
            </div>
          )}

        </div>
      </main>

      {/* Add Habit Modal */}
      <Modal isOpen={modalOpen === 'habit'} onClose={() => { setModalOpen(null); setEditingHabitId(null); }} title={editingHabitId ? "Edit Habit" : "New Habit"}>
        <div className="pb-6 space-y-4">
          <div>
            <label className={labelClass}>Habit name</label>
            <input className={inputClass} placeholder="e.g. Drink 8 glasses of water" value={newHabitName} onChange={e => setNewHabitName(e.target.value)} autoFocus autoComplete="off" autoCorrect="off" spellCheck={false} />
          </div>
          <div className="flex flex-col md:grid md:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Time (Optional)</label>
              <input className={inputClass} type="time" value={newHabitTime} onChange={e => setNewHabitTime(e.target.value)} style={{ colorScheme: 'dark' }} />
            </div>
            <div>
              <label className={labelClass}>Monthly Target</label>
              <input className={inputClass} type="number" inputMode="numeric" pattern="[0-9]*" placeholder="e.g. 10" value={newHabitMonthlyTarget} onChange={e => setNewHabitMonthlyTarget(e.target.value)} />
            </div>
          </div>
          <div>
            <label className={labelClass}>Category</label>
            <div className="flex flex-wrap gap-2">
              {['HEALTH', 'HYGIENE', 'RECOVERY', 'BODY', 'FINANCE', 'LEARNING', 'OTHER'].map(cat => (
                <button
                  key={cat}
                  onClick={() => setNewHabitCategory(cat)}
                  className={`px-4 py-2 rounded-xl text-[12px] font-bold transition-all border ${newHabitCategory === cat
                    ? 'bg-white border-white text-black'
                    : 'bg-white/[0.05] border-white/10 text-[#71767b] hover:bg-white/[0.1] hover:text-[#eff3f4]'
                    }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
          <button onClick={saveHabit} className={submitClass}>{editingHabitId ? "Update Habit" : "Add Habit"}</button>

          {/* Extra Routines Section - Moved inside modal */}
          <div className="mt-4 pt-4 border-t border-[#2f3336] space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-[18px] font-bold text-[#eff3f4]">
                Time Range
              </h3>
              <button
                onClick={(e) => { e.preventDefault(); openAddRoutine(); }}
                className="x-button-glass py-1.5 text-[14px]"
              >
                <Plus className="w-4 h-4" /> Add Routine
              </button>
            </div>

            <div className="divide-y divide-[#2f3336]">
              {routines.map(routine => {
                const getPhase = (timeStr: string) => {
                  const [timePart, modifier] = timeStr.trim().split(' ');
                  let [hours] = timePart.split(':').map(Number);
                  if (modifier === 'PM' && hours < 12) hours += 12;
                  if (modifier === 'AM' && hours === 12) hours = 0;
                  if (hours >= 0 && hours < 5) return { name: 'Midnight', color: '#22c55e' };
                  if (hours >= 5 && hours < 12) return { name: 'Morning', color: '#f97316' };
                  if (hours >= 12 && hours < 18) return { name: 'Afternoon', color: '#ffd400' };
                  return { name: 'Night', color: '#7856ff' };
                };
                const phase = getPhase(routine.time);

                return (
                  <div key={routine.id} className="py-3 flex items-center justify-between group">
                    <div className="flex items-center gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-[15px] font-bold text-[#eff3f4]">{routine.name}</p>
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider" style={{ backgroundColor: `${phase.color}20`, color: phase.color, border: `1px solid ${phase.color}40` }}>
                            {phase.name}
                          </span>
                        </div>
                        <p className="text-[12px] text-[#71767b]">{routine.time}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => { e.preventDefault(); deleteRoutine(routine.id); }}
                        className="p-1.5 text-[#71767b] hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                      >
                        <span className="text-[14px]">Delete</span>
                      </button>
                    </div>
                  </div>
                );
              })}
              {routines.length === 0 && (
                <p className="text-center py-4 text-[#71767b] text-sm">No extra routines yet.</p>
              )}
            </div>
          </div>
        </div>
      </Modal>

      {/* Add Goal Modal */}
      <Modal isOpen={modalOpen === 'goal'} onClose={() => setModalOpen(null)} title="New Saving Goal">
        <div className="space-y-4">
          <div>
            <label className={labelClass}>Goal name</label>
            <input className={inputClass} placeholder="e.g. New Phone" value={newGoalName} onChange={e => setNewGoalName(e.target.value)} autoFocus autoComplete="off" autoCorrect="off" spellCheck={false} />
          </div>
          <div>
            <label className={labelClass}>Target amount ($)</label>
            <input className={inputClass} type="number" placeholder="500" value={newGoalAmount} onChange={e => setNewGoalAmount(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Start Date</label>
              <input className={inputClass} type="date" value={newGoalStartDate} onChange={e => setNewGoalStartDate(e.target.value)} style={{ colorScheme: 'dark' }} />
            </div>
            <div>
              <label className={labelClass}>Target Date</label>
              <input className={inputClass} type="date" value={newGoalTargetDate} onChange={e => setNewGoalTargetDate(e.target.value)} style={{ colorScheme: 'dark' }} />
            </div>
          </div>
          <button onClick={addGoal} className={submitClass}>Add Goal</button>
        </div>
      </Modal>


      {/* Add Routine Modal */}
      <Modal
        isOpen={modalOpen === 'routine'}
        onClose={() => {
          if (previousModal) {
            setModalOpen(previousModal);
            setPreviousModal(null);
          } else {
            setModalOpen(null);
          }
        }}
        title="New Routine"
      >
        <div className="space-y-4">
          <div>
            <label className={labelClass}>Routine name</label>
            <input className={inputClass} placeholder="e.g. Morning yoga" value={newRoutineName} onChange={e => setNewRoutineName(e.target.value)} autoFocus autoComplete="off" autoCorrect="off" spellCheck={false} />
          </div>
          <div>
            <label className={labelClass}>Time</label>
            <input className={inputClass} placeholder="e.g. 07:00 AM" value={newRoutineTime} onChange={e => setNewRoutineTime(e.target.value)} />
          </div>
          <button onClick={addRoutine} className={submitClass}>Add Routine</button>
        </div>
      </Modal>

      {/* Add Expense Modal */}
      <Modal isOpen={modalOpen === 'expense'} onClose={() => setModalOpen(null)} title="New Expense">
        <div className="space-y-4">
          <div>
            <label className={labelClass}>Expense name</label>
            <input className={inputClass} placeholder="e.g. Uber ride" value={newExpenseName} onChange={e => setNewExpenseName(e.target.value)} autoFocus autoComplete="off" autoCorrect="off" spellCheck={false} />
          </div>
          <div>
            <label className={labelClass}>Amount ($)</label>
            <input className={inputClass} type="number" step="0.01" placeholder="25.00" value={newExpenseAmount} onChange={e => setNewExpenseAmount(e.target.value)} />
          </div>
          <button onClick={addExpense} className={submitClass}>Add Expense</button>
        </div>
      </Modal>

      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
        onConfirm={confirmModal.onConfirm}
        title={confirmModal.title}
        message={confirmModal.message}
      />
    </div>
  );
}
