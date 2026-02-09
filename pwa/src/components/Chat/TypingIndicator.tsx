import { useAgentStatusStore } from '../../stores/agentStatusStore';
import './TypingIndicator.css';

interface TypingIndicatorProps {
  conversationId: string;
}

export default function TypingIndicator({ conversationId }: TypingIndicatorProps) {
  const status = useAgentStatusStore((s) => s.status[conversationId]);

  if (!status) return null;

  return (
    <div className="typing-indicator">
      <div className="typing-indicator__dots">
        <span className="typing-indicator__dot" />
        <span className="typing-indicator__dot" />
        <span className="typing-indicator__dot" />
      </div>
      <span className="typing-indicator__text">{status}</span>
    </div>
  );
}
