import { create } from 'zustand';

interface AgentStatusState {
  status: Record<string, string | null>;
  handleAgentStatus: (conversationId: string, status: string) => void;
  clearStatus: (conversationId: string) => void;
}

export const useAgentStatusStore = create<AgentStatusState>((set) => ({
  status: {},

  handleAgentStatus: (conversationId: string, status: string) => {
    set((state) => ({
      status: { ...state.status, [conversationId]: status },
    }));
  },

  clearStatus: (conversationId: string) => {
    set((state) => ({
      status: { ...state.status, [conversationId]: null },
    }));
  },
}));
