import { create } from 'zustand';

export type TaskStatus = 'pending' | 'running' | 'waiting_approval' | 'completed' | 'failed' | 'cancelled';

export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  attachments?: Array<{
    type: 'file' | 'image' | 'url';
    name: string;
    path?: string;
  }>;
}

export interface ToolUse {
  id: string;
  name: string;
  input: Record<string, unknown>;
  status: 'pending' | 'approved' | 'denied' | 'executed' | 'failed';
  output?: string;
}

export interface Task {
  id: string;
  status: TaskStatus;
  messages: Message[];
  tools: ToolUse[];
  workspaceId?: string;
  createdAt: Date;
  updatedAt: Date;
  error?: string;
}

interface ChatState {
  currentTask: Task | null;
  tasks: Task[];
  isLoading: boolean;
  setCurrentTask: (task: Task | null) => void;
  setTasks: (tasks: Task[]) => void;
  addMessage: (message: Message) => void;
  updateTaskStatus: (status: TaskStatus) => void;
  addToolUse: (tool: ToolUse) => void;
  updateToolStatus: (toolId: string, status: ToolUse['status'], output?: string) => void;
  setLoading: (loading: boolean) => void;
}

export const useChatStore = create<ChatState>((set) => ({
  currentTask: null,
  tasks: [],
  isLoading: false,
  
  setCurrentTask: (task) => set({ currentTask: task }),
  
  setTasks: (tasks) => set({ tasks }),
  
  addMessage: (message) =>
    set((state) => ({
      currentTask: state.currentTask
        ? {
            ...state.currentTask,
            messages: [...state.currentTask.messages, message],
            updatedAt: new Date(),
          }
        : null,
    })),
  
  updateTaskStatus: (status) =>
    set((state) => ({
      currentTask: state.currentTask
        ? { ...state.currentTask, status, updatedAt: new Date() }
        : null,
    })),
  
  addToolUse: (tool) =>
    set((state) => ({
      currentTask: state.currentTask
        ? {
            ...state.currentTask,
            tools: [...state.currentTask.tools, tool],
          }
        : null,
    })),
  
  updateToolStatus: (toolId, status, output) =>
    set((state) => ({
      currentTask: state.currentTask
        ? {
            ...state.currentTask,
            tools: state.currentTask.tools.map((t) =>
              t.id === toolId ? { ...t, status, output } : t
            ),
          }
        : null,
    })),
  
  setLoading: (isLoading) => set({ isLoading }),
}));
