import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import './ChatWidget.css';
import ChatWindow from './ChatWindow';

const BUTTON_SIZE = 56;
const BUTTON_MARGIN = 20;
// extra offset from right edge so the button sits a bit left of the very edge on first load
const DEFAULT_RIGHT_EXTRA = 60;
const CHAT_WIDTH = 360;
const STORAGE_KEY = 'rojgarSathiChatPos';

const clamp = (v, min, max) => Math.min(Math.max(v, min), max);

const ChatWidget = () => {
  const [open, setOpen] = useState(false);
  const [unread, setUnread] = useState(0);

  const [pos, setPos] = useState(() => {
    if (typeof window === 'undefined') return { left: 0, top: 0 };
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const p = JSON.parse(saved);
        return {
          left: clamp(p.left, 8, window.innerWidth - BUTTON_SIZE - 8),
          top: clamp(p.top, 8, window.innerHeight - BUTTON_SIZE - 8),
        };
      }
    } catch (e) {}
    return {
      left: window.innerWidth - BUTTON_SIZE - BUTTON_MARGIN - DEFAULT_RIGHT_EXTRA,
      top: window.innerHeight - BUTTON_SIZE - BUTTON_MARGIN,
    };
  });

  const dragRef = useRef({ dragging: false, startX: 0, startY: 0, startLeft: 0, startTop: 0, moved: false });
  const [dragging, setDragging] = useState(false);

  useEffect(() => {
    const onResize = () => {
      setPos((p) => ({
        left: clamp(p.left, 8, window.innerWidth - BUTTON_SIZE - 8),
        top: clamp(p.top, 8, window.innerHeight - BUTTON_SIZE - 8),
      }));
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  useEffect(() => {
    try {
      if (typeof window !== 'undefined') localStorage.setItem(STORAGE_KEY, JSON.stringify(pos));
    } catch (e) {}
  }, [pos]);

  const onPointerMove = (e) => {
    if (!dragRef.current.dragging) return;
    const dx = e.clientX - dragRef.current.startX;
    const dy = e.clientY - dragRef.current.startY;
    if (Math.abs(dx) > 4 || Math.abs(dy) > 4) dragRef.current.moved = true;
    const newLeft = clamp(dragRef.current.startLeft + dx, 8, window.innerWidth - BUTTON_SIZE - 8);
    const newTop = clamp(dragRef.current.startTop + dy, 8, window.innerHeight - BUTTON_SIZE - 8);
    setPos({ left: newLeft, top: newTop });
    setDragging(true);
  };

  const onPointerUp = (e) => {
    if (!dragRef.current.dragging) return;
    dragRef.current.dragging = false;
    setDragging(false);
    window.removeEventListener('pointermove', onPointerMove);
    window.removeEventListener('pointerup', onPointerUp);
    const dx = e.clientX - dragRef.current.startX;
    const dy = e.clientY - dragRef.current.startY;
    const finalLeft = clamp(dragRef.current.startLeft + dx, 8, window.innerWidth - BUTTON_SIZE - 8);
    const finalTop = clamp(dragRef.current.startTop + dy, 8, window.innerHeight - BUTTON_SIZE - 8);
    setPos({ left: finalLeft, top: finalTop });
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ left: finalLeft, top: finalTop }));
    } catch (err) {}
  };

  const onPointerDown = (e) => {
    e.preventDefault();
    dragRef.current.dragging = true;
    dragRef.current.startX = e.clientX;
    dragRef.current.startY = e.clientY;
    dragRef.current.startLeft = pos.left;
    dragRef.current.startTop = pos.top;
    dragRef.current.moved = false;
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
  };

  const onButtonClick = (e) => {
    if (dragRef.current.moved) {
      dragRef.current.moved = false;
      return;
    }
    setOpen((o) => {
      const next = !o;
      if (next) setUnread(0);
      return next;
    });
  };

  const portalStyle = { position: 'absolute', bottom: `${BUTTON_SIZE + 12}px`, zIndex: 100000 };
  if (typeof window !== 'undefined') {
    if (pos.left + CHAT_WIDTH > window.innerWidth) portalStyle.right = 0; else portalStyle.left = 0;
  } else {
    portalStyle.left = 0;
  }

  const content = (
    <div
      className={`rojgarsathi-chat-widget ${open ? 'open' : 'closed'} ${dragging ? 'dragging' : ''}`}
      aria-live="polite"
      style={{ left: `${pos.left}px`, top: `${pos.top}px` }}
    >
      {open && (
        <div className="chat-window-portal" style={portalStyle}>
          <ChatWindow visible={open} onClose={() => setOpen(false)} onNewMessage={() => { if (!open) setUnread((u) => u + 1); }} />
        </div>
      )}

      <button
        className="chat-toggle-btn"
        aria-label={open ? 'Close RojgarSathi chat' : 'Open RojgarSathi chat'}
        onPointerDown={onPointerDown}
        onClick={onButtonClick}
      >
        {/* Robot icon */}
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
          <rect x="3" y="6" width="18" height="11" rx="2" fill="#ffffff" />
          <rect x="8" y="3" width="8" height="4" rx="1" fill="#ffffff" />
          <circle cx="9.5" cy="11" r="1" fill="#0b5ed7" />
          <circle cx="14.5" cy="11" r="1" fill="#0b5ed7" />
          <rect x="10" y="13.5" width="4" height="1" rx="0.5" fill="#0b5ed7" />
        </svg>

        {unread > 0 && <span className="chat-badge" aria-hidden>{unread > 99 ? '99+' : unread}</span>}
      </button>
    </div>
  );

  if (typeof document !== 'undefined' && document.body) {
    return ReactDOM.createPortal(content, document.body);
  }
  return content;
};

export default ChatWidget;
