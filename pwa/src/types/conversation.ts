export interface Conversation {
  jid: string;
  name: string;
  folder: string;
  lastActivity: string;
  type: 'pwa';
}

export interface Message {
  id: string;
  chat_jid: string;
  sender_name: string;
  content: string;
  timestamp: string;
  is_from_me: boolean;
}

export interface PendingMessage {
  tempId: string;
  conversationId: string;
  content: string;
  timestamp: string;
  status: 'sending' | 'failed';
}
