/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useQuery, useMutation } from "convex/react";
import { useConvexAuth } from "convex/react";
import { useAuthActions } from "@convex-dev/auth/react";
import { api } from "../convex/_generated/api";
import { Id } from "../convex/_generated/dataModel";
import { Header } from './components/Header';
import { Tabs } from './components/Tabs';
import { Habits } from './components/Habits';
import { Savings } from './components/Savings';
import { DailyHabits } from './components/DailyHabits';


import { Analytics } from './components/Analytics';
import { Modal } from './components/Modal';
import { ConfirmModal } from './components/ConfirmModal';
import { Auth } from './components/Auth';
import { Plus, Loader2, ShieldAlert } from 'lucide-react';
import { Habit, SavingGoal } from './types';
import { getEffectiveDateStr, getEffectiveDate } from './utils/dateUtils';

export default function App() {
  const todayStr = getEffectiveDateStr();
  const [activeTab, setActiveTab] = useState('Daily Habits');
  const { isAuthenticated, isLoading } = useConvexAuth();
  const { signOut } = useAuthActions();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [loadingTimeout, setLoadingTimeout] = useState(false);
  const tabs = ['Daily Habits', 'Manual habit', 'Savings', 'Analytics'];

  // Modal state
  const [modalOpen, setModalOpen] = useState<string | null>(null);
  const [viewDate, setViewDate] = useState(getEffectiveDate());

  // Loading timeout
  useEffect(() => {
    if (isLoading) {
      const timer = setTimeout(() => {
        setLoadingTimeout(true);
      }, 8000);
      return () => clearTimeout(timer);
    } else {
      setLoadingTimeout(false);
    }
  }, [isLoading]);

  // Form state
  const [newHabitName, setNewHabitName] = useState('');
  const [newHabitCategory, setNewHabitCategory] = useState('OTHER');
  const [newGoalName, setNewGoalName] = useState('');
  const [newGoalAmount, setNewGoalAmount] = useState('');
  const [newGoalStartDate, setNewGoalStartDate] = useState(todayStr);
  const [newGoalTargetDate, setNewGoalTargetDate] = useState(todayStr);
  const [newHabitTime, setNewHabitTime] = useState('');
  const [newHabitMonthlyTarget, setNewHabitMonthlyTarget] = useState('');


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
  const [editingHabitId, setEditingHabitId] = useState<Id<"habits"> | null>(null);

  // Convex queries — only run when authenticated
  const rawHabits = useQuery(api.habits.list, isAuthenticated ? {} : "skip");
  const rawSavings = useQuery(api.savingGoals.list, isAuthenticated ? {} : "skip");

  // Convex mutations
  const createHabit = useMutation(api.habits.create);
  const updateHabit = useMutation(api.habits.update);
  const removeHabit = useMutation(api.habits.remove);
  const createGoal = useMutation(api.savingGoals.create);
  const updateGoal = useMutation(api.savingGoals.update);
  const removeGoal = useMutation(api.savingGoals.remove);

  // Map Convex data to app types
  const habits: Habit[] = (rawHabits || []).map(h => ({
    id: h._id,
    name: h.name,
    category: h.category,
    history: h.history || {},
    streak: h.streak,
    time: h.time ?? undefined,
    monthlyTarget: h.monthlyTarget ?? undefined,
  }));

  const savings: SavingGoal[] = (rawSavings || []).map(s => ({
    id: s._id,
    name: s.name,
    goal: s.goal,
    saved: s.saved,
    color: s.color,
    startDate: s.startDate,
    targetDate: s.targetDate,
    history: s.history || {},
  }));



  // Toggle functions
  const toggleHabit = React.useCallback(async (id: any, dateStr: string = todayStr) => {
    if (!isAuthenticated) return;
    
    // Use the latest habits from the query result directly in the callback
    // or trigger the mutation which handles logic on the server side
    const habit = (rawHabits || []).find(h => h._id === id);
    if (!habit) return;

    const updatedHistory = { ...habit.history };
    updatedHistory[dateStr] = !updatedHistory[dateStr];

    await updateHabit({
      id: id as Id<"habits">,
      history: updatedHistory,
    });
  }, [isAuthenticated, rawHabits, todayStr, updateHabit]);



  // Delete functions
  const deleteHabit = async (id: any) => {
    if (!isAuthenticated) return;
    await removeHabit({ id: id as Id<"habits"> });
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
    if (!isAuthenticated) return;
    await removeGoal({ id: id as Id<"savingGoals"> });
  };

  const confirmDeleteGoal = (id: any) => {
    setConfirmModal({
      isOpen: true,
      title: 'Delete Goal',
      message: 'Are you sure you want to delete this saving goal?',
      onConfirm: () => deleteGoal(id)
    });
  };



  // Add functions
  const saveHabit = async () => {
    const trimmedName = newHabitName.trim();
    if (trimmedName && isAuthenticated) {
      // Prevent duplicate habit names
      const isDuplicate = habits.some(
        h => h.name.toLowerCase() === trimmedName.toLowerCase() && h.id !== editingHabitId
      );
      
      if (isDuplicate) {
        alert('A habit with this exact name already exists. Please choose a different name.');
        return;
      }

      if (editingHabitId) {
        await updateHabit({
          id: editingHabitId,
          name: trimmedName,
          category: newHabitCategory,
          time: newHabitTime || null,
          monthlyTarget: newHabitMonthlyTarget ? parseInt(newHabitMonthlyTarget) : null
        });
      } else {
        await createHabit({
          name: trimmedName,
          category: newHabitCategory,
          time: newHabitTime || null,
          monthlyTarget: newHabitMonthlyTarget ? parseInt(newHabitMonthlyTarget) : null
        });
      }
      setNewHabitName('');
      setNewHabitTime('');
      setNewHabitMonthlyTarget('');
      setEditingHabitId(null);
      setModalOpen(null);
    }
  };

  const addGoal = async () => {
    if (!newGoalName.trim() || !newGoalAmount || !isAuthenticated) return;
    const colors = ['#34c759', '#007aff', '#ff9500', '#ff3b30', '#af52de', '#5ac8fa'];
    
    await createGoal({
      name: newGoalName.trim(),
      goal: parseFloat(newGoalAmount),
      color: colors[savings.length % colors.length],
      startDate: newGoalStartDate,
      targetDate: newGoalTargetDate,
    });

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

    await updateGoal({
      id: goalId as Id<"savingGoals">,
      saved: newSaved,
      history: newHistory,
    });
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

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await signOut();
    } catch (err) {
      console.error('Logout failed:', err);
    } finally {
      setIsLoggingOut(false);
    }
  };

  const loadDemoData = async () => {
    if (!isAuthenticated) return;

    // ── Demo Habits ──
    const demoHabits = [
      { name: 'Drink 8 glasses of water', category: 'HEALTH', time: '08:00', chance: 0.85 },
      { name: 'Morning stretching', category: 'BODY', time: '08:00', chance: 0.7 },
      { name: 'Read for 30 minutes', category: 'LEARNING', time: '14:00', chance: 0.6 },
      { name: 'Take vitamins', category: 'HEALTH', time: '08:00', chance: 0.9 },
      { name: 'Evening workout', category: 'BODY', time: '20:00', chance: 0.55 },
      { name: 'Journal before bed', category: 'RECOVERY', time: '20:00', chance: 0.65 },
      { name: 'Brush teeth 2x', category: 'HYGIENE', time: '08:00', chance: 0.95 },
      { name: 'Track expenses', category: 'FINANCE', time: '14:00', chance: 0.45 },
      { name: '10 min Meditation', category: 'HEALTH', time: '08:00', chance: 0.5 },
      { name: 'Learn Coding', category: 'LEARNING', time: '20:00', chance: 0.75 },
      { name: 'No Sugar', category: 'HEALTH', time: '14:00', chance: 0.8 },
      { name: 'Cold Shower', category: 'BODY', time: '08:00', chance: 0.4 },
    ];

    for (const demo of demoHabits) {
      const history: Record<string, boolean> = {};
      const d = new Date(getEffectiveDate());
      for (let i = 0; i < 45; i++) {
        const dStr = d.toISOString().split('T')[0];
        if (Math.random() < demo.chance) {
          history[dStr] = true;
        }
        d.setDate(d.getDate() - 1);
      }

      const id = await createHabit({
        name: demo.name,
        category: demo.category,
        time: demo.time,
        monthlyTarget: null,
      });

      await updateHabit({ id, history });
    }

    // ── Demo Saving Goals ──
    const demoGoals = [
      { name: 'New MacBook Pro', goal: 2500, saved: 1680, color: '#1d9bf0', days: 30 },
      { name: 'Emergency Fund', goal: 5000, saved: 3200, color: '#00ba7c', days: 60 },
      { name: 'Japan Trip 2026', goal: 3000, saved: 850, color: '#7856ff', days: 45 },
    ];

    for (const demo of demoGoals) {
      const startDate = new Date(getEffectiveDate());
      startDate.setDate(startDate.getDate() - demo.days);
      const targetDate = new Date(getEffectiveDate());
      targetDate.setDate(targetDate.getDate() + 90);

      const history: Record<string, number> = {};
      let remaining = demo.saved;
      const d = new Date(startDate);
      while (remaining > 0 && d <= getEffectiveDate()) {
        const dStr = d.toISOString().split('T')[0];
        if (Math.random() < 0.4) {
          const amount = Math.min(remaining, Math.round(20 + Math.random() * 80));
          history[dStr] = amount;
          remaining -= amount;
        }
        d.setDate(d.getDate() + 1);
      }

      const goalId = await createGoal({
        name: demo.name,
        goal: demo.goal,
        color: demo.color,
        startDate: startDate.toISOString().split('T')[0],
        targetDate: targetDate.toISOString().split('T')[0],
      });

      await updateGoal({
        id: goalId,
        saved: demo.saved,
        history,
      });
    }
  };

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
                Connection is taking longer than expected. Please check your internet.
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

  if (!isAuthenticated) {
    return <Auth />;
  }

  const inputClass = "w-full bg-[#16181c] border border-[#2f3336] px-4 py-4 rounded-xl text-lg text-[#eff3f4] placeholder-[#71767b] outline-none focus:border-[#1d9bf0] transition-all focus:bg-black";
  const labelClass = "text-[12px] md:text-[14px] font-black text-[#71767b] uppercase tracking-widest mb-2 block px-1";
  const submitClass = "x-button-primary w-full py-4 text-[17px] font-black rounded-2xl shadow-[0_0_20px_rgba(29,155,240,0.2)]";

  return (
    <div className="h-[100dvh] flex flex-col bg-black text-white font-sans antialiased overflow-hidden relative">
      {/* Premium Background Ambiance */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-[#1d9bf0]/10 rounded-full blur-[120px] pointer-events-none animate-pulse" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-[#7856ff]/10 rounded-full blur-[120px] pointer-events-none animate-pulse" style={{ animationDelay: '1s' }} />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[30%] h-[30%] bg-[#22c55e]/5 rounded-full blur-[100px] pointer-events-none" />

      <Tabs tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} onLogout={handleLogout} isLoggingOut={isLoggingOut} />

      <main className="flex-1 overflow-y-auto relative z-10 overscroll-contain">
        <div className="w-full">

          {activeTab === 'Daily Habits' && (
            <DailyHabits
              habits={habits}
              onToggleHabit={toggleHabit}
              onLoadDemo={loadDemoData}
            />
          )}


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
          {activeTab === 'Savings' && <Savings savings={savings} onDeleteGoal={confirmDeleteGoal} onAddGoal={openAddGoal} onAddSaving={addDailySaving} onLoadDemo={loadDemoData} />}

          {activeTab === 'Analytics' && (
            <Analytics
              habits={habits}
              savings={savings}
            />
          )}

        </div>
      </main>

      {/* Add Habit Modal */}
      <Modal isOpen={modalOpen === 'habit'} onClose={() => { setModalOpen(null); setEditingHabitId(null); }} title={editingHabitId ? "Edit Habit" : "New Habit"}>
        <div className="pb-8 space-y-6 px-1">
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
            <label className={labelClass}>Habit name</label>
            <input className={inputClass} placeholder="e.g. Drink 8 glasses of water" value={newHabitName} onChange={e => setNewHabitName(e.target.value)} autoFocus autoComplete="off" autoCorrect="off" spellCheck={false} />
          </div>
          <div className="flex flex-col md:grid md:grid-cols-2 gap-6">
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <label className={labelClass}>Time Phase (Optional)</label>
              <div className="flex flex-wrap gap-2.5 mt-1">
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
              {['HEALTH', 'BODY', 'FINANCE', 'LEARNING', 'OTHER'].map(cat => (
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
