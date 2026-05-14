import React, { useState, useEffect, useRef } from 'react';
import { chatService } from '../services/chatService';
import { fileService } from '../services/fileService';

export default function ChatPage() {
  // Chat State
  const [sessions, setSessions] = useState([]);
  const [activeSession, setActiveSession] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  // Modal & Context State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [databaseFiles, setDatabaseFiles] = useState([]);
  const [activeContextFile, setActiveContextFile] = useState(null);
  const [loadingFiles, setLoadingFiles] = useState(false);

  // Load Sessions on mount
  useEffect(() => {
    fetchSessions();
  }, []);

  // Fetch all chat sessions
  const fetchSessions = async () => {
    try {
      const response = await chatService.listSessions();
      setSessions(response.data || []);
    } catch (error) {
      console.error('Error fetching sessions:', error);
    }
  };

  // Load messages when activeSession changes
  useEffect(() => {
    if (activeSession) {
      fetchMessages(activeSession.id);
    } else {
      setMessages([]);
    }
  }, [activeSession]);

  const fetchMessages = async (sessionId) => {
    try {
      const response = await chatService.getSession(sessionId);
      // The backend returns session metadata + messages
      if (response.data && response.data.messages) {
        setMessages(response.data.messages);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  // Auto-scroll to bottom of messages
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const handleNewChat = async () => {
    try {
      const response = await chatService.createSession('New Conversation');
      const newSession = response.data;
      setSessions((prev) => [newSession, ...prev]);
      setActiveSession(newSession);
      setActiveContextFile(null);
    } catch (error) {
      console.error('Error creating new chat:', error);
    }
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    let currentSessionId = activeSession?.id;

    // If no active session, create one first
    if (!currentSessionId) {
      try {
        const title = inputValue.substring(0, 30) + (inputValue.length > 30 ? '...' : '');
        const response = await chatService.createSession(title);
        currentSessionId = response.data.id;
        setActiveSession(response.data);
        setSessions((prev) => [response.data, ...prev]);
      } catch (error) {
        console.error('Error creating session before sending message:', error);
        return;
      }
    }

    // Prepare message (include context hint if a file is selected)
    let contentToSend = inputValue;
    if (activeContextFile) {
      // Depending on backend RAG implementation, passing the file context in the prompt might be required
      contentToSend = `[Context Document: ${activeContextFile.nom_fichier}]\n${inputValue}`;
    }

    // Optimistically update UI
    const tempUserMsg = { id: Date.now(), role: 'user', contenu: inputValue };
    setMessages((prev) => [...prev, tempUserMsg]);
    setInputValue('');
    setLoading(true);

    try {
      // The endpoint returns { user_message, ai_message }
      const response = await chatService.sendMessage(currentSessionId, contentToSend);
      if (response.data && response.data.ai_message) {
        // Refresh the whole message thread to get proper IDs from DB
        fetchMessages(currentSessionId);
      }
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setLoading(false);
    }
  };

  // Open Modal and load files
  const handleOpenModal = async () => {
    setIsModalOpen(true);
    setLoadingFiles(true);
    try {
      const response = await fileService.listFiles();
      setDatabaseFiles(response.data || []);
    } catch (error) {
      console.error('Error fetching files for modal:', error);
    } finally {
      setLoadingFiles(false);
    }
  };

  const handleSelectFile = (file) => {
    setActiveContextFile(file);
    setIsModalOpen(false);
  };

  return (
    <div className="flex-1 flex h-full overflow-hidden relative">
      {/* Secondary Sidebar: Chat History */}
      <aside className="w-64 md:w-72 bg-surface-container-low border-r border-border-subtle flex flex-col h-full flex-shrink-0">
        <div className="p-4 border-b border-border-subtle">
          <button 
            onClick={handleNewChat}
            className="w-full bg-primary text-on-primary py-2.5 px-4 rounded font-label-caps text-label-caps flex items-center justify-between hover:opacity-90 transition-opacity uppercase tracking-widest"
          >
            <span>New Chat</span>
            <span className="material-symbols-outlined text-sm">add</span>
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          <div>
            <h3 className="font-label-caps text-label-caps text-secondary mb-3 px-2 uppercase tracking-widest">Conversations</h3>
            <ul className="space-y-1">
              {sessions.map((session) => (
                <li key={session.id}>
                  <button 
                    onClick={() => setActiveSession(session)}
                    className={`w-full text-left block px-3 py-2 rounded font-medium transition-colors truncate border ${
                      activeSession?.id === session.id 
                        ? 'bg-surface-muted text-primary border-border-subtle' 
                        : 'text-text-charcoal border-transparent hover:bg-surface-muted hover:border-border-subtle'
                    }`}
                  >
                    {session.titre || 'Untitled Discussion'}
                  </button>
                </li>
              ))}
              {sessions.length === 0 && (
                <li className="text-secondary text-sm px-2">No history</li>
              )}
            </ul>
          </div>
        </div>
      </aside>

      {/* Main Chat Area */}
      <main className="flex-1 flex flex-col bg-surface-container-lowest relative h-full">
        {/* Top Header */}
        <header className="h-16 flex justify-between items-center px-8 z-40 bg-surface dark:bg-surface border-b border-border-subtle dark:border-outline-variant flex-shrink-0">
          <div className="flex items-center gap-4">
            <span className="font-headline-md text-headline-md text-primary dark:text-primary font-black tracking-tight">Lexis Legal</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="relative hidden lg:block">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-secondary text-sm">search</span>
              <input className="pl-9 pr-4 py-1.5 bg-surface-muted border border-border-subtle rounded focus:outline-none focus:border-primary text-sm font-body-md w-64 placeholder:text-secondary" placeholder="Search context..." type="text"/>
            </div>
          </div>
        </header>

        {/* Chat Messages Scroll Area */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8">
          <div className="max-w-3xl mx-auto w-full space-y-8 pb-20">
            
            {/* Empty State / Welcome */}
            {(!messages || messages.length === 0) && (
              <div className="flex flex-col items-center justify-center text-center py-12">
                <div className="w-16 h-16 bg-surface-muted border border-border-subtle rounded-full flex items-center justify-center mb-6">
                  <span className="material-symbols-outlined text-primary text-3xl">gavel</span>
                </div>
                <h2 className="font-headline-md text-headline-md text-primary mb-2">
                  {activeSession ? activeSession.titre : 'Start a New Legal Chat'}
                </h2>
                <p className="font-body-md text-body-md text-secondary max-w-md">
                  I am ready to analyze documents. You can paste clauses or use the + button to import a file from your database for RAG context.
                </p>
              </div>
            )}

            {/* Messages Loop */}
            {messages.map((msg, index) => (
              <div key={msg.id || index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {msg.role === 'user' ? (
                  <div className="bg-surface-muted border border-border-subtle p-5 rounded-lg max-w-[85%] sm:max-w-2xl text-primary font-body-md whitespace-pre-wrap">
                    {msg.contenu}
                  </div>
                ) : (
                  <div className="py-4 pr-6 pl-2 max-w-[95%] sm:max-w-3xl text-primary font-body-md leading-relaxed whitespace-pre-wrap">
                    {msg.contenu}
                  </div>
                )}
              </div>
            ))}
            
            {loading && (
              <div className="flex justify-start">
                <div className="py-4 pr-6 pl-2 text-secondary font-body-md animate-pulse">
                  Lexis AI is thinking...
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Bottom Input Bar */}
        <div className="p-4 md:p-6 w-full border-t border-border-subtle bg-surface-container-lowest">
          <div className="max-w-3xl mx-auto w-full relative">
            
            {/* Active Context Chip */}
            {activeContextFile && (
              <div className="absolute -top-10 left-0 bg-surface-variant border border-border-subtle text-primary text-xs px-3 py-1.5 rounded-full flex items-center gap-2 shadow-sm">
                <span className="material-symbols-outlined text-sm">description</span>
                <span className="font-medium truncate max-w-xs">{activeContextFile.nom_fichier}</span>
                <button 
                  onClick={() => setActiveContextFile(null)}
                  className="hover:text-error transition-colors ml-1"
                >
                  <span className="material-symbols-outlined text-sm leading-none">close</span>
                </button>
              </div>
            )}

            <div className="flex items-end gap-2 bg-surface border border-border-subtle rounded-lg focus-within:border-primary transition-colors p-2 shadow-sm">
              {/* Attachment Action */}
              <button 
                onClick={handleOpenModal}
                className="p-2 text-secondary hover:text-primary transition-colors rounded hover:bg-surface-muted shrink-0"
              >
                <span className="material-symbols-outlined text-xl leading-none">add_circle</span>
              </button>
              
              {/* Input Field */}
              <textarea 
                className="flex-1 bg-transparent border-none focus:ring-0 resize-none font-body-md text-body-md p-2 max-h-32 placeholder:text-secondary focus:outline-none" 
                placeholder="Message Lexis AI..." 
                rows="1"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
              />
              
              {/* Send Action */}
              <button 
                onClick={handleSendMessage}
                disabled={loading || !inputValue.trim()}
                className="p-2 bg-primary text-on-primary hover:opacity-90 disabled:opacity-50 transition-opacity rounded shrink-0 flex items-center justify-center"
              >
                <span className="material-symbols-outlined text-lg leading-none">arrow_upward</span>
              </button>
            </div>
            <div className="text-center mt-2">
              <span className="font-code-sm text-code-sm text-secondary text-xs">Lexis AI can make mistakes. Consider verifying critical legal assertions.</span>
            </div>
          </div>
        </div>
      </main>

      {/* Import Modal Overlay */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-primary/50 flex items-center justify-center z-[100] p-4 backdrop-blur-sm">
          <div className="bg-surface border border-border-subtle rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] flex flex-col overflow-hidden">
            <div className="p-4 border-b border-border-subtle flex justify-between items-center bg-surface-bright">
              <h2 className="font-headline-md text-headline-md text-primary">Import Document for Context</h2>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-secondary hover:text-primary transition-colors p-1"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 bg-surface-container-lowest">
              {loadingFiles ? (
                <div className="text-center py-8 text-secondary font-code-sm">Loading your database files...</div>
              ) : databaseFiles.length === 0 ? (
                <div className="text-center py-8 text-secondary font-code-sm">No files found. Please upload files in the Database page first.</div>
              ) : (
                <ul className="space-y-2">
                  {databaseFiles.map(file => (
                    <li key={file.id}>
                      <button 
                        onClick={() => handleSelectFile(file)}
                        className="w-full text-left flex items-center gap-4 p-3 rounded border border-border-subtle hover:border-primary hover:bg-surface-muted transition-colors"
                      >
                        <div className="w-10 h-10 bg-surface-bright border border-border-subtle rounded flex items-center justify-center text-secondary shrink-0">
                          <span className="material-symbols-outlined">description</span>
                        </div>
                        <div className="flex-1 overflow-hidden">
                          <div className="font-body-md text-primary truncate font-medium">{file.nom_fichier}</div>
                          <div className="font-code-sm text-secondary text-xs mt-1">Select to use as RAG context</div>
                        </div>
                        <span className="material-symbols-outlined text-secondary opacity-0 group-hover:opacity-100 transition-opacity">arrow_forward</span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
