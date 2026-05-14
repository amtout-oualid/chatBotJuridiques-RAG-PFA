import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Plus,
  Send,
  Pin,
  Trash2,
  Edit3,
  Check,
  X,
  Loader2,
  MessageSquare,
} from 'lucide-react';
import { chatService } from '../services/chatService';
import './ChatPage.css';

export default function ChatPage() {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const [sessions, setSessions] = useState([]);
  const [messages, setMessages] = useState([]);
  const [currentSession, setCurrentSession] = useState(null);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [loadingSessions, setLoadingSessions] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [editTitle, setEditTitle] = useState('');

  // Load sessions
  const loadSessions = useCallback(async () => {
    try {
      const res = await chatService.listSessions();
      setSessions(res.data.sessions || []);
    } catch {
      /* ignore */
    } finally {
      setLoadingSessions(false);
    }
  }, []);

  useEffect(() => {
    loadSessions();
  }, [loadSessions]);

  // Load messages when sessionId changes
  useEffect(() => {
    if (!sessionId) {
      setMessages([]);
      setCurrentSession(null);
      return;
    }
    (async () => {
      try {
        const res = await chatService.getSession(sessionId);
        setMessages(res.data.messages || []);
        setCurrentSession(res.data.session);
      } catch {
        navigate('/chat');
      }
    })();
  }, [sessionId, navigate]);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Create new session
  const handleNewChat = async () => {
    try {
      const res = await chatService.createSession();
      await loadSessions();
      navigate(`/chat/${res.data.id}`);
    } catch {
      /* ignore */
    }
  };

  // Send message
  const handleSend = async () => {
    if (!input.trim() || sending) return;

    let targetId = sessionId;

    // Auto-create session if none selected
    if (!targetId) {
      try {
        const res = await chatService.createSession(input.slice(0, 50));
        targetId = res.data.id;
        navigate(`/chat/${targetId}`, { replace: true });
        await loadSessions();
      } catch {
        return;
      }
    }

    const userContent = input.trim();
    setInput('');
    setSending(true);

    // Optimistic UI — add user message immediately
    const tempUserMsg = {
      id: `temp-${Date.now()}`,
      auteur: 'user',
      contenu: userContent,
      date_creation: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempUserMsg]);

    try {
      const res = await chatService.sendMessage(targetId, userContent);
      // Replace temp with real messages
      setMessages((prev) => [
        ...prev.filter((m) => m.id !== tempUserMsg.id),
        res.data.user_message,
        res.data.ai_message,
      ]);
      loadSessions();
    } catch {
      setMessages((prev) => prev.filter((m) => m.id !== tempUserMsg.id));
      setInput(userContent);
    } finally {
      setSending(false);
      inputRef.current?.focus();
    }
  };

  // Key handler
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Delete session
  const handleDelete = async (id) => {
    try {
      await chatService.deleteSession(id);
      setSessions((prev) => prev.filter((s) => s.id !== id));
      if (sessionId === id) navigate('/chat');
    } catch {
      /* ignore */
    }
  };

  // Toggle pin
  const handleTogglePin = async (session) => {
    try {
      await chatService.updateSession(session.id, {
        epingle: !session.epingle,
      });
      loadSessions();
    } catch {
      /* ignore */
    }
  };

  // Rename
  const handleRename = async (id) => {
    if (!editTitle.trim()) return;
    try {
      await chatService.updateSession(id, { titre: editTitle.trim() });
      setEditingId(null);
      loadSessions();
    } catch {
      /* ignore */
    }
  };

  const pinned = sessions.filter((s) => s.epingle);
  const recent = sessions.filter((s) => !s.epingle);

  return (
    <div className="chat-page">
      {/* ── Sidebar ── */}
      <aside className="chat-sidebar" id="chat-sidebar">
        <div className="chat-sidebar__header">
          <h2 className="chat-sidebar__title">SESSIONS</h2>
          <button
            className="chat-sidebar__new"
            onClick={handleNewChat}
            title="Nouvelle discussion"
            id="new-chat-btn"
          >
            <Plus size={18} />
          </button>
        </div>

        <div className="chat-sidebar__list">
          {pinned.length > 0 && (
            <>
              <span className="chat-sidebar__label">ÉPINGLÉES</span>
              {pinned.map((s) => (
                <SessionItem
                  key={s.id}
                  session={s}
                  active={sessionId === s.id}
                  editingId={editingId}
                  editTitle={editTitle}
                  onSelect={() => navigate(`/chat/${s.id}`)}
                  onDelete={() => handleDelete(s.id)}
                  onPin={() => handleTogglePin(s)}
                  onStartEdit={() => {
                    setEditingId(s.id);
                    setEditTitle(s.titre || '');
                  }}
                  onCancelEdit={() => setEditingId(null)}
                  onConfirmEdit={() => handleRename(s.id)}
                  onEditChange={setEditTitle}
                />
              ))}
            </>
          )}

          {recent.length > 0 && (
            <>
              <span className="chat-sidebar__label">RÉCENTES</span>
              {recent.map((s) => (
                <SessionItem
                  key={s.id}
                  session={s}
                  active={sessionId === s.id}
                  editingId={editingId}
                  editTitle={editTitle}
                  onSelect={() => navigate(`/chat/${s.id}`)}
                  onDelete={() => handleDelete(s.id)}
                  onPin={() => handleTogglePin(s)}
                  onStartEdit={() => {
                    setEditingId(s.id);
                    setEditTitle(s.titre || '');
                  }}
                  onCancelEdit={() => setEditingId(null)}
                  onConfirmEdit={() => handleRename(s.id)}
                  onEditChange={setEditTitle}
                />
              ))}
            </>
          )}

          {!loadingSessions && sessions.length === 0 && (
            <div className="chat-sidebar__empty">
              <MessageSquare size={24} opacity={0.3} />
              <span>Aucune discussion</span>
            </div>
          )}
        </div>
      </aside>

      {/* ── Chat Area ── */}
      <div className="chat-main">
        {/* Messages */}
        <div className="chat-messages" id="chat-messages">
          {!sessionId && messages.length === 0 && (
            <div className="chat-empty">
              <div className="chat-empty__icon">⚖</div>
              <h2 className="chat-empty__title">
                Assistant Juridique IA
              </h2>
              <p className="chat-empty__sub">
                Posez une question juridique pour commencer une nouvelle discussion.
              </p>
            </div>
          )}

          {messages.map((msg, i) => (
            <div
              key={msg.id || i}
              className={`chat-msg chat-msg--${msg.auteur} fade-in`}
            >
              <div className="chat-msg__avatar">
                {msg.auteur === 'user' ? 'U' : '⚖'}
              </div>
              <div className="chat-msg__body">
                <span className="chat-msg__role">
                  {msg.auteur === 'user' ? 'Vous' : 'Lexis AI'}
                </span>
                <div className="chat-msg__content">
                  {msg.contenu}
                </div>
              </div>
            </div>
          ))}

          {sending && (
            <div className="chat-msg chat-msg--ia chat-msg--loading fade-in">
              <div className="chat-msg__avatar">⚖</div>
              <div className="chat-msg__body">
                <span className="chat-msg__role">Lexis AI</span>
                <div className="chat-msg__content">
                  <Loader2 size={18} className="chat-msg__spinner" />
                  Analyse en cours...
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="chat-input-bar" id="chat-input-bar">
          <div className="chat-input-wrapper">
            <textarea
              ref={inputRef}
              className="chat-input"
              placeholder="Posez votre question juridique..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              rows={1}
              disabled={sending}
              id="chat-input"
            />
            <button
              className="chat-send-btn"
              onClick={handleSend}
              disabled={!input.trim() || sending}
              title="Envoyer"
              id="chat-send-btn"
            >
              <Send size={18} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Session Item Component ── */
function SessionItem({
  session,
  active,
  editingId,
  editTitle,
  onSelect,
  onDelete,
  onPin,
  onStartEdit,
  onCancelEdit,
  onConfirmEdit,
  onEditChange,
}) {
  const isEditing = editingId === session.id;

  return (
    <div
      className={`session-item ${active ? 'session-item--active' : ''}`}
      onClick={!isEditing ? onSelect : undefined}
    >
      {isEditing ? (
        <div className="session-item__edit" onClick={(e) => e.stopPropagation()}>
          <input
            type="text"
            value={editTitle}
            onChange={(e) => onEditChange(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && onConfirmEdit()}
            autoFocus
            className="session-item__edit-input"
          />
          <button onClick={onConfirmEdit} title="Confirmer">
            <Check size={14} />
          </button>
          <button onClick={onCancelEdit} title="Annuler">
            <X size={14} />
          </button>
        </div>
      ) : (
        <>
          <span className="session-item__title">
            {session.epingle && <Pin size={12} className="session-item__pin-icon" />}
            {session.titre || 'Nouvelle Discussion'}
          </span>
          <div
            className="session-item__actions"
            onClick={(e) => e.stopPropagation()}
          >
            <button onClick={onStartEdit} title="Renommer">
              <Edit3 size={13} />
            </button>
            <button onClick={onPin} title={session.epingle ? 'Désépingler' : 'Épingler'}>
              <Pin size={13} />
            </button>
            <button onClick={onDelete} title="Supprimer">
              <Trash2 size={13} />
            </button>
          </div>
        </>
      )}
    </div>
  );
}
