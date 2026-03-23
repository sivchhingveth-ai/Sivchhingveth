import { Habit, SavingGoal } from '../types';
import { formatDateStr } from './dateUtils';

const STORAGE_KEYS = {
  HABITS: 'elite_habit_tracker_habits',
  SAVINGS: 'elite_habit_tracker_savings',
  GUEST_MODE: 'elite_habit_tracker_is_guest',
};

// --- Habits ---

export const getLocalHabits = (): Habit[] => {
  const data = localStorage.getItem(STORAGE_KEYS.HABITS);
  return data ? JSON.parse(data) : [];
};

export const saveLocalHabits = (habits: Habit[]) => {
  localStorage.setItem(STORAGE_KEYS.HABITS, JSON.stringify(habits));
};

export const addLocalHabit = (name: string, time?: string | null, monthlyTarget?: number | null): Habit => {
  const habits = getLocalHabits();
  const newHabit: Habit = {
    id: `local-${Date.now()}`,
    name,
    time: time || undefined,
    monthlyTarget: monthlyTarget || undefined,
    history: {},
    streak: 0,
  };
  saveLocalHabits([...habits, newHabit]);
  return newHabit;
};

export const updateLocalHabit = (id: string, updates: Partial<Habit>): Habit[] => {
  const habits = getLocalHabits();
  const newHabits = habits.map(h => h.id === id ? { ...h, ...updates } : h);
  saveLocalHabits(newHabits);
  return newHabits;
};

export const toggleLocalHabit = (id: string, dateStr: string): Habit[] => {
  const habits = getLocalHabits();
  const newHabits = habits.map(h => {
    if (h.id === id) {
      const newHistory = { ...h.history };
      newHistory[dateStr] = !newHistory[dateStr];
      return { ...h, history: newHistory };
    }
    return h;
  });
  saveLocalHabits(newHabits);
  return newHabits;
};

export const deleteLocalHabit = (id: string): Habit[] => {
  const habits = getLocalHabits();
  const newHabits = habits.filter(h => h.id !== id);
  saveLocalHabits(newHabits);
  return newHabits;
};

// --- Savings ---

export const getLocalSavings = (): SavingGoal[] => {
  const data = localStorage.getItem(STORAGE_KEYS.SAVINGS);
  return data ? JSON.parse(data) : [];
};

export const saveLocalSavings = (savings: SavingGoal[]) => {
  localStorage.setItem(STORAGE_KEYS.SAVINGS, JSON.stringify(savings));
};

export const addLocalGoal = (name: string, goal: number, color: string, startDate: string, targetDate: string): SavingGoal => {
  const savings = getLocalSavings();
  const newGoal: SavingGoal = {
    id: `local-${Date.now()}`,
    name,
    goal,
    saved: 0,
    color,
    startDate,
    targetDate,
    history: {},
  };
  saveLocalSavings([...savings, newGoal]);
  return newGoal;
};

export const updateLocalGoal = (id: string, amount: number, date: string): SavingGoal[] => {
  const savings = getLocalSavings();
  const newSavings = savings.map(s => {
    if (s.id === id) {
      const newHistory = { ...s.history, [date]: (s.history[date] || 0) + amount };
      return { ...s, saved: s.saved + amount, history: newHistory };
    }
    return s;
  });
  saveLocalSavings(newSavings);
  return newSavings;
};

export const deleteLocalGoal = (id: string): SavingGoal[] => {
  const savings = getLocalSavings();
  const newSavings = savings.filter(s => s.id !== id);
  saveLocalSavings(newSavings);
  return newSavings;
};

// --- Guest Mode ---

export const isGuestMode = (): boolean => {
  return localStorage.getItem(STORAGE_KEYS.GUEST_MODE) === 'true';
};

export const setGuestMode = (enabled: boolean) => {
  localStorage.setItem(STORAGE_KEYS.GUEST_MODE, enabled.toString());
};
