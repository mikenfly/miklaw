import { useState, useCallback, useRef, useEffect } from 'react';
import { useMessageStore } from '../../stores/messageStore';
import { useVisualViewport } from '../../hooks/useVisualViewport';
import './MessageInput.css';

interface MessageInputProps {
  conversationId: string;
}

export default function MessageInput({ conversationId }: MessageInputProps) {
  const [content, setContent] = useState('');
  const sendMessage = useMessageStore((s) => s.sendMessage);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { keyboardHeight } = useVisualViewport();

  const adjustHeight = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 150)}px`;
  }, []);

  useEffect(() => {
    adjustHeight();
  }, [content, adjustHeight]);

  const handleSend = useCallback(async () => {
    const trimmed = content.trim();
    if (!trimmed) return;
    setContent('');
    await sendMessage(conversationId, trimmed);
  }, [content, conversationId, sendMessage]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend],
  );

  return (
    <div
      className="message-input-container"
      style={keyboardHeight > 0 ? { paddingBottom: `${keyboardHeight}px` } : undefined}
    >
      <div className="message-input-wrapper">
        <textarea
          ref={textareaRef}
          className="message-input"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Envoyer un message..."
          rows={1}
        />
        <button
          className="message-input__send"
          onClick={handleSend}
          disabled={!content.trim()}
          aria-label="Envoyer"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="22" y1="2" x2="11" y2="13" />
            <polygon points="22 2 15 22 11 13 2 9 22 2" />
          </svg>
        </button>
      </div>
    </div>
  );
}
