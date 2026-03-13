/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Header } from './components/Header';
import { Tabs } from './components/Tabs';
import { Overview } from './components/Overview';
import { Habits } from './components/Habits';
import { Savings } from './components/Savings';
import { Schedule } from './components/Schedule';
import { Analytics } from './components/Analytics';
import { Modal } from './components/Modal';
import { Habit, SavingGoal, Task, Routine, Transaction, BudgetStats, AppNotification } from './types';

export default function App() {
  const [activeTab, setActiveTab] = useState('Overview');
  const tabs = ['Overview', 'Habits', 'Savings', 'Schedule', 'Analytics'];

  // Modal state
  const [modalOpen, setModalOpen] = useState<string | null>(null);

  // Form state
  const [newHabitName, setNewHabitName] = useState('');
  const [newGoalName, setNewGoalName] = useState('');
  const [newGoalAmount, setNewGoalAmount] = useState('');
  const [newTaskName, setNewTaskName] = useState('');
  const [newTaskTime, setNewTaskTime] = useState('');
  const [newTaskTag, setNewTaskTag] = useState<'work' | 'personal' | 'health'>('personal');
  const [newRoutineName, setNewRoutineName] = useState('');
  const [newRoutineTime, setNewRoutineTime] = useState('');
  const [newRoutineIcon, setNewRoutineIcon] = useState('⭐');
  const [newExpenseName, setNewExpenseName] = useState('');
  const [newExpenseAmount, setNewExpenseAmount] = useState('');

  const [habits, setHabits] = useState<Habit[]>([
    { id: 1, name: "Exercise", streak: 7, week: [1, 1, 1, 0, 1, 1, 0], doneToday: false },
    { id: 2, name: "Read 20 min", streak: 3, week: [1, 0, 1, 1, 0, 1, 0], doneToday: true },
    { id: 3, name: "Drink water", streak: 12, week: [1, 1, 1, 1, 1, 1, 0], doneToday: true },
    { id: 4, name: "Meditate", streak: 2, week: [1, 0, 1, 0, 0, 1, 0], doneToday: false },
  ]);

  const [savings, setSavings] = useState<SavingGoal[]>([
    { id: 1, name: "Emergency fund", goal: 500, saved: 310, color: "#34c759" },
    { id: 2, name: "Vacation", goal: 300, saved: 180, color: "#007aff" },
    { id: 3, name: "New laptop", goal: 200, saved: 60, color: "#ff9500" },
  ]);

  const [tasks, setTasks] = useState<Task[]>([
    { id: 1, name: "Review project proposal", time: "09:00", tag: "work", done: false },
    { id: 2, name: "Buy groceries", time: "12:00", tag: "personal", done: true },
    { id: 3, name: "Call mom", time: "15:00", tag: "personal", done: false },
    { id: 4, name: "Gym session", time: "18:00", tag: "health", done: false },
    { id: 5, name: "Read before bed", time: "21:00", tag: "personal", done: false },
  ]);

  const [routines, setRoutines] = useState<Routine[]>([
    { id: 1, name: "Morning stretch", time: "07:00 AM", icon: "🌅", color: "#ff9500", done: false },
    { id: 2, name: "Take vitamins", time: "08:00 AM", icon: "💊", color: "#ff3b30", done: true },
    { id: 3, name: "Evening walk", time: "07:00 PM", icon: "🌿", color: "#34c759", done: false },
    { id: 4, name: "Journal", time: "08:30 PM", icon: "📓", color: "#af52de", done: false },
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
  const toggleHabit = (id: number) => {
    setHabits(prev => prev.map(h => h.id === id ? { ...h, doneToday: !h.doneToday } : h));
  };

  const toggleTask = (id: number) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, done: !t.done } : t));
  };

  const toggleRoutine = (id: number) => {
    setRoutines(prev => prev.map(r => r.id === id ? { ...r, done: !r.done } : r));
  };

  // Delete functions
  const deleteHabit = (id: number) => {
    setHabits(prev => prev.filter(h => h.id !== id));
  };

  const deleteGoal = (id: number) => {
    setSavings(prev => prev.filter(s => s.id !== id));
  };

  const deleteTask = (id: number) => {
    setTasks(prev => prev.filter(t => t.id !== id));
  };

  const deleteRoutine = (id: number) => {
    setRoutines(prev => prev.filter(r => r.id !== id));
  };

  // Add functions
  const addHabit = () => {
    if (!newHabitName.trim()) return;
    const newId = Math.max(0, ...habits.map(h => h.id)) + 1;
    setHabits(prev => [...prev, { id: newId, name: newHabitName.trim(), streak: 0, week: [0, 0, 0, 0, 0, 0, 0], doneToday: false }]);
    setNewHabitName('');
    setModalOpen(null);
  };

  const addGoal = () => {
    if (!newGoalName.trim() || !newGoalAmount) return;
    const colors = ['#34c759', '#007aff', '#ff9500', '#ff3b30', '#af52de', '#5ac8fa'];
    const newId = Math.max(0, ...savings.map(s => s.id)) + 1;
    setSavings(prev => [...prev, { id: newId, name: newGoalName.trim(), goal: parseFloat(newGoalAmount), saved: 0, color: colors[newId % colors.length] }]);
    setNewGoalName('');
    setNewGoalAmount('');
    setModalOpen(null);
  };

  const addTask = () => {
    if (!newTaskName.trim() || !newTaskTime) return;
    const newId = Math.max(0, ...tasks.map(t => t.id)) + 1;
    setTasks(prev => [...prev, { id: newId, name: newTaskName.trim(), time: newTaskTime, tag: newTaskTag, done: false }]);
    setNewTaskName('');
    setNewTaskTime('');
    setNewTaskTag('personal');
    setModalOpen(null);
  };

  const addRoutine = () => {
    if (!newRoutineName.trim() || !newRoutineTime) return;
    const colors = ['#ff9500', '#ff3b30', '#34c759', '#5856d6', '#007aff', '#ffcc00'];
    const newId = Math.max(0, ...routines.map(r => r.id)) + 1;
    setRoutines(prev => [...prev, { id: newId, name: newRoutineName.trim(), time: newRoutineTime, icon: newRoutineIcon, color: colors[newId % colors.length], done: false }]);
    setNewRoutineName('');
    setNewRoutineTime('');
    setNewRoutineIcon('⭐');
    setModalOpen(null);
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
  const openAddHabit = () => { setModalOpen('habit'); };
  const openAddGoal = () => { setModalOpen('goal'); };
  const openAddTask = () => { setModalOpen('task'); setActiveTab('Schedule'); };
  const openAddRoutine = () => { setModalOpen('routine'); };
  const openAddExpense = () => { setModalOpen('expense'); setActiveTab('Savings'); };

  const inputClass = "w-full bg-transparent border border-[#2f3336] px-4 py-4 rounded-lg text-lg text-[#eff3f4] placeholder-[#71767b] outline-none focus:border-[#1d9bf0] transition-colors";
  const labelClass = "text-[14px] font-bold text-[#eff3f4] mb-2 block px-1";
  const submitClass = "w-full py-3.5 rounded-full bg-[#eff3f4] text-[#0f1419] text-[17px] font-bold hover:bg-[#d7dbdc] transition-colors active:scale-[0.98]";

  return (
    <div className="min-h-screen bg-black text-white font-sans antialiased">
      <Header 
        title="My Dashboard" 
        date="Friday, March 14, 2026" 
        quote="Progress over perfection." 
      />
      <Tabs tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />
      
      <main className="p-8 max-w-5xl mx-auto">
        {activeTab === 'Overview' && (
          <Overview 
            habits={habits}
            onToggleHabit={toggleHabit}
            tasks={tasks}
            routines={routines}
            savings={savings}
            transactions={transactions}
            budgetStats={budgetStats}
            notifications={notifications}
            setActiveTab={setActiveTab}
            onAddHabit={openAddHabit}
            onAddTask={openAddTask}
            onAddExpense={openAddExpense}
          />
        )}
        {activeTab === 'Habits' && <Habits habits={habits} onToggleHabit={toggleHabit} onDeleteHabit={deleteHabit} onAddHabit={openAddHabit} />}
        {activeTab === 'Savings' && <Savings savings={savings} onDeleteGoal={deleteGoal} onAddGoal={openAddGoal} />}
        {activeTab === 'Schedule' && <Schedule tasks={tasks} routines={routines} onToggleTask={toggleTask} onToggleRoutine={toggleRoutine} onDeleteTask={deleteTask} onDeleteRoutine={deleteRoutine} onAddTask={openAddTask} onAddRoutine={openAddRoutine} />}
        {activeTab === 'Analytics' && <Analytics habits={habits} tasks={tasks} />}
      </main>

      {/* Add Habit Modal */}
      <Modal isOpen={modalOpen === 'habit'} onClose={() => setModalOpen(null)} title="New Habit">
        <div className="space-y-4">
          <div>
            <label className={labelClass}>Habit name</label>
            <input className={inputClass} placeholder="e.g. Drink 8 glasses of water" value={newHabitName} onChange={e => setNewHabitName(e.target.value)} autoFocus />
          </div>
          <button onClick={addHabit} className={submitClass}>Add Habit</button>
        </div>
      </Modal>

      {/* Add Goal Modal */}
      <Modal isOpen={modalOpen === 'goal'} onClose={() => setModalOpen(null)} title="New Saving Goal">
        <div className="space-y-4">
          <div>
            <label className={labelClass}>Goal name</label>
            <input className={inputClass} placeholder="e.g. New Phone" value={newGoalName} onChange={e => setNewGoalName(e.target.value)} autoFocus />
          </div>
          <div>
            <label className={labelClass}>Target amount ($)</label>
            <input className={inputClass} type="number" placeholder="500" value={newGoalAmount} onChange={e => setNewGoalAmount(e.target.value)} />
          </div>
          <button onClick={addGoal} className={submitClass}>Add Goal</button>
        </div>
      </Modal>

      {/* Add Task Modal */}
      <Modal isOpen={modalOpen === 'task'} onClose={() => setModalOpen(null)} title="New Task">
        <div className="space-y-4">
          <div>
            <label className={labelClass}>Task name</label>
            <input className={inputClass} placeholder="e.g. Review report" value={newTaskName} onChange={e => setNewTaskName(e.target.value)} autoFocus />
          </div>
          <div>
            <label className={labelClass}>Time</label>
            <input className={inputClass} type="time" value={newTaskTime} onChange={e => setNewTaskTime(e.target.value)} style={{ colorScheme: 'dark' }} />
          </div>
          <div>
            <label className={labelClass}>Category</label>
            <div className="flex gap-2">
              {(['work', 'personal', 'health'] as const).map(tag => (
                <button key={tag} onClick={() => setNewTaskTag(tag)}
                  className={`flex-1 py-2.5 rounded-xl text-[13px] font-semibold capitalize transition-all border border-white/5 ${newTaskTag === tag ? 'bg-[#007aff] text-white' : 'bg-white/[0.06] text-white/40'}`}
                >{tag}</button>
              ))}
            </div>
          </div>
          <button onClick={addTask} className={submitClass}>Add Task</button>
        </div>
      </Modal>

      {/* Add Routine Modal */}
      <Modal isOpen={modalOpen === 'routine'} onClose={() => setModalOpen(null)} title="New Routine">
        <div className="space-y-4">
          <div>
            <label className={labelClass}>Routine name</label>
            <input className={inputClass} placeholder="e.g. Morning yoga" value={newRoutineName} onChange={e => setNewRoutineName(e.target.value)} autoFocus />
          </div>
          <div>
            <label className={labelClass}>Time</label>
            <input className={inputClass} placeholder="e.g. 07:00 AM" value={newRoutineTime} onChange={e => setNewRoutineTime(e.target.value)} />
          </div>
          <div>
            <label className={labelClass}>Icon</label>
            <div className="flex gap-2 flex-wrap">
              {['⭐', '🧘', '📚', '🏃', '💪', '🎵', '🍎', '💧', '🌙', '☀️', '🧠', '✍️'].map(icon => (
                <button key={icon} onClick={() => setNewRoutineIcon(icon)}
                  className={`w-11 h-11 rounded-xl text-[20px] flex items-center justify-center transition-all border border-white/5 ${newRoutineIcon === icon ? 'bg-[#007aff] shadow-lg scale-110' : 'bg-white/[0.06] opacity-60'}`}
                >{icon}</button>
              ))}
            </div>
          </div>
          <button onClick={addRoutine} className={submitClass}>Add Routine</button>
        </div>
      </Modal>

      {/* Add Expense Modal */}
      <Modal isOpen={modalOpen === 'expense'} onClose={() => setModalOpen(null)} title="New Expense">
        <div className="space-y-4">
          <div>
            <label className={labelClass}>Expense name</label>
            <input className={inputClass} placeholder="e.g. Uber ride" value={newExpenseName} onChange={e => setNewExpenseName(e.target.value)} autoFocus />
          </div>
          <div>
            <label className={labelClass}>Amount ($)</label>
            <input className={inputClass} type="number" step="0.01" placeholder="25.00" value={newExpenseAmount} onChange={e => setNewExpenseAmount(e.target.value)} />
          </div>
          <button onClick={addExpense} className={submitClass}>Add Expense</button>
        </div>
      </Modal>
    </div>
  );
}
