import { useRef, useCallback, useState, useEffect } from 'react';

const BOTTOM_THRESHOLD = 100;
// After auto-scrolling for a new message, don't auto-scroll again for this duration.
// Lets the user read the first response without being disrupted by rapid follow-ups.
const AUTO_SCROLL_COOLDOWN = 2000;

interface UseAutoScrollResult {
  containerRef: React.RefObject<HTMLDivElement | null>;
  showNewMessageBadge: boolean;
  scrollToBottom: () => void;
}

export function useAutoScroll(_deps: unknown[]): UseAutoScrollResult {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [showNewMessageBadge, setShowNewMessageBadge] = useState(false);
  const isNearBottomRef = useRef(true);
  const lastAutoScrollRef = useRef(0);

  const checkNearBottom = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    isNearBottomRef.current = distanceFromBottom < BOTTOM_THRESHOLD;
    if (isNearBottomRef.current) {
      setShowNewMessageBadge(false);
      lastAutoScrollRef.current = 0; // Reset cooldown when user scrolls to bottom
    }
  }, []);

  const scrollToBottom = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
    setShowNewMessageBadge(false);
    lastAutoScrollRef.current = 0; // Reset cooldown
  }, []);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    el.addEventListener('scroll', checkNearBottom, { passive: true });
    return () => el.removeEventListener('scroll', checkNearBottom);
  }, [checkNearBottom]);

  // MutationObserver watches actual DOM changes (new messages, content resizing).
  // For new message bubbles: auto-scroll only the first one, then enter cooldown.
  // For content changes (images loading, etc.): always scroll if near bottom.
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    let rafId: number | null = null;

    const observer = new MutationObserver((mutations) => {
      if (!isNearBottomRef.current) {
        setShowNewMessageBadge(true);
        return;
      }

      // Detect new message bubbles (direct children of container)
      const hasNewMessage = mutations.some(
        (m) => m.type === 'childList' && m.target === el && m.addedNodes.length > 0,
      );

      if (hasNewMessage) {
        const now = Date.now();
        if (now - lastAutoScrollRef.current < AUTO_SCROLL_COOLDOWN) {
          // In cooldown — show badge instead of disrupting reading
          setShowNewMessageBadge(true);
          return;
        }
      }

      // Auto-scroll: first new message in a burst, or content size change
      if (rafId !== null) cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        const container = containerRef.current;
        if (container) {
          container.scrollTop = container.scrollHeight;
          if (hasNewMessage) {
            lastAutoScrollRef.current = Date.now();
          }
        }
        rafId = null;
      });
    });

    observer.observe(el, { childList: true, subtree: true });

    return () => {
      observer.disconnect();
      if (rafId !== null) cancelAnimationFrame(rafId);
    };
  }, []);

  return { containerRef, showNewMessageBadge, scrollToBottom };
}
