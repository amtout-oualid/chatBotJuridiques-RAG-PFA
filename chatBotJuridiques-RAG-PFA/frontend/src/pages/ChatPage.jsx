import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Plus,
  Edit2,
  ArrowUp,
  X,
  Loader2,
  FileText,
  Search,
} from 'lucide-react';
import Sidebar from '../components/Sidebar';
import Topbar from '../components/Topbar';
import ChatSessionList from '../components/ChatSessionList';
import FileAttachModal from '../components/FileAttachModal';
import MarkdownRenderer from '../components/MarkdownRenderer';
import { chatService } from '../services/chatService';
import { useModel } from '../context/ModelContext';
import './ChatPage.css';

export default function ChatPage() {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const messagesEndRef = useRef(null);

  const [sessions, setSessions] = useState([]);
  const [messages, setMessages] = useState([]);
  const [currentSession, setCurrentSession] = useState(null);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [loadingSessions, setLoadingSessions] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [attachModalOpen, setAttachModalOpen] = useState(false);
  const [attachedFile, setAttachedFile] = useState(null);
  const { selectedModel } = useModel();

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchQuery.trim()), 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const fetchSessions = useCallback(async (query = '') => {
    setLoadingSessions(true);
    try {
      const res = query
        ? await chatService.searchSessions(query)
        : await chatService.listSessions();
      setSessions(res.data.sessions || []);
    } catch {
      /* ignore */
    } finally {
      setLoadingSessions(false);
    }
  }, []);

  useEffect(() => {
    fetchSessions(debouncedSearch);
  }, [debouncedSearch, fetchSessions]);

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

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, sending]);

  const handleNewChat = async () => {
    try {
      const res = await chatService.createSession();
      await fetchSessions(debouncedSearch);
      setAttachedFile(null);
      navigate(`/chat/${res.data.id}`);
    } catch {
      /* ignore */
    }
  };

  const handleRename = async (id, titre) => {
    try {
      await chatService.updateSession(id, { titre });
      await fetchSessions(debouncedSearch);
      if (currentSession?.id === id) {
        setCurrentSession((s) => (s ? { ...s, titre } : s));
      }
    } catch {
      /* ignore */
    }
  };

  const handleTogglePin = async (session) => {
    try {
      await chatService.updateSession(session.id, { epingle: !session.epingle });
      await fetchSessions(debouncedSearch);
    } catch {
      /* ignore */
    }
  };

  const handleDelete = async (id) => {
    try {
      await chatService.deleteSession(id);
      if (sessionId === id) navigate('/chat');
      await fetchSessions(debouncedSearch);
    } catch {
      /* ignore */
    }
  };

  const handleSend = async () => {
    if (!input.trim() || sending) return;

    let targetId = sessionId;

    if (!targetId) {
      try {
        const res = await chatService.createSession(input.slice(0, 50));
        targetId = res.data.id;
        navigate(`/chat/${targetId}`, { replace: true });
        await fetchSessions(debouncedSearch);
      } catch {
        return;
      }
    }

    const userContent = input.trim();
    const fileId = attachedFile?.id ?? null;
    setInput('');
    setSending(true);

    const tempUserMsg = {
      id: `temp-${Date.now()}`,
      auteur: 'user',
      contenu: userContent,
      attachedFileName: attachedFile?.nom_fichier,
      date_creation: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempUserMsg]);

    try {
      const res = await chatService.sendMessage(targetId, userContent, fileId, selectedModel);
      const userMsg = { ...res.data.user_message };
      if (attachedFile?.nom_fichier) {
        userMsg.attachedFileName = attachedFile.nom_fichier;
      }
      setMessages((prev) => [
        ...prev.filter((m) => m.id !== tempUserMsg.id),
        userMsg,
        res.data.ai_message,
      ]);
      setAttachedFile(null);
      await fetchSessions(debouncedSearch);
      const sessionRes = await chatService.getSession(targetId);
      setCurrentSession(sessionRes.data.session);
    } catch (err) {
      console.error('Send message failed:', err);
      setMessages((prev) => prev.filter((m) => m.id !== tempUserMsg.id));
      setInput(userContent);
      alert('Failed to send message. Please try again.');
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const sessionTitle = currentSession?.titre || 'New Chat';
  const hasMessages = messages.length > 0;
  const isSearching = debouncedSearch.length > 0;

  return (
    <div className="layout-container chat-page-root">
      <Sidebar />
      <div className="secondary-sidebar">
        <button type="button" className="new-chat-btn" onClick={handleNewChat}>
          <span>NEW CHAT</span>
          <Plus size={16} />
        </button>

        <div className="chat-global-search">
          <Search size={16} color="#999" />
          <input
            type="search"
            placeholder="Search chats..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            aria-label="Search all chats and messages"
          />
        </div>

        <div className="chat-session-scroll">
          <ChatSessionList
            sessions={sessions}
            activeSessionId={sessionId}
            loading={loadingSessions}
            isSearching={isSearching}
            onSelect={(id) => navigate(`/chat/${id}`)}
            onRename={handleRename}
            onTogglePin={handleTogglePin}
            onDelete={handleDelete}
          />
        </div>
      </div>

      <div className="main-content">
        <Topbar />
        <div className="chat-area">
          <div className="chat-history">
            {!hasMessages && !sending && (
              <div className="chat-header-center">
                <div className="icon-box">
                  <Edit2 size={24} strokeWidth={1.5} />
                </div>
                <h1>{sessionTitle}</h1>
                <p>
                  I am ready to analyze your legal questions. Attach a document
                  <br />
                  from your database using the + button, then send your prompt.
                </p>
              </div>
            )}

            {messages.map((msg, i) =>
              msg.auteur === 'user' ? (
                <div key={msg.id || i} className="user-message">
                  {msg.attachedFileName && (
                    <span className="attached-file">
                      <FileText size={14} />
                      {msg.attachedFileName}
                    </span>
                  )}
                  <p>{msg.contenu}</p>
                </div>
              ) : (
                <div key={msg.id || i} className="ai-message">
                  <MarkdownRenderer content={msg.contenu} />
                </div>
              ),
            )}

            {sending && (
              <div className="chat-loading">
                <Loader2 size={18} className="spinner" />
                Lexis AI is analyzing...
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="chat-input-container">
            {attachedFile && (
              <div className="attachment-chip">
                <FileText size={14} />
                <span>{attachedFile.nom_fichier}</span>
                <button
                  type="button"
                  onClick={() => setAttachedFile(null)}
                  aria-label="Remove attachment"
                >
                  <X size={14} />
                </button>
              </div>
            )}
            <div className="chat-input-box">
              <Plus
                size={20}
                className="input-icon"
                color="#666"
                onClick={() => setAttachModalOpen(true)}
                aria-label="Attach file from database"
              />
              <input
                type="text"
                placeholder="Message Lexis AI or type '/' for commands..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={sending}
              />
              <button
                type="button"
                className="send-btn"
                onClick={handleSend}
                disabled={!input.trim() || sending}
                aria-label="Send message"
              >
                <ArrowUp size={16} color="#fff" />
              </button>
            </div>
            <div className="disclaimer">
              Lexis AI can make mistakes. Consider verifying critical legal assertions.
            </div>
          </div>
        </div>
      </div>

      <FileAttachModal
        open={attachModalOpen}
        onClose={() => setAttachModalOpen(false)}
        onSelect={setAttachedFile}
        selectedFileId={attachedFile?.id}
      />
    </div>
  );
}
