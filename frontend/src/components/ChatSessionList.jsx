import { useState, useRef, useEffect } from 'react';
import { MoreVertical, Pin } from 'lucide-react';
import { formatRelativeDate } from '../utils/formatRelativeDate';
import './ChatSessionList.css';

function SessionRow({
  session,
  active,
  onSelect,
  onRename,
  onTogglePin,
  onDelete,
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(session.titre || '');
  const menuRef = useRef(null);
  const rowRef = useRef(null);

  useEffect(() => {
    if (!menuOpen) return undefined;
    const handleClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [menuOpen]);

  const startRename = () => {
    setEditTitle(session.titre || '');
    setEditing(true);
    setMenuOpen(false);
  };

  const confirmRename = () => {
    const trimmed = editTitle.trim();
    if (trimmed && trimmed !== session.titre) {
      onRename(session.id, trimmed);
    }
    setEditing(false);
  };

  const displayTitle = session.titre || 'Untitled';
  const timeLabel = formatRelativeDate(session.date_modif || session.date_creation);

  return (
    <div
      ref={rowRef}
      className={`session-row ${active ? 'session-row--active' : ''}`}
      onClick={() => !editing && onSelect(session.id)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' && !editing) onSelect(session.id);
      }}
    >
      {editing ? (
        <input
          className="session-row__edit"
          value={editTitle}
          onChange={(e) => setEditTitle(e.target.value)}
          onBlur={confirmRename}
          onKeyDown={(e) => {
            if (e.key === 'Enter') confirmRename();
            if (e.key === 'Escape') setEditing(false);
          }}
          onClick={(e) => e.stopPropagation()}
          autoFocus
        />
      ) : (
        <>
          <span className="session-row__title">
            {session.epingle && <Pin size={12} className="session-row__pin" />}
            {displayTitle}
          </span>
          <span className="session-row__meta">
            <span className="session-row__time">{timeLabel}</span>
            <span className="session-row__actions" ref={menuRef}>
              <button
                type="button"
                className="session-row__menu-btn"
                aria-label="Chat options"
                onClick={(e) => {
                  e.stopPropagation();
                  setMenuOpen((o) => !o);
                }}
              >
                <MoreVertical size={16} />
              </button>
              {menuOpen && (
                <div className="session-row__dropdown" role="menu">
                  <button type="button" role="menuitem" onClick={startRename}>
                    Rename
                  </button>
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      onTogglePin(session);
                      setMenuOpen(false);
                    }}
                  >
                    {session.epingle ? 'Unpin' : 'Pin'}
                  </button>
                  <button
                    type="button"
                    role="menuitem"
                    className="danger"
                    onClick={() => {
                      onDelete(session.id);
                      setMenuOpen(false);
                    }}
                  >
                    Remove
                  </button>
                </div>
              )}
            </span>
          </span>
        </>
      )}
    </div>
  );
}

export default function ChatSessionList({
  sessions,
  activeSessionId,
  loading,
  isSearching,
  onSelect,
  onRename,
  onTogglePin,
  onDelete,
}) {
  const pinned = sessions.filter((s) => s.epingle);
  const recent = sessions.filter((s) => !s.epingle);

  const renderSection = (title, items) => {
    if (items.length === 0) return null;
    return (
      <div className="session-list-section">
        <div className="session-list-section__title">{title}</div>
        <div className="session-list-section__rows">
          {items.map((s) => (
            <SessionRow
              key={s.id}
              session={s}
              active={activeSessionId === s.id}
              onSelect={onSelect}
              onRename={onRename}
              onTogglePin={onTogglePin}
              onDelete={onDelete}
            />
          ))}
        </div>
      </div>
    );
  };

  if (loading) {
    return <p className="session-list-empty">Loading chats...</p>;
  }

  if (sessions.length === 0) {
    return (
      <p className="session-list-empty">
        {isSearching ? 'No chats match your search.' : 'No chats yet. Start a new conversation.'}
      </p>
    );
  }

  if (isSearching) {
    return renderSection('RESULTS', sessions);
  }

  return (
    <>
      {renderSection('PINNED', pinned)}
      {renderSection('RECENT', recent)}
    </>
  );
}
