import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { getEffectiveDateStr, getEffectiveDate } from '../utils/dateUtils';

interface TimeState {
  now: Date;
  todayStr: string;
  todayDate: Date;
}

interface ModalState {
  modalOpen: string | null;
  confirmModal: {
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  };
}

interface FormState {
  newHabitName: string;
  newHabitTime: string;
  newHabitMonthlyTarget: string;
  newHabitDescription: string;
  habitError: string;
  newGoalName: string;
  newGoalAmount: string;
  newGoalStartDate: string;
  newGoalTargetDate: string;
  spendingError: string;
  editingHabitId: string | null;
}

interface UIState {
  activeTab: string;
  historyDate: string;
  viewDate: Date;
  isLoggingOut: boolean;
  loadingTimeout: boolean;
  showScrollTop: boolean;
  isOnline: boolean;
  searchTerm: string;
  showActionsId: string | null;
}

interface AppStore extends TimeState, ModalState, FormState, UIState {
  // Actions
  setNow: (now: Date) => void;
  updateTime: () => void;
  
  // Modal actions
  openModal: (modal: string) => void;
  closeModal: () => void;
  openConfirmModal: (title: string, message: string, onConfirm: () => void) => void;
  closeConfirmModal: () => void;
  
  // Form actions
  setNewHabitName: (name: string) => void;
  setNewHabitTime: (time: string) => void;
  setNewHabitMonthlyTarget: (target: string) => void;
  setNewHabitDescription: (desc: string) => void;
  setHabitError: (error: string) => void;
  setNewGoalName: (name: string) => void;
  setNewGoalAmount: (amount: string) => void;
  setNewGoalStartDate: (date: string) => void;
  setNewGoalTargetDate: (date: string) => void;
  setSpendingError: (error: string) => void;
  setEditingHabitId: (id: string | null) => void;
  resetHabitForm: () => void;
  resetGoalForm: () => void;
  resetForms: () => void;
  
  // UI actions
  setActiveTab: (tab: string) => void;
  setHistoryDate: (date: string) => void;
  setViewDate: (date: Date) => void;
  setIsLoggingOut: (loggingOut: boolean) => void;
  setLoadingTimeout: (timeout: boolean) => void;
  setShowScrollTop: (show: boolean) => void;
  setIsOnline: (online: boolean) => void;
  setSearchTerm: (term: string) => void;
  setShowActionsId: (id: string | null) => void;
}

const initialFormState: FormState = {
  newHabitName: '',
  newHabitTime: '',
  newHabitMonthlyTarget: '',
  newHabitDescription: '',
  habitError: '',
  newGoalName: '',
  newGoalAmount: '',
  newGoalStartDate: getEffectiveDateStr(),
  newGoalTargetDate: getEffectiveDateStr(),
  spendingError: '',
  editingHabitId: null,
};

const useAppStore = create<AppStore>()(
  persist(
    (set, get) => ({
      // Time state - initialized once
      now: new Date(),
      todayStr: getEffectiveDateStr(),
      todayDate: getEffectiveDate(),
      
      // Modal state
      modalOpen: null,
      confirmModal: {
        isOpen: false,
        title: '',
        message: '',
        onConfirm: () => {},
      },
      
      // Form state
      ...initialFormState,
      
      // UI state
      activeTab: 'Rules & Growth',
      historyDate: getEffectiveDateStr(),
      viewDate: new Date(),
      isLoggingOut: false,
      loadingTimeout: false,
      showScrollTop: false,
      isOnline: typeof window !== 'undefined' ? window.navigator.onLine : true,
      searchTerm: '',
      showActionsId: null,
      
      // Time actions - single source of truth
      setNow: (now) => {
        const todayStr = getEffectiveDateStr(now);
        const todayDate = getEffectiveDate(now);
        set({ now, todayStr, todayDate });
      },
      
      updateTime: () => {
        const now = new Date();
        const todayStr = getEffectiveDateStr(now);
        const todayDate = getEffectiveDate(now);
        set({ now, todayStr, todayDate });
      },
      
      // Modal actions
      openModal: (modal) => set({ modalOpen: modal }),
      closeModal: () => set({ modalOpen: null, editingHabitId: null }),
      
      openConfirmModal: (title, message, onConfirm) => 
        set({ 
          confirmModal: { isOpen: true, title, message, onConfirm } 
        }),
      closeConfirmModal: () => 
        set({ 
          confirmModal: { ...get().confirmModal, isOpen: false } 
        }),
      
      // Form actions
      setNewHabitName: (name) => set({ newHabitName: name }),
      setNewHabitTime: (time) => set({ newHabitTime: time }),
      setNewHabitMonthlyTarget: (target) => set({ newHabitMonthlyTarget: target }),
      setNewHabitDescription: (desc) => set({ newHabitDescription: desc }),
      setHabitError: (error) => set({ habitError: error }),
      setNewGoalName: (name) => set({ newGoalName: name }),
      setNewGoalAmount: (amount) => set({ newGoalAmount: amount }),
      setNewGoalStartDate: (date) => set({ newGoalStartDate: date }),
      setNewGoalTargetDate: (date) => set({ newGoalTargetDate: date }),
      setSpendingError: (error) => set({ spendingError: error }),
      setEditingHabitId: (id) => set({ editingHabitId: id }),
      
      resetHabitForm: () => set({
        newHabitName: '',
        newHabitTime: '',
        newHabitMonthlyTarget: '',
        newHabitDescription: '',
        habitError: '',
        editingHabitId: null,
      }),
      
      resetGoalForm: () => set({
        newGoalName: '',
        newGoalAmount: '',
        newGoalStartDate: get().todayStr,
        newGoalTargetDate: get().todayStr,
        spendingError: '',
      }),
      
      resetForms: () => set({
        ...initialFormState,
        newGoalStartDate: get().todayStr,
        newGoalTargetDate: get().todayStr,
      }),
      
      // UI actions
      setActiveTab: (tab) => set({ activeTab: tab }),
      setHistoryDate: (date) => set({ historyDate: date }),
      setViewDate: (date) => set({ viewDate: date }),
      setIsLoggingOut: (loggingOut) => set({ isLoggingOut: loggingOut }),
      setLoadingTimeout: (timeout) => set({ loadingTimeout: timeout }),
      setShowScrollTop: (show) => set({ showScrollTop: show }),
      setIsOnline: (online) => set({ isOnline: online }),
      setSearchTerm: (term) => set({ searchTerm: term }),
      setShowActionsId: (id) => set({ showActionsId: id }),
    }),
    {
      name: 'habit-tracker-store',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ 
        // Only persist UI preferences, not time-sensitive data
        activeTab: state.activeTab,
      }),
    }
  )
);

export default useAppStore;
