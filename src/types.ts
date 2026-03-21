export interface Habit {
  id: any;
  name: string;
  history: Record<string, boolean>; // date string "YYYY-MM-DD" -> boolean
  streak: number;
  time?: string;
  monthlyTarget?: number;
}

export interface SavingGoal {
  id: any;
  name: string;
  goal: number;
  saved: number;
  color: string;
  startDate: string;
  targetDate: string;
  history: Record<string, number>;
}

export interface Task {
  id: any;
  name: string;
  time: string;
  tag: 'work' | 'personal' | 'health' | 'routine';
  done: boolean;
}

export interface Routine {
  id: any;
  name: string;
  time: string;
  icon: string;
  color: string;
  done: boolean;
}

export interface Transaction {
  id: any;
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
  id: any;
  message: string;
  type: 'info' | 'reminder' | 'alert' | 'success';
}
