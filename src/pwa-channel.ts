import { runContainerAgent, writeTasksSnapshot, writeGroupsSnapshot } from './container-runner.js';
import {
  createPWAConversationDB,
  getPWAConversationDB,
  getAllPWAConversationsDB,
  renamePWAConversation as renamePWAConversationDB,
  deletePWAConversation as deletePWAConversationDB,
  addPWAMessage,
  getPWAMessages as getPWAMessagesDB,
  getPWARecentMessages,
  generatePWAConversationId,
  generatePWAMessageId,
  PWAConversationRow,
  PWAMessageRow,
} from './db.js';
import { ASSISTANT_NAME } from './config.js';
import { RegisteredGroup } from './types.js';
import { logger } from './logger.js';

// Session IDs for active conversations (not persisted — agent sessions are ephemeral per process lifecycle)
const pwaSessions = new Map<string, string>();

export interface PWAConversationInfo {
  jid: string;
  name: string;
  folder: string;
  lastActivity: string;
  type: 'pwa';
}

function toConversationInfo(row: PWAConversationRow): PWAConversationInfo {
  return {
    jid: row.id,
    name: row.name,
    folder: `pwa-${row.id}`,
    lastActivity: row.last_activity,
    type: 'pwa',
  };
}

export interface PWAMessageInfo {
  id: string;
  chat_jid: string;
  sender_name: string;
  content: string;
  timestamp: string;
  is_from_me: boolean;
}

function toMessageInfo(row: PWAMessageRow): PWAMessageInfo {
  return {
    id: row.id,
    chat_jid: row.conversation_id,
    sender_name: row.sender === 'user' ? 'You' : ASSISTANT_NAME,
    content: row.sender === 'assistant' ? `${ASSISTANT_NAME}: ${row.content}` : row.content,
    timestamp: row.timestamp,
    is_from_me: row.sender === 'user',
  };
}

export function createPWAConversation(name?: string): PWAConversationInfo {
  const id = generatePWAConversationId();
  const convName = name || 'New conversation';
  createPWAConversationDB(id, convName);

  const row = getPWAConversationDB(id)!;
  logger.info({ conversationId: id }, 'PWA conversation created');
  return toConversationInfo(row);
}

export function getAllPWAConversations(): PWAConversationInfo[] {
  return getAllPWAConversationsDB().map(toConversationInfo);
}

export function getPWAConversation(id: string): PWAConversationInfo | null {
  const row = getPWAConversationDB(id);
  return row ? toConversationInfo(row) : null;
}

export function renamePWAConversation(id: string, name: string): boolean {
  return renamePWAConversationDB(id, name);
}

export function deletePWAConversation(id: string): boolean {
  pwaSessions.delete(id);
  return deletePWAConversationDB(id);
}

export function getPWAMessages(conversationId: string, since?: string): PWAMessageInfo[] {
  const rows = since
    ? getPWAMessagesDB(conversationId, since)
    : getPWARecentMessages(conversationId, 50);
  return rows.map(toMessageInfo);
}

export type OnStatusCallback = (conversationId: string, status: string) => void;

export async function sendToPWAAgent(
  conversationId: string,
  userMessage: string,
  assistantName: string,
  onStatus?: OnStatusCallback,
): Promise<{ response: string; messageId: string }> {
  const conversation = getPWAConversationDB(conversationId);
  if (!conversation) {
    throw new Error('Conversation not found');
  }

  // Store the user message
  const userMsgId = generatePWAMessageId();
  addPWAMessage(userMsgId, conversationId, 'user', userMessage);

  // Build context for the agent (last 10 messages)
  const recentMessages = getPWARecentMessages(conversationId, 10);
  const escapeXml = (s: string) =>
    s
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');

  const messagesXml = recentMessages
    .map((msg) => {
      const sender = msg.sender === 'user' ? 'User' : assistantName;
      return `<message sender="${escapeXml(sender)}" time="${msg.timestamp}">${escapeXml(msg.content)}</message>`;
    })
    .join('\n');

  const prompt = `<messages>\n${messagesXml}\n</messages>`;

  // Virtual group for this PWA conversation
  const virtualGroup: RegisteredGroup = {
    name: conversation.name,
    folder: `pwa-${conversationId}`,
    trigger: '',
    added_at: conversation.created_at,
  };

  const sessionId = pwaSessions.get(conversationId);

  // Prepare snapshots
  writeTasksSnapshot(virtualGroup.folder, false, []);
  writeGroupsSnapshot(virtualGroup.folder, false, [], new Set());

  try {
    logger.info({ conversationId }, 'Calling PWA agent');

    const output = await runContainerAgent(virtualGroup, {
      prompt,
      sessionId,
      groupFolder: virtualGroup.folder,
      chatJid: conversationId,
      isMain: false,
    }, onStatus ? (status: string) => onStatus(conversationId, status) : undefined);

    if (output.newSessionId) {
      pwaSessions.set(conversationId, output.newSessionId);
    }

    if (output.status === 'error') {
      logger.error({ conversationId, error: output.error }, 'PWA agent error');
      const errorMsg = 'Desole, une erreur est survenue.';
      const errorMsgId = generatePWAMessageId();
      addPWAMessage(errorMsgId, conversationId, 'assistant', errorMsg);
      return { response: errorMsg, messageId: errorMsgId };
    }

    const response = output.result || 'Pas de reponse';
    const assistantMsgId = generatePWAMessageId();
    addPWAMessage(assistantMsgId, conversationId, 'assistant', response);

    return { response, messageId: assistantMsgId };
  } catch (err) {
    logger.error({ conversationId, err }, 'Failed to call PWA agent');
    throw err;
  }
}
