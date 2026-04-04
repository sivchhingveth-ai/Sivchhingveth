/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
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


import { Modal } from './components/Modal';
import { ConfirmModal } from './components/ConfirmModal';
import { DatePicker } from './components/DatePicker';
import { Auth } from './components/Auth';
import { Plus, Loader2, ShieldAlert, ArrowUp } from 'lucide-react';
import { Habit, SavingGoal } from './types';
import { getEffectiveDateStr, getEffectiveDate, formatDateStr, calculateStreak } from './utils/dateUtils';

export default function App() {
  const todayStr = getEffectiveDateStr();
  const [activeTab, setActiveTab] = useState('To Do List');
  const { isAuthenticated, isLoading } = useConvexAuth();
  const { signOut } = useAuthActions();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [loadingTimeout, setLoadingTimeout] = useState(false);
  const tabs = ['To Do List', 'Add Workspace', 'History'];
  const [historyDate, setHistoryDate] = useState(todayStr);

  const [showScrollTop, setShowScrollTop] = useState(false);
  const [isOnline, setIsOnline] = useState(window.navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

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
      }, 3000);
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
  const [spendingError, setSpendingError] = useState('');
  const [newHabitTime, setNewHabitTime] = useState('');
  const [newHabitMonthlyTarget, setNewHabitMonthlyTarget] = useState('');
  const [newHabitDescription, setNewHabitDescription] = useState('');
  const [habitError, setHabitError] = useState('');


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

  // Determine account start date based on earliest creationTime
  const accountStartDateStr = useMemo(() => {
    const allItems = [...(rawHabits ?? []), ...(rawSavings ?? [])];
    if (allItems.length === 0) return todayStr;
    const earliest = Math.min(...allItems.map(item => item._creationTime));
    return formatDateStr(new Date(earliest));
  }, [rawHabits, rawSavings, todayStr]);

  // Convex mutations
  const createHabit = useMutation(api.habits.create).withOptimisticUpdate(
    (localStore, args) => {
      const existing = localStore.getQuery(api.habits.list, {});
      if (existing !== undefined) {
        localStore.setQuery(api.habits.list, {}, [
          ...existing,
          {
            _id: `temp-${Date.now()}` as any,
            _creationTime: Date.now(),
            userId: "temp",
            name: args.name,
            history: {},
            streak: 0,
            time: args.time,
            monthlyTarget: args.monthlyTarget,
            description: args.description,
          }
        ]);
      }
    }
  );

  const updateHabit = useMutation(api.habits.update).withOptimisticUpdate(
    (localStore, args) => {
      const existing = localStore.getQuery(api.habits.list, {});
      if (existing !== undefined) {
        localStore.setQuery(api.habits.list, {}, existing.map(h => 
          h._id === args.id ? { 
            ...h, 
            name: args.name ?? h.name, 
            time: args.time ?? h.time,
            monthlyTarget: args.monthlyTarget ?? h.monthlyTarget,
            description: args.description ?? h.description,
            history: args.history ?? h.history,
            // Optimistically update streak if history is changed
            streak: args.history ? calculateStreak(args.history, args.todayStr || todayStr) : h.streak
          } : h
        ));
      }
    }
  );

  // Auto-save daily snapshot at midnight - runs every minute to check
  useEffect(() => {
    if (!isAuthenticated || !rawHabits) return;
    
    const checkAndSaveDailySnapshot = () => {
      const now = new Date();
      const currentHour = now.getHours();
      const currentMinute = now.getMinutes();
      
      // Check if it's midnight (00:00)
      if (currentHour === 0 && currentMinute === 0) {
        const yesterday = new Date(now);
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = formatDateStr(yesterday);
        
        // Save snapshot for all habits from yesterday
        rawHabits.forEach(habit => {
          // Only save if not already saved for yesterday
          if (!habit.history || !habit.history.hasOwnProperty(yesterdayStr)) {
            const updatedHistory = { ...habit.history };
            // Mark as false (incomplete) if not already marked
            updatedHistory[yesterdayStr] = false;
            
            // Save to database
            updateHabit({
              id: habit._id,
              history: updatedHistory,
              todayStr: yesterdayStr,
            });
          }
        });
      }
    };
    
    // Check every minute
    const interval = setInterval(checkAndSaveDailySnapshot, 60000);
    
    // Also check immediately when component mounts
    checkAndSaveDailySnapshot();
    
    return () => clearInterval(interval);
  }, [isAuthenticated, rawHabits, updateHabit, todayStr]);

  const removeHabit = useMutation(api.habits.remove).withOptimisticUpdate(
    (localStore, args) => {
      const existing = localStore.getQuery(api.habits.list, {});
      if (existing !== undefined) {
        localStore.setQuery(api.habits.list, {}, existing.filter(h => h._id !== args.id));
      }
    }
  );

  const createGoal = useMutation(api.savingGoals.create).withOptimisticUpdate(
    (localStore, args) => {
      const existing = localStore.getQuery(api.savingGoals.list, {});
      if (existing !== undefined) {
        localStore.setQuery(api.savingGoals.list, {}, [
          ...existing,
          {
            _id: `temp-${Date.now()}` as any,
            _creationTime: Date.now(),
            userId: "temp",
            name: args.name,
            goal: args.goal,
            saved: 0,
            color: args.color,
            startDate: args.startDate,
            targetDate: args.targetDate,
            history: {},
          }
        ]);
      }
    }
  );

  const updateGoal = useMutation(api.savingGoals.update).withOptimisticUpdate(
    (localStore, args) => {
      const existing = localStore.getQuery(api.savingGoals.list, {});
      if (existing !== undefined) {
        localStore.setQuery(api.savingGoals.list, {}, existing.map(s => 
          s._id === args.id ? { ...s, saved: args.saved ?? s.saved, history: args.history ?? s.history } : s
        ));
      }
    }
  );

  const removeGoal = useMutation(api.savingGoals.remove).withOptimisticUpdate(
    (localStore, args) => {
      const existing = localStore.getQuery(api.savingGoals.list, {});
      if (existing !== undefined) {
        localStore.setQuery(api.savingGoals.list, {}, existing.filter(s => s._id !== args.id));
      }
    }
  );


  // Map data correctly based on current mode
  const habits: Habit[] = (rawHabits || []).map(h => ({
        id: h._id,
        name: h.name,
        history: h.history || {},
        streak: h.streak,
        time: h.time ?? undefined,
        monthlyTarget: h.monthlyTarget ?? undefined,
        description: h.description ?? undefined,
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

    // Trigger Convex update
    const habit = (rawHabits || []).find(h => h._id === id);
    if (!habit) return;

    const updatedHistory = { ...habit.history };
    updatedHistory[dateStr] = !updatedHistory[dateStr];

    updateHabit({
      id: id as Id<"habits">,
      history: updatedHistory,
      todayStr: todayStr,
    });
  }, [isAuthenticated, rawHabits, todayStr, updateHabit]);



  // Delete functions
  const deleteHabit = async (id: any) => {
    if (!isAuthenticated) return;
    removeHabit({ id: id as Id<"habits"> });
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
    removeGoal({ id: id as Id<"savingGoals"> });
  };

  const confirmDeleteGoal = (id: any) => {
    setConfirmModal({
      isOpen: true,
      title: 'Delete Spending Item',
      message: 'Are you sure you want to delete this spending?',
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
        setHabitError('A routine with this name already exists.');
        return;
      }

      setHabitError('');
      try {
        if (editingHabitId) {
          updateHabit({
            id: editingHabitId as Id<"habits">,
            name: trimmedName,
            time: newHabitTime || null,
            monthlyTarget: newHabitMonthlyTarget ? parseInt(newHabitMonthlyTarget) : null,
            description: newHabitDescription.trim() || null
          }).catch(err => {
            console.error(err);
            setHabitError('Failed to update routine.');
          });
        } else {
          createHabit({
            name: trimmedName,
            time: newHabitTime || null,
            monthlyTarget: newHabitMonthlyTarget ? parseInt(newHabitMonthlyTarget) : null,
            description: newHabitDescription.trim() || null
          }).catch(err => {
            console.error(err);
            setHabitError('Failed to create routine.');
          });
        }
        setNewHabitName('');
        setNewHabitTime('');
        setNewHabitMonthlyTarget('');
        setNewHabitDescription('');
        setEditingHabitId(null);
        setModalOpen(null);
      } catch (error) {
        console.error("Failed to save habit:", error);
        setHabitError("Failed to save. Check connection and try again.");
      }
    }
  };

  const addGoal = async () => {
    if (!newGoalName.trim() || !newGoalAmount || !isAuthenticated) return;
    
    if (newGoalStartDate > newGoalTargetDate) {
      setSpendingError("Limit reached for this spending.");
      return;
    }

    setSpendingError('');

    const colors = ['#34c759', '#007aff', '#ff9500', '#ff3b30', '#af52de', '#5ac8fa'];

    createGoal({
      name: newGoalName.trim(),
      goal: parseFloat(newGoalAmount),
      color: colors[savings.length % colors.length],
      startDate: newGoalStartDate,
      targetDate: newGoalTargetDate,
    }).catch(console.error);

    setNewGoalName('');
    setNewGoalAmount('');
    setNewGoalStartDate(todayStr);
    setNewGoalTargetDate(todayStr);
    setModalOpen(null);
  };

  const addDailySpending = async (goalId: any, amount: number, date: string) => {
    const goal = savings.find(s => s.id === goalId);
    if (!goal) return;

    const newHistory = { ...goal.history, [date]: (goal.history[date] || 0) + amount };
    const newSaved = goal.saved + (amount || 0);

    updateGoal({
      id: goalId as Id<"savingGoals">,
      saved: newSaved,
      history: newHistory,
    }).catch(console.error);
  };




  // Open modal helpers
  const openAddHabit = () => {
    setEditingHabitId(null);
    setNewHabitName('');
    setNewHabitTime('');
    setNewHabitMonthlyTarget('');
    setNewHabitDescription('');
    setHabitError('');
    setModalOpen('habit');
  };
  const openEditHabit = (id: any) => {
    const habit = habits.find(h => h.id === id);
    if (habit) {
      setEditingHabitId(id);
      setNewHabitName(habit.name);
      setNewHabitTime(habit.time || '');
      setNewHabitMonthlyTarget(habit.monthlyTarget?.toString() || '');
      setNewHabitDescription(habit.description || '');
      setHabitError('');
      setModalOpen('habit');
    }
  };
  const openAddGoal = () => {
    setNewGoalStartDate(todayStr);
    setSpendingError('');
    setNewGoalTargetDate(todayStr);
    setModalOpen('goal');
  };

  const handleLogout = () => {
    setConfirmModal({
      isOpen: true,
      title: 'Sign Out',
      message: 'Are you sure you want to sign out?',
      onConfirm: async () => {
        setIsLoggingOut(true);
        try {
          await signOut();
        } catch (err) {
          console.error('Logout failed:', err);
        } finally {
          setIsLoggingOut(false);
        }
      }
    });
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
            <p className="text-[#eff3f4] font-bold text-sm">Loading your categories...</p>
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
      {/* Offline Notice */}
      {!isOnline && (
        <div className="bg-red-500/10 border-b border-red-500/20 py-2 px-4 flex items-center gap-2 z-[100]">
          <ShieldAlert className="w-4 h-4 text-red-500" />
          <p className="text-[10px] md:text-[11px] font-black uppercase tracking-widest text-red-100">
            Offline — Progress will sync when reconnected
          </p>
        </div>
      )}

      {/* Premium Background Ambiance — Wrapped to prevent horizontal overflow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-[#1d9bf0]/10 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-[#7856ff]/10 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[30%] h-[30%] bg-[#22c55e]/5 rounded-full blur-[100px]" />
      </div>

      <main className="flex-1 overflow-y-auto relative z-10 overscroll-contain bg-black/50 overflow-x-hidden">
        <div className="max-w-[1000px] mx-auto border-x border-[#2f3336] min-h-full bg-black shadow-2xl relative flex flex-col w-full">
          {activeTab === 'To Do List' && (
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
          {activeTab === 'History' && (
            <div key={activeTab}>
              <DailyHabits 
                habits={habits}
                onToggleHabit={toggleHabit}
                tabs={tabs}
                activeTab={activeTab}
                onTabChange={setActiveTab}
                onLogout={handleLogout}
                isLoggingOut={isLoggingOut}
                historyDate={historyDate}
                onDateChange={setHistoryDate}
                startDate={accountStartDateStr}
                maxDate={todayStr}
              />
            </div>
          )}
          {activeTab === 'Add Workspace' && (
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
                startDate={accountStartDateStr}
              />
            </div>
          )}


          {/* Floating Scroll to Top Button — Global for all tabs */}
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
        </div>
      </main>

      {/* Add Routine Modal */}
      <Modal isOpen={modalOpen === 'habit'} onClose={() => { setModalOpen(null); setEditingHabitId(null); }} title={editingHabitId ? "Edit Workspace" : "New Workspace"}>
        <div className="pb-4 space-y-4 px-1">
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
            <label className={labelClass}>Name Workspace</label>
            <input className={inputClass} placeholder="e.g. Drink 8 glasses of water" value={newHabitName} onChange={e => setNewHabitName(e.target.value)} autoFocus autoComplete="off" autoCorrect="off" spellCheck={false} />
          </div>
          <div className="flex flex-col md:grid md:grid-cols-2 gap-4">
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <label className={labelClass}>Time Phase (Optional)</label>
              <div className="flex flex-wrap gap-1.5 mt-1">
                {[
                  { name: 'Reset', time: 'reset' },
                  { name: 'Growth', time: 'growth' },
                  { name: 'Distraction', time: 'distraction' },
                  { name: 'Rules', time: 'any' },
                  { name: 'Spending', time: 'spending' }
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
            <div className="animate-in fade-in slide-in-from-bottom-5 duration-600">
              <label className={labelClass}>Monthly Frequency</label>
              <select 
                className={inputClass}
                value={newHabitMonthlyTarget}
                onChange={e => setNewHabitMonthlyTarget(e.target.value)}
              >
                <option value="">Daily - Every day of the month</option>
                <option value="1">Once - Only on the 1st of each month</option>
                <option value="2">Twice - On the 1st and 15th of each month</option>
                <option value="3">3 times - On the 1st, 11th, and 21st of each month</option>
                <option value="4">Weekly - On the 1st, 8th, 15th, and 22nd of each month</option>
              </select>
            </div>
          </div>

          <div className="animate-in fade-in slide-in-from-bottom-6 duration-700">
            <label className={labelClass}>Detail Description (Rules / Info)</label>
            <textarea 
              className={`${inputClass} min-h-[100px] resize-none py-2`} 
              placeholder="Explain the rules or details of this task..." 
              value={newHabitDescription} 
              onChange={e => setNewHabitDescription(e.target.value)}
              autoComplete="off" autoCorrect="off" spellCheck={false}
            />
          </div>

          {habitError && (
            <div className="text-red-500 text-[11px] font-bold bg-red-500/10 border border-red-500/20 px-3 py-2.5 rounded-xl animate-fade-in flex items-center justify-center">
              {habitError}
            </div>
          )}
          <button onClick={saveHabit} className={`${submitClass} mt-2`}>{editingHabitId ? "Update Workspace" : "Add Workspace"}</button>

        </div>
      </Modal>

      {/* Add Goal Modal */}
      <Modal isOpen={modalOpen === 'goal'} onClose={() => setModalOpen(null)} title="New Spending">
        <div className="space-y-3">
          <div>
            <label className={labelClass}>Spending name</label>
            <input className={inputClass} placeholder="e.g. Shopping" value={newGoalName} onChange={e => setNewGoalName(e.target.value)} autoFocus autoComplete="off" autoCorrect="off" spellCheck={false} />
          </div>
          <div>
            <label className={labelClass}>The limit ($)</label>
            <input className={inputClass} type="number" placeholder="500" value={newGoalAmount} onChange={e => setNewGoalAmount(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3 md:gap-4">
            <div>
              <label className={labelClass}>Start Date</label>
              <DatePicker value={newGoalStartDate} onChange={val => { setNewGoalStartDate(val); setSpendingError(''); }} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Target Date</label>
              <DatePicker value={newGoalTargetDate} onChange={val => { setNewGoalTargetDate(val); setSpendingError(''); }} className={inputClass} />
            </div>
          </div>
          {spendingError && (
            <div className="text-red-500 text-[11px] font-bold bg-red-500/10 border border-red-500/20 px-3 py-2.5 rounded-xl animate-fade-in flex items-center justify-center">
              {spendingError}
            </div>
          )}
          <button onClick={addGoal} className={`${submitClass} mt-3`}>Add Spending</button>
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
