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
import { DatePicker } from './components/DatePicker';
import { Auth } from './components/Auth';
import { Plus, Loader2, ShieldAlert, ArrowUp } from 'lucide-react';
import { Habit, SavingGoal } from './types';
import { getEffectiveDateStr, getEffectiveDate } from './utils/dateUtils';

export default function App() {
  const todayStr = getEffectiveDateStr();
  const [activeTab, setActiveTab] = useState('To-Do List');
  const { isAuthenticated, isLoading } = useConvexAuth();
  const { signOut } = useAuthActions();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [loadingTimeout, setLoadingTimeout] = useState(false);
  const tabs = ['To-Do List', 'Set Routine & Rule', 'Savings', 'Analytics'];

  const [showScrollTop, setShowScrollTop] = useState(false);

  // Scroll to top on tab change and initialize scroll listener
  useEffect(() => {
    const main = document.querySelector('main');
    if (main) {
      main.scrollTop = 0;
      const handleScroll = () => setShowScrollTop(main.scrollTop > 300);
      main.addEventListener('scroll', handleScroll);
      return () => main.removeEventListener('scroll', handleScroll);
    }
  }, [activeTab]);

  const scrollToTop = () => {
    const main = document.querySelector('main');
    if (main) {
      main.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

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
  const [newGoalName, setNewGoalName] = useState('');
  const [newGoalAmount, setNewGoalAmount] = useState('');
  const [newGoalStartDate, setNewGoalStartDate] = useState(todayStr);
  const [newGoalTargetDate, setNewGoalTargetDate] = useState(todayStr);
  const [goalError, setGoalError] = useState('');
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
      title: 'Delete Routine',
      message: 'This will permanently delete this routine and all its history. This action cannot be undone.',
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

      try {
        if (editingHabitId) {
          await updateHabit({
            id: editingHabitId,
            name: trimmedName,
            time: newHabitTime || null,
            monthlyTarget: newHabitMonthlyTarget ? parseInt(newHabitMonthlyTarget) : null
          });
        } else {
          await createHabit({
            name: trimmedName,
            time: newHabitTime || null,
            monthlyTarget: newHabitMonthlyTarget ? parseInt(newHabitMonthlyTarget) : null
          });
        }
        setNewHabitName('');
        setNewHabitTime('');
        setNewHabitMonthlyTarget('');
        setEditingHabitId(null);
        setModalOpen(null);
      } catch (error) {
        console.error("Failed to save habit:", error);
        alert("Failed to save. Check connection and try again.");
      }
    }
  };

  const addGoal = async () => {
    if (!newGoalName.trim() || !newGoalAmount || !isAuthenticated) return;
    
    if (newGoalStartDate > newGoalTargetDate) {
      setGoalError("Target date must be after the start date.");
      return;
    }

    setGoalError('');

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
    setModalOpen('habit');
  };
  const openEditHabit = (id: any) => {
    const habit = habits.find(h => h.id === id);
    if (habit) {
      setEditingHabitId(id);
      setNewHabitName(habit.name);
      setNewHabitTime(habit.time || '');
      setNewHabitMonthlyTarget(habit.monthlyTarget?.toString() || '');
      setModalOpen('habit');
    }
  };
  const openAddGoal = () => {
    setNewGoalStartDate(todayStr);
    setGoalError('');
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
            <p className="text-[#eff3f4] font-bold text-sm">Loading your routines...</p>
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

  const inputClass = "w-full bg-[#16181c] border border-[#2f3336] px-3 py-2.5 md:py-3 rounded-xl text-[13px] md:text-[14px] text-[#eff3f4] placeholder-[#71767b] outline-none focus:border-[#1d9bf0] transition-all focus:bg-black";
  const labelClass = "text-[9px] md:text-[10px] font-black text-[#71767b] uppercase tracking-widest mb-1.5 block px-1";
  const submitClass = "x-button-primary w-full py-3 text-[14px] font-black rounded-xl shadow-[0_0_20px_rgba(29,155,240,0.2)]";

  return (
    <div className="h-[100dvh] flex flex-col bg-black text-white font-sans antialiased overflow-hidden relative w-full">
      {/* Premium Background Ambiance — Wrapped to prevent horizontal overflow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-[#1d9bf0]/10 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-[#7856ff]/10 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[30%] h-[30%] bg-[#22c55e]/5 rounded-full blur-[100px]" />
      </div>


      <main className="flex-1 overflow-y-auto relative z-10 overscroll-contain bg-black/50 overflow-x-hidden">
        <div className="max-w-[1000px] mx-auto border-x border-[#2f3336] min-h-full bg-black shadow-2xl relative flex flex-col w-full">
          {activeTab === 'To-Do List' && (
            <div key={activeTab}>
              <DailyHabits
                habits={habits}
                onToggleHabit={toggleHabit}

                tabs={tabs}
                activeTab={activeTab}
                onTabChange={setActiveTab}
                onLogout={handleLogout}
                isLoggingOut={isLoggingOut}
              />
            </div>
          )}


          {activeTab === 'Set Routine & Rule' && (
            <div key={activeTab}>
              <Habits
                habits={habits}
                onToggleHabit={toggleHabit}
                onDeleteHabit={confirmDeleteHabit}
                onAddHabit={openAddHabit}
                onEditHabit={openEditHabit}
                currentMonth={viewDate}
                onMonthChange={setViewDate}
                tabs={tabs}
                activeTab={activeTab}
                onTabChange={setActiveTab}
                onLogout={handleLogout}
                isLoggingOut={isLoggingOut}
              />
            </div>
          )}
          {activeTab === 'Savings' && (
            <div key={activeTab}>
              <Savings
                savings={savings}
                onDeleteGoal={confirmDeleteGoal}
                onAddGoal={openAddGoal}
                onAddSaving={addDailySaving}

                tabs={tabs}
                activeTab={activeTab}
                onTabChange={setActiveTab}
                onLogout={handleLogout}
                isLoggingOut={isLoggingOut}
              />
            </div>
          )}

          {activeTab === 'Analytics' && (
            <div key={activeTab}>
              <Analytics
                habits={habits}
                savings={savings}
                tabs={tabs}
                activeTab={activeTab}
                onTabChange={setActiveTab}
                onLogout={handleLogout}
                isLoggingOut={isLoggingOut}
              />
            </div>
          )}

          {/* Floating Scroll to Top Button — Global for Routine, Savings, and Analytics tabs */}
          {activeTab !== 'To-Do List' && (
            <div 
              className={`fixed bottom-16 right-6 min-[1000px]:right-[calc(50%-465px)] z-[60] transition-all duration-500 transform ${
                showScrollTop ? 'translate-y-0 opacity-100 scale-100' : 'translate-y-10 opacity-0 scale-75 pointer-events-none'
              }`}
            >
              <button
                onClick={scrollToTop}
                className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-xl border border-white/20 flex items-center justify-center shadow-2xl hover:bg-white/20 active:scale-95 group transition-all"
                aria-label="Scroll to top"
              >
                <ArrowUp className="w-6 h-6 text-[#eff3f4] group-hover:-translate-y-1 transition-transform duration-300" />
              </button>
            </div>
          )}
        </div>
      </main>

      {/* Add Routine Modal */}
      <Modal isOpen={modalOpen === 'habit'} onClose={() => { setModalOpen(null); setEditingHabitId(null); }} title={editingHabitId ? "Edit Routine & Rule" : "New Routine & Rule"}>
        <div className="pb-4 space-y-4 px-1">
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
            <label className={labelClass}>Name Routine & Rule</label>
            <input className={inputClass} placeholder="e.g. Drink 8 glasses of water" value={newHabitName} onChange={e => setNewHabitName(e.target.value)} autoFocus autoComplete="off" autoCorrect="off" spellCheck={false} />
          </div>
          <div className="flex flex-col md:grid md:grid-cols-2 gap-4">
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <label className={labelClass}>Time Phase (Optional)</label>
              <div className="flex flex-wrap gap-1.5 mt-1">
                {[
                  { name: 'Morning', time: '08:00' },
                  { name: 'Afternoon', time: '14:00' },
                  { name: 'Night', time: '20:00' },
                  { name: 'Midnight', time: '02:00' },
                  { name: 'Daily Rule', time: 'any' }
                ].map(phase => (
                  <button
                    key={phase.name}
                    onClick={(e) => { e.preventDefault(); setNewHabitTime(phase.time); }}
                    className={`px-2.5 py-1.5 rounded-lg text-[9px] md:text-[10px] font-black uppercase tracking-wider transition-all border ${newHabitTime === phase.time
                      ? 'bg-white border-white text-black shadow-[0_0_10px_rgba(255,255,255,0.2)]'
                      : 'bg-[#16181c] border-[#2f3336] text-[#71767b] hover:border-white/30 hover:text-[#eff3f4]'
                      }`}
                  >
                    {phase.name}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className={labelClass}>Monthly Target</label>
              <input 
                className={inputClass} 
                type="number" 
                inputMode="numeric" 
                pattern="[0-9]*" 
                min="1" 
                max="31"
                placeholder="e.g. 10" 
                value={newHabitMonthlyTarget} 
                onChange={e => {
                  const val = e.target.value;
                  if (val === "" || (parseInt(val) <= 31 && parseInt(val) >= 0)) {
                    setNewHabitMonthlyTarget(val);
                  }
                }} 
              />
            </div>
          </div>
          <button onClick={saveHabit} className={`${submitClass} mt-2`}>{editingHabitId ? "Update Routine & Rule" : "Add Routine & Rule"}</button>

        </div>
      </Modal>

      {/* Add Goal Modal */}
      <Modal isOpen={modalOpen === 'goal'} onClose={() => setModalOpen(null)} title="New Saving Goal">
        <div className="space-y-3">
          <div>
            <label className={labelClass}>Goal name</label>
            <input className={inputClass} placeholder="e.g. New Phone" value={newGoalName} onChange={e => setNewGoalName(e.target.value)} autoFocus autoComplete="off" autoCorrect="off" spellCheck={false} />
          </div>
          <div>
            <label className={labelClass}>Target amount ($)</label>
            <input className={inputClass} type="number" placeholder="500" value={newGoalAmount} onChange={e => setNewGoalAmount(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3 md:gap-4">
            <div>
              <label className={labelClass}>Start Date</label>
              <DatePicker value={newGoalStartDate} onChange={val => { setNewGoalStartDate(val); setGoalError(''); }} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Target Date</label>
              <DatePicker value={newGoalTargetDate} onChange={val => { setNewGoalTargetDate(val); setGoalError(''); }} className={inputClass} />
            </div>
          </div>
          {goalError && (
            <div className="text-red-500 text-[11px] font-bold bg-red-500/10 border border-red-500/20 px-3 py-2.5 rounded-xl animate-fade-in flex items-center justify-center">
              {goalError}
            </div>
          )}
          <button onClick={addGoal} className={`${submitClass} mt-3`}>Add Goal</button>
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
