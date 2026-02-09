import { useState, useCallback } from 'react';
import { useConversationStore } from '../../stores/conversationStore';
import { useUIStore } from '../../stores/uiStore';
import ContextMenu from './ContextMenu';
import type { Conversation } from '../../types/conversation';
import './ConversationItem.css';

function formatRelativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "a l'instant";
  if (minutes < 60) return `il y a ${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `il y a ${hours}h`;
  const days = Math.floor(hours / 24);
  return `il y a ${days}j`;
}

interface ConversationItemProps {
  conversation: Conversation;
}

export default function ConversationItem({ conversation }: ConversationItemProps) {
  const activeId = useConversationStore((s) => s.activeId);
  const setActive = useConversationStore((s) => s.setActive);
  const isMobile = useUIStore((s) => s.isMobile);
  const setSidebarOpen = useUIStore((s) => s.setSidebarOpen);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null);

  const handleClick = useCallback(() => {
    setActive(conversation.jid);
    if (isMobile) {
      setSidebarOpen(false);
    }
  }, [conversation.jid, setActive, isMobile, setSidebarOpen]);

  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY });
  }, []);

  const isActive = activeId === conversation.jid;

  return (
    <>
      <div
        className={`conversation-item ${isActive ? 'conversation-item--active' : ''}`}
        onClick={handleClick}
        onContextMenu={handleContextMenu}
      >
        <h4 className="conversation-item__name">{conversation.name}</h4>
        <p className="conversation-item__time">{formatRelativeTime(conversation.lastActivity)}</p>
      </div>
      {contextMenu && (
        <ContextMenu
          conversationId={conversation.jid}
          conversationName={conversation.name}
          x={contextMenu.x}
          y={contextMenu.y}
          onClose={() => setContextMenu(null)}
        />
      )}
    </>
  );
}
