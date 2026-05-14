import React, { useState, useEffect, useRef } from 'react';
import { editorService } from '../services/editorService';
import { chatService } from '../services/chatService';

export default function EditorPage() {
  // Document State
  const [documents, setDocuments] = useState([]);
  const [activeDocument, setActiveDocument] = useState(null);
  const [latexCode, setLatexCode] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [viewMode, setViewMode] = useState('CODE'); // 'CODE' or 'VISUAL'
  const [pdfUrl, setPdfUrl] = useState('');
  const [isCompiling, setIsCompiling] = useState(false);
  const [compileError, setCompileError] = useState(null);

  // Assistant Chat State
  const [chatMessages, setChatMessages] = useState([
    {
      id: 'welcome',
      role: 'assistant',
      contenu: 'I can assist you with your LaTeX document. Need a template or help fixing a compilation error?'
    }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);
  const chatEndRef = useRef(null);

  // Load documents on mount
  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    try {
      const response = await editorService.listDocuments();
      setDocuments(response.data || []);
      if (response.data && response.data.length > 0 && !activeDocument) {
        handleSelectDocument(response.data[0]);
      }
    } catch (error) {
      console.error('Error fetching documents:', error);
    }
  };

  const handleSelectDocument = async (doc) => {
    try {
      const response = await editorService.getDocument(doc.id);
      setActiveDocument(response.data);
      setLatexCode(response.data.latex_contenu || '');
      setViewMode('CODE');
      setPdfUrl('');
      setCompileError(null);
    } catch (error) {
      console.error('Error loading document detail:', error);
    }
  };

  const handleCreateDocument = async () => {
    const title = prompt("Enter document title:");
    if (!title) return;

    try {
      const defaultLatex = "\\documentclass{article}\\begin{document}\nHello World!\n\\end{document}";
      const response = await editorService.createDocument({
        titre: title,
        latex_contenu: defaultLatex
      });
      setDocuments((prev) => [response.data, ...prev]);
      handleSelectDocument(response.data);
    } catch (error) {
      console.error('Error creating document:', error);
    }
  };

  const handleSave = async () => {
    if (!activeDocument) return;
    setIsSaving(true);
    try {
      await editorService.updateDocument(activeDocument.id, { latex_contenu: latexCode });
    } catch (error) {
      console.error('Error saving document:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCompile = async () => {
    setIsCompiling(true);
    setCompileError(null);
    try {
      await handleSave(); // Auto-save before compiling
      const response = await editorService.compileLaTeX(latexCode);
      if (response.data && response.data.success) {
        setPdfUrl(response.data.pdf_url);
      } else {
        setCompileError(response.data?.message || 'Compilation failed. pdflatex might not be installed on the server.');
      }
    } catch (error) {
      console.error('Error compiling:', error);
      setCompileError('Server error during compilation.');
    } finally {
      setIsCompiling(false);
    }
  };

  const toggleViewMode = async (mode) => {
    setViewMode(mode);
    if (mode === 'VISUAL' && !pdfUrl) {
      await handleCompile();
    }
  };

  // Assistant logic
  const handleSendAssistantMessage = async () => {
    if (!chatInput.trim()) return;

    const userMessage = { id: Date.now(), role: 'user', contenu: chatInput };
    setChatMessages((prev) => [...prev, userMessage]);
    setChatInput('');
    setIsChatLoading(true);

    try {
      // Use the specific aiSuggest endpoint for the editor context
      const prompt = userMessage.contenu;
      const response = await editorService.aiSuggest(latexCode, prompt);
      
      const aiMessage = { 
        id: Date.now() + 1, 
        role: 'assistant', 
        contenu: response.data.ai_message || response.data.suggestion || 'Here is what I suggest.' 
      };
      setChatMessages((prev) => [...prev, aiMessage]);
    } catch (error) {
      console.error('Error with AI assistant:', error);
      setChatMessages((prev) => [...prev, { id: Date.now() + 1, role: 'assistant', contenu: 'Sorry, I encountered an error.' }]);
    } finally {
      setIsChatLoading(false);
    }
  };

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  return (
    <div className="flex-1 flex h-full overflow-hidden w-full relative">
      
      {/* Left Pane: Workspace File List */}
      <aside className="w-64 border-r border-border-subtle bg-surface-bright flex flex-col h-full hidden lg:flex shrink-0">
        <div className="p-4 border-b border-border-subtle flex items-center justify-between">
          <span className="font-label-caps text-label-caps text-secondary uppercase tracking-widest">Workspace</span>
          <button onClick={handleCreateDocument} className="text-secondary hover:text-primary transition-colors">
            <span className="material-symbols-outlined text-[18px]">add</span>
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-2">
          
          <div className="mb-4">
            <div className="flex items-center gap-2 px-2 py-1.5 text-primary hover:bg-surface-muted rounded cursor-pointer group">
              <span className="material-symbols-outlined text-[16px] text-secondary group-hover:text-primary transition-colors">folder_open</span>
              <span className="font-code-sm text-code-sm">My Documents</span>
            </div>
            <div className="ml-4 border-l border-border-subtle pl-2 mt-1 flex flex-col gap-1">
              {documents.map((doc) => (
                <div 
                  key={doc.id}
                  onClick={() => handleSelectDocument(doc)}
                  className={`flex items-center gap-2 px-2 py-1.5 rounded cursor-pointer transition-colors ${
                    activeDocument?.id === doc.id 
                      ? 'text-primary bg-surface-muted font-medium' 
                      : 'text-secondary hover:text-primary hover:bg-surface-muted'
                  }`}
                >
                  <span className="material-symbols-outlined text-[16px]">description</span>
                  <span className="font-code-sm text-code-sm truncate">{doc.titre || 'Untitled.tex'}</span>
                </div>
              ))}
              {documents.length === 0 && (
                <div className="px-2 py-1.5 text-secondary font-code-sm text-xs">No documents found.</div>
              )}
            </div>
          </div>
          
        </div>
      </aside>

      {/* Middle Pane: Document Editor */}
      <section className="flex-1 flex flex-col h-full min-w-0 bg-surface-muted">
        {/* Editor Header */}
        <div className="h-12 border-b border-border-subtle bg-surface-bright flex items-center justify-between px-4 shrink-0">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px] text-secondary">description</span>
            <span className="font-code-sm text-code-sm font-medium">{activeDocument ? activeDocument.titre : 'Select a document'}</span>
            {activeDocument && (
              <>
                <span className={`w-1.5 h-1.5 rounded-full ml-2 ${isSaving ? 'bg-error' : 'bg-outline-variant'}`}></span>
                <span className="font-code-sm text-code-sm text-secondary ml-1">{isSaving ? 'Saving...' : 'Saved'}</span>
              </>
            )}
          </div>
          
          <div className="flex bg-surface-muted border border-border-subtle rounded p-0.5">
            <button 
              onClick={() => toggleViewMode('CODE')}
              className={`px-3 py-1 font-label-caps text-label-caps uppercase tracking-widest transition-colors rounded ${
                viewMode === 'CODE' 
                  ? 'bg-surface-bright border border-border-subtle text-primary shadow-sm' 
                  : 'text-secondary hover:text-primary border border-transparent'
              }`}
            >
              Code View
            </button>
            <button 
              onClick={() => toggleViewMode('VISUAL')}
              className={`px-3 py-1 font-label-caps text-label-caps uppercase tracking-widest transition-colors rounded flex items-center gap-1 ${
                viewMode === 'VISUAL' 
                  ? 'bg-surface-bright border border-border-subtle text-primary shadow-sm' 
                  : 'text-secondary hover:text-primary border border-transparent'
              }`}
            >
              {isCompiling ? (
                <>
                  <span className="material-symbols-outlined text-[14px] animate-spin">refresh</span>
                  Compiling...
                </>
              ) : 'Visual View'}
            </button>
          </div>
        </div>

        {/* Editor Canvas */}
        <div className="flex-1 overflow-hidden flex relative">
          {!activeDocument ? (
            <div className="flex-1 flex items-center justify-center text-secondary font-code-sm">
              Select or create a document to start editing.
            </div>
          ) : viewMode === 'CODE' ? (
            <textarea
              value={latexCode}
              onChange={(e) => setLatexCode(e.target.value)}
              onBlur={handleSave}
              spellCheck="false"
              className="w-full h-full p-6 font-code-md text-code-md bg-surface-container-lowest text-text-charcoal border-none focus:ring-0 resize-none outline-none leading-relaxed"
              placeholder="% Write your LaTeX code here..."
            />
          ) : (
            <div className="flex-1 w-full h-full bg-surface flex flex-col items-center justify-center p-4">
              {compileError ? (
                <div className="bg-error-container text-on-error-container p-6 rounded max-w-lg text-center">
                  <span className="material-symbols-outlined text-4xl mb-4">error</span>
                  <p className="font-body-md font-medium">{compileError}</p>
                </div>
              ) : pdfUrl ? (
                <iframe 
                  src={pdfUrl} 
                  className="w-full h-full border border-border-subtle bg-white shadow-sm"
                  title="PDF Preview"
                />
              ) : (
                <div className="text-secondary flex flex-col items-center">
                  <span className="material-symbols-outlined text-4xl mb-4 animate-spin">refresh</span>
                  <span>Compiling LaTeX document...</span>
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      {/* Right Pane: AI Assistant */}
      <aside className="w-80 border-l border-border-subtle bg-surface-bright flex flex-col h-full hidden xl:flex shrink-0">
        <div className="h-12 border-b border-border-subtle bg-surface-bright flex items-center px-4 shrink-0 justify-between">
          <span className="font-label-caps text-label-caps text-primary uppercase tracking-widest flex items-center gap-2">
            <span className="material-symbols-outlined text-[16px]">smart_toy</span>
            Assistant
          </span>
          <button className="text-secondary hover:text-primary transition-colors">
            <span className="material-symbols-outlined text-[18px]">more_horiz</span>
          </button>
        </div>
        
        <div className="flex-1 flex flex-col p-4 gap-4 overflow-y-auto">
          {chatMessages.map((msg) => (
            <div key={msg.id} className="flex flex-col gap-2">
              <div className={`flex items-center gap-2 ${msg.role === 'user' ? 'justify-end flex-row-reverse' : ''}`}>
                <div className={`w-6 h-6 rounded flex items-center justify-center ${msg.role === 'user' ? 'bg-surface-variant text-primary' : 'bg-primary text-on-primary'}`}>
                  <span className="material-symbols-outlined text-[14px]">
                    {msg.role === 'user' ? 'person' : 'smart_toy'}
                  </span>
                </div>
                <span className="font-code-sm text-code-sm font-medium">
                  {msg.role === 'user' ? 'You' : 'Lexis AI'}
                </span>
              </div>
              <div className={`border border-border-subtle p-3 text-body-md font-body-md text-text-charcoal whitespace-pre-wrap ${
                msg.role === 'user' 
                  ? 'bg-surface rounded-l-lg rounded-br-lg mr-8' 
                  : 'bg-surface-muted rounded-r-lg rounded-bl-lg ml-8'
              }`}>
                {msg.contenu}
              </div>
            </div>
          ))}
          
          {isChatLoading && (
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded bg-primary text-on-primary flex items-center justify-center">
                  <span className="material-symbols-outlined text-[14px]">smart_toy</span>
                </div>
                <span className="font-code-sm text-code-sm font-medium">Lexis AI</span>
              </div>
              <div className="bg-surface-muted border border-border-subtle rounded-r-lg rounded-bl-lg p-3 ml-8 text-body-md font-body-md text-secondary animate-pulse">
                Thinking...
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>
        
        {/* Chat Input */}
        <div className="p-4 border-t border-border-subtle bg-surface-bright shrink-0">
          <div className="relative">
            <textarea 
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendAssistantMessage();
                }
              }}
              className="w-full bg-surface-muted border border-border-subtle rounded-lg pl-3 pr-10 py-2 font-body-md text-body-md focus:outline-none focus:border-primary resize-none h-20 placeholder:text-secondary" 
              placeholder="Ask about the document..." 
              spellCheck="false"
            />
            <button 
              onClick={handleSendAssistantMessage}
              disabled={isChatLoading || !chatInput.trim()}
              className="absolute bottom-3 right-3 text-secondary hover:text-primary transition-colors disabled:opacity-50"
            >
              <span className="material-symbols-outlined text-[20px]">send</span>
            </button>
          </div>
          <div className="flex justify-between items-center mt-2">
            <span className="font-code-sm text-code-sm text-secondary">Enter to send</span>
            <button className="text-secondary hover:text-primary transition-colors flex items-center gap-1">
              <span className="material-symbols-outlined text-[16px]">attach_file</span>
            </button>
          </div>
        </div>
      </aside>

    </div>
  );
}
