export interface Habit {
  id: number;
  name: string;
  streak: number;
  week: number[];
  doneToday: boolean;
}

export interface SavingGoal {
  id: number;
  name: string;
  goal: number;
  saved: number;
  color: string;
}

export interface Task {
  id: number;
  name: string;
  time: string;
  tag: 'work' | 'personal' | 'health' | 'routine';
  done: boolean;
}

export interface Routine {
  id: number;
  name: string;
  time: string;
  icon: string;
  color: string;
  done: boolean;
}

export interface Transaction {
  id: number;
  name: string;
  amount: number;
  category: string;
  date: string;
  type: 'income' | 'expense';
  icon: string;
  color: string;
}

export interface BudgetStats {
  balance: number;
  budgetLeft: number;
  monthlyBudget: number;
}

export interface AppNotification {
  id: number;
  message: string;
  type: 'info' | 'reminder' | 'alert' | 'success';
}
