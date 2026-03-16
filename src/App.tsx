/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { Tabs } from './components/Tabs';
import { Habits } from './components/Habits';
import { Savings } from './components/Savings';
import { Schedule } from './components/Schedule';
import { Modal } from './components/Modal';
import { ConfirmModal } from './components/ConfirmModal';
import { Auth } from './components/Auth';
import { supabase, isSupabaseConfigured } from './lib/supabase';
import { Plus, LogOut, Loader2, ShieldAlert } from 'lucide-react';
import { Habit, SavingGoal, Task, Routine, Transaction, BudgetStats, AppNotification } from './types';

export default function App() {
  const todayStr = new Date().toISOString().split('T')[0];
  const [activeTab, setActiveTab] = useState('Schedule');
  const [session, setSession] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadingTimeout, setLoadingTimeout] = useState(false);
  const tabs = ['Schedule', 'Manual habit', 'Savings'];

  // Modal state
  const [modalOpen, setModalOpen] = useState<string | null>(null);
  const [previousModal, setPreviousModal] = useState<string | null>(null);
  const [viewDate, setViewDate] = useState(new Date());

  // Auth & Session management
  useEffect(() => {
    const checkSession = async () => {
      // Safety timeout
      const timer = setTimeout(() => {
        if (isLoading) setLoadingTimeout(true);
      }, 8000);

      try {
        const { data: { session } } = await supabase.auth.getSession();
        setSession(session);
        setIsLoading(false);
        clearTimeout(timer);
      } catch (err) {
        console.error('Session check failed:', err);
        setIsLoading(false);
        clearTimeout(timer);
      }
    };

    checkSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

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
  const [editingHabitId, setEditingHabitId] = useState<any | null>(null);

  const [habits, setHabits] = useState<Habit[]>([]);
  const [savings, setSavings] = useState<SavingGoal[]>([]);

  // Fetch data from Supabase
  useEffect(() => {
    if (session?.user) {
      fetchData();
    }
  }, [session]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const { data: habitsData, error: habitsError } = await supabase
        .from('habits')
        .select('*')
        .order('created_at', { ascending: true });

      if (habitsData) setHabits(habitsData.map(h => ({
         ...h,
         history: h.history || {},
         id: h.id, // Using supabase UUIDs
         monthlyTarget: h.monthly_target // Map snake_case to camelCase
      })) as any);

      const { data: savingsData, error: savingsError } = await supabase
        .from('saving_goals')
        .select('*')
        .order('created_at', { ascending: true });

      if (savingsData) setSavings(savingsData.map(s => ({
        ...s,
        history: s.history || {},
        id: s.id,
        startDate: s.start_date,
        targetDate: s.target_date
      })) as any);

    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setIsLoading(false);
    }
  };

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
  const toggleHabit = React.useCallback(async (id: any, dateStr: string = todayStr) => {
    let updatedHistory: any = {};
    setHabits(prev => prev.map(h => {
      if (h.id === id) {
        updatedHistory = { ...h.history };
        updatedHistory[dateStr] = !updatedHistory[dateStr];
        return { ...h, history: updatedHistory };
      }
      return h;
    }));

    if (session?.user) {
      await supabase
        .from('habits')
        .update({ history: updatedHistory })
        .eq('id', id);
    }
  }, [session?.user, todayStr]);

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
  const deleteHabit = async (id: any) => {
    setHabits(prev => prev.filter(h => h.id !== id));
    if (session?.user) {
      await supabase.from('habits').delete().eq('id', id);
    }
  };

  const confirmDeleteHabit = (id: any) => {
    setConfirmModal({
      isOpen: true,
      title: 'Delete Habit',
      message: 'This will permanently delete this habit and all its history. This action cannot be undone.',
      onConfirm: () => deleteHabit(id)
    });
  };

  const deleteGoal = async (id: any) => {
    setSavings(prev => prev.filter(s => s.id !== id));
    if (session?.user) {
      await supabase.from('saving_goals').delete().eq('id', id);
    }
  };

  const confirmDeleteGoal = (id: any) => {
    setConfirmModal({
      isOpen: true,
      title: 'Delete Goal',
      message: 'Are you sure you want to delete this saving goal?',
      onConfirm: () => deleteGoal(id)
    });
  };

  const deleteTask = (id: any) => {
    // Habits are deleted via onDeleteHabit prop in components
  };

  const deleteRoutine = (id: any) => {
    setRoutines(prev => prev.filter(r => r.id !== id));
  };

  const confirmDeleteRoutine = (id: any) => {
    setConfirmModal({
      isOpen: true,
      title: 'Delete Routine',
      message: 'Are you sure you want to delete this routine?',
      onConfirm: () => deleteRoutine(id)
    });
  };

  // Add functions
  const saveHabit = async () => {
    if (newHabitName.trim() && session?.user) {
      if (editingHabitId) {
        const updatedHabit = {
          name: newHabitName,
          category: newHabitCategory,
          time: newHabitTime || null,
          monthly_target: newHabitMonthlyTarget ? parseInt(newHabitMonthlyTarget) : null
        };

        const { error } = await supabase
          .from('habits')
          .update(updatedHabit)
          .eq('id', editingHabitId);

        if (!error) fetchData();
      } else {
        const newHabit = {
          user_id: session.user.id,
          name: newHabitName,
          category: newHabitCategory,
          history: {},
          streak: 0,
          time: newHabitTime || null,
          monthly_target: newHabitMonthlyTarget ? parseInt(newHabitMonthlyTarget) : null
        };

        const { error } = await supabase.from('habits').insert([newHabit]);
        if (!error) fetchData();
      }
      setNewHabitName('');
      setNewHabitTime('');
      setNewHabitMonthlyTarget('');
      setEditingHabitId(null);
      setModalOpen(null);
    }
  };

  const addGoal = async () => {
    if (!newGoalName.trim() || !newGoalAmount || !session?.user) return;
    const colors = ['#34c759', '#007aff', '#ff9500', '#ff3b30', '#af52de', '#5ac8fa'];
    
    const newGoal = {
      user_id: session.user.id,
      name: newGoalName.trim(),
      goal: parseFloat(newGoalAmount),
      saved: 0,
      color: colors[savings.length % colors.length],
      start_date: newGoalStartDate,
      target_date: newGoalTargetDate,
      history: {}
    };

    const { error } = await supabase.from('saving_goals').insert([newGoal]);
    if (!error) fetchData();

    setNewGoalName('');
    setNewGoalAmount('');
    setNewGoalStartDate(todayStr);
    setNewGoalTargetDate(todayStr);
    setModalOpen(null);
  };

  const addDailySaving = async (goalId: any, amount: number, date: string) => {
    const goal = savings.find(s => s.id === goalId);
    if (!goal) return;

    const newHistory = { ...goal.history, [date]: (goal.history[date] || 0) + amount };
    const newSaved = goal.saved + (amount || 0);

    setSavings(prev => prev.map(s => s.id === goalId ? { ...s, saved: newSaved, history: newHistory } : s));

    if (session?.user) {
      await supabase
        .from('saving_goals')
        .update({ saved: newSaved, history: newHistory })
        .eq('id', goalId);
    }
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
  const openEditHabit = (id: any) => {
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

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  if (!isSupabaseConfigured) {
    return (
      <div className="h-[100dvh] bg-black flex flex-col items-center justify-center p-8 text-center gap-8 relative overflow-hidden">
        {/* Glow effect */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-red-500/10 rounded-full blur-[80px] pointer-events-none" />
        
        <div className="w-20 h-20 bg-red-500/10 rounded-[2rem] flex items-center justify-center border border-red-500/20 relative z-10">
          <ShieldAlert className="w-10 h-10 text-red-500" />
        </div>
        
        <div className="space-y-4 relative z-10">
          <h1 className="text-2xl md:text-3xl font-black text-[#eff3f4] uppercase tracking-tight">Configuration Link Needed</h1>
          <p className="text-[#71767b] max-w-md font-bold text-sm md:text-base leading-relaxed">
            Your secure database is ready on Supabase, but your app hasn't been linked to it yet. 
            <br/><br/>
            Please add <code className="text-[#eff3f4] bg-white/5 px-1.5 py-0.5 rounded">VITE_SUPABASE_URL</code> and <code className="text-[#eff3f4] bg-white/5 px-1.5 py-0.5 rounded">VITE_SUPABASE_ANON_KEY</code> to your environment variables.
          </p>
        </div>

        <div className="flex flex-col gap-3 w-full max-w-xs relative z-10">
           <a 
             href="https://vercel.com/dashboard" 
             target="_blank" 
             rel="noopener noreferrer"
             className="x-button-primary py-4 rounded-2xl flex items-center justify-center gap-2"
           >
             <span>Go to Vercel Dashboard</span>
           </a>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="h-[100dvh] bg-black flex flex-col items-center justify-center gap-6 relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-[#1d9bf0]/10 rounded-full blur-[80px] pointer-events-none" />
        <div className="relative">
          <Loader2 className="w-12 h-12 text-[#1d9bf0] animate-spin" />
          <div className="absolute inset-0 blur-xl bg-[#1d9bf0]/20 animate-pulse" />
        </div>
        <div className="text-center space-y-3 relative z-10 px-6">
          <div className="space-y-1">
            <p className="text-[#71767b] font-black animate-pulse uppercase tracking-[0.2em] text-[10px]">Establishing Secure Link</p>
            <p className="text-[#eff3f4] font-bold text-sm">Loading your habits...</p>
          </div>
          
          {loadingTimeout && (
            <div className="pt-4 animate-in fade-in slide-in-from-bottom-2 duration-700">
              <p className="text-red-400 text-xs font-bold mb-3 max-w-[200px] mx-auto">
                Connection is slow. Check your internet or ad-blocker.
              </p>
              <button 
                onClick={() => window.location.reload()}
                className="bg-white/10 hover:bg-white/20 text-[#eff3f4] px-4 py-2 rounded-full text-xs font-bold border border-white/10 transition-all"
              >
                Retry Connection
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (!session) {
    return <Auth />;
  }

  const inputClass = "w-full bg-transparent border border-[#2f3336] px-4 py-3 rounded-lg text-lg text-[#eff3f4] placeholder-[#71767b] outline-none focus:border-[#1d9bf0] transition-colors";
  const labelClass = "text-[14px] font-bold text-[#eff3f4] mb-1.5 block";
  const submitClass = "x-button-primary w-full py-3 text-[17px]";

  return (
    <div className="h-[100dvh] flex flex-col bg-black text-white font-sans antialiased overflow-hidden relative">
      {/* Logout Button */}
      <div className="absolute top-4 right-4 z-[100]">
        <button 
          onClick={handleLogout}
          className="p-2.5 bg-white/5 border border-white/10 rounded-xl text-[#71767b] hover:text-red-500 hover:bg-red-500/10 transition-all group"
          title="Sign Out"
        >
          <LogOut className="w-5 h-5" />
        </button>
      </div>
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
              <label className={labelClass}>Time Phase (Optional)</label>
              <div className="flex flex-wrap gap-2 mt-1">
                {[
                  { name: 'Morning', time: '08:00' },
                  { name: 'Afternoon', time: '14:00' },
                  { name: 'Night', time: '20:00' },
                  { name: 'Midnight', time: '02:00' }
                ].map(phase => (
                  <button
                    key={phase.name}
                    onClick={(e) => { e.preventDefault(); setNewHabitTime(phase.time); }}
                    className={`px-3 py-1.5 rounded-xl text-[12px] font-bold transition-all border ${newHabitTime === phase.time
                      ? 'bg-white border-white text-black'
                      : 'bg-white/[0.05] border-white/10 text-[#71767b] hover:bg-white/[0.1] hover:text-[#eff3f4]'
                      }`}
                  >
                    {phase.name}
                  </button>
                ))}
              </div>
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
