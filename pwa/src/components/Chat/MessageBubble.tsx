import Avatar from '../Common/Avatar';
import MessageContent from './MessageContent';
import type { Message } from '../../types/conversation';
import './MessageBubble.css';

interface MessageBubbleProps {
  message: Message;
  isPending?: boolean;
  pendingStatus?: 'sending' | 'failed';
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function stripAssistantPrefix(content: string): string {
  return content.replace(/^\w+:\s*/, '');
}

export default function MessageBubble({ message, isPending, pendingStatus }: MessageBubbleProps) {
  const isUser = message.is_from_me;
  const displayContent = isUser ? message.content : stripAssistantPrefix(message.content);
  const senderName = isUser ? 'Vous' : message.sender_name;

  return (
    <div className={`message-bubble ${isUser ? 'message-bubble--user' : 'message-bubble--assistant'} ${isPending ? 'message-bubble--pending' : ''}`}>
      <Avatar name={senderName} isUser={isUser} />
      <div className="message-bubble__content">
        <div className="message-bubble__header">
          <span className="message-bubble__sender">{senderName}</span>
          <span className="message-bubble__time">
            {isPending
              ? pendingStatus === 'failed' ? 'Echec' : 'Envoi...'
              : formatTime(message.timestamp)}
          </span>
        </div>
        <div className="message-bubble__text">
          <MessageContent content={displayContent} conversationId={message.chat_jid} />
        </div>
      </div>
    </div>
  );
}
