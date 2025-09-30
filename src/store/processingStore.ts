import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface ProcessingStep {
  id: string;
  label: string;
  status: 'waiting' | 'running' | 'completed' | 'error';
  progress: number;
  message?: string;
}

export interface ProcessingState {
  isProcessing: boolean;
  isCompleted: boolean;
  hasErrors: boolean;
  isMinimized: boolean;
  steps: ProcessingStep[];
  logs: string[];
  canForceStop: boolean;
  documentIds: string[];
  startTime?: Date;
}

interface ProcessingStore extends ProcessingState {
  // State setters
  setProcessing: (processing: boolean) => void;
  setCompleted: (completed: boolean) => void;
  setErrors: (hasErrors: boolean) => void;
  setMinimized: (minimized: boolean) => void;
  setSteps: (steps: ProcessingStep[]) => void;
  setLogs: (logs: string[]) => void;
  setCanForceStop: (canForceStop: boolean) => void;
  setDocumentIds: (documentIds: string[]) => void;
  setStartTime: (startTime?: Date) => void;
  
  // Actions
  addLog: (message: string) => void;
  updateStep: (stepId: string, updates: Partial<ProcessingStep>) => void;
  reset: () => void;
  minimize: () => void;
  restore: () => void;
  forceStop: () => void;
}

const initialState: ProcessingState = {
  isProcessing: false,
  isCompleted: false,
  hasErrors: false,
  isMinimized: false,
  steps: [],
  logs: [],
  canForceStop: false,
  documentIds: [],
  startTime: undefined,
};

export const useProcessingStore = create<ProcessingStore>()(
  persist(
    (set, get) => ({
      ...initialState,
      
      // State setters
      setProcessing: (isProcessing) => set({ isProcessing }),
      setCompleted: (isCompleted) => set({ isCompleted }),
      setErrors: (hasErrors) => set({ hasErrors }),
      setMinimized: (isMinimized) => set({ isMinimized }),
      setSteps: (steps) => set({ steps }),
      setLogs: (logs) => set({ logs }),
      setCanForceStop: (canForceStop) => set({ canForceStop }),
      setDocumentIds: (documentIds) => set({ documentIds }),
      setStartTime: (startTime) => set({ startTime }),
      
      // Actions
      addLog: (message) => {
        const timestamp = new Date().toLocaleTimeString();
        const logEntry = `[${timestamp}] ${message}`;
        set(state => ({ logs: [...state.logs, logEntry] }));
      },
      
      updateStep: (stepId, updates) => {
        set(state => ({
          steps: state.steps.map(step =>
            step.id === stepId ? { ...step, ...updates } : step
          )
        }));
      },
      
      reset: () => set(initialState),
      
      minimize: () => {
        console.log('📦 Store: Setting isMinimized = true');
        set({ isMinimized: true });
      },
      
      restore: () => {
        console.log('📦 Store: Setting isMinimized = false');
        set({ isMinimized: false });
      },
      
      forceStop: () => {
        set({ 
          isProcessing: false, 
          canForceStop: false,
          hasErrors: true 
        });
      },
    }),
    {
      name: 'processing-storage',
      partialize: (state) => ({
        isProcessing: state.isProcessing,
        isCompleted: state.isCompleted,
        hasErrors: state.hasErrors,
        isMinimized: state.isMinimized,
        steps: state.steps,
        logs: state.logs,
        canForceStop: state.canForceStop,
        documentIds: state.documentIds,
        startTime: state.startTime,
      }),
    }
  )
);