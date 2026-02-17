import { useRef, useCallback, useState, useEffect } from 'react';

const BOTTOM_THRESHOLD = 100;

interface UseAutoScrollResult {
  containerRef: React.RefObject<HTMLDivElement | null>;
  showNewMessageBadge: boolean;
  scrollToBottom: () => void;
}

export function useAutoScroll(_deps: unknown[]): UseAutoScrollResult {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [showNewMessageBadge, setShowNewMessageBadge] = useState(false);
  const isNearBottomRef = useRef(true);
  // After one auto-scroll, block further auto-scrolls until user scrolls to bottom
  const hasAutoScrolledRef = useRef(false);

  const checkNearBottom = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    isNearBottomRef.current = distanceFromBottom < BOTTOM_THRESHOLD;
    if (isNearBottomRef.current) {
      setShowNewMessageBadge(false);
      hasAutoScrolledRef.current = false; // User scrolled to bottom — ready for next auto-scroll
    }
  }, []);

  const scrollToBottom = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
    setShowNewMessageBadge(false);
    hasAutoScrolledRef.current = false;
  }, []);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    el.addEventListener('scroll', checkNearBottom, { passive: true });
    return () => el.removeEventListener('scroll', checkNearBottom);
  }, [checkNearBottom]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    let rafId: number | null = null;

    const observer = new MutationObserver((mutations) => {
      if (!isNearBottomRef.current) {
        setShowNewMessageBadge(true);
        return;
      }

      const hasNewMessage = mutations.some(
        (m) => m.type === 'childList' && m.target === el && m.addedNodes.length > 0,
      );

      if (hasNewMessage && hasAutoScrolledRef.current) {
        // Already auto-scrolled once — show badge, don't disrupt reading
        setShowNewMessageBadge(true);
        return;
      }

      // Auto-scroll: first new message, or content size change (image/audio load)
      if (rafId !== null) cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        const container = containerRef.current;
        if (container) {
          container.scrollTop = container.scrollHeight;
          if (hasNewMessage) {
            hasAutoScrolledRef.current = true;
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
