import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Plus, 
  Folder, 
  FileCode, 
  Settings, 
  FileText, 
  MoreHorizontal, 
  Send, 
  Paperclip,
  ArrowLeft,
  Trash2,
  Upload
} from 'lucide-react';
import Sidebar from '../components/Sidebar';
import { editorService } from '../services/editorService';
import { fileService } from '../services/fileService';
import { chatService } from '../services/chatService'; // For AI chat if needed or editorService.aiSuggest
import './EditorPage.css';

const EditorPage = () => {
  const { documentId } = useParams();
  const navigate = useNavigate();

  // Documents & State A
  const [documents, setDocuments] = useState([]);
  const [loadingDocs, setLoadingDocs] = useState(true);
  const [activeMenuId, setActiveMenuId] = useState(null);
  const [activeFileMenuId, setActiveFileMenuId] = useState(null);

  // Editor & State B
  const [currentDoc, setCurrentDoc] = useState(null);
  const [code, setCode] = useState('');
  const [saving, setSaving] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  
  // View mode
  const [viewMode, setViewMode] = useState('code'); // 'code' | 'visual'
  const [compileResult, setCompileResult] = useState(null);
  const [compiling, setCompiling] = useState(false);
  const [pdfBlobUrl, setPdfBlobUrl] = useState(null);

  // AI Assistant
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiMessages, setAiMessages] = useState([
    {
      role: 'ai',
      content: 'I noticed you are working on a LaTeX document. Would you like me to help write sections, suggest citations, or fix formatting errors?'
    }
  ]);
  
  // Uploaded Files for State B
  const [uploadedFiles, setUploadedFiles] = useState([]);

  // Ref for auto-save
  const autoSaveTimer = useRef(null);

  // Inline editing state
  const [editingDocId, setEditingDocId] = useState(null);
  const [editingDocTitle, setEditingDocTitle] = useState('');
  
  const [editingFileId, setEditingFileId] = useState(null);
  const [editingFileName, setEditingFileName] = useState('');

  const loadDocuments = useCallback(async () => {
    try {
      const res = await editorService.listDocuments();
      setDocuments(res.data.documents || []);
    } catch {
      // ignore
    } finally {
      setLoadingDocs(false);
    }
  }, []);

  useEffect(() => {
    loadDocuments();
  }, [loadDocuments]);

  // Load pinned state from local storage on mount
  const [pinnedDocs, setPinnedDocs] = useState(() => {
    try {
      const saved = localStorage.getItem('pinnedLatexDocs');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  useEffect(() => {
    localStorage.setItem('pinnedLatexDocs', JSON.stringify(pinnedDocs));
  }, [pinnedDocs]);

  // ...

  const handleRenameDocSubmit = async (id) => {
    if (editingDocTitle && editingDocTitle.trim() !== '') {
      try {
        await editorService.updateDocument(id, { titre: editingDocTitle.trim() });
        setDocuments(prev => prev.map(d => d.id === id ? { ...d, titre: editingDocTitle.trim() } : d));
        if (currentDoc?.id === id) {
          setCurrentDoc(prev => ({ ...prev, titre: editingDocTitle.trim() }));
        }
      } catch {
        alert('Failed to rename project.');
      }
    }
    setEditingDocId(null);
  };

  const handleRenameFileSubmit = async (fileId) => {
    if (editingFileName && editingFileName.trim() !== '') {
      try {
        await editorService.renameProjectFile(documentId, fileId, editingFileName.trim());
        setUploadedFiles(prev => prev.map(f => f.id === fileId ? { ...f, nom_fichier: editingFileName.trim() } : f));
      } catch {
        alert('Failed to rename file.');
      }
    }
    setEditingFileId(null);
  };

  // Revoke blob URL on unmount or document switch to avoid memory leaks
  useEffect(() => {
    return () => {
      setPdfBlobUrl((prev) => { if (prev) URL.revokeObjectURL(prev); return null; });
    };
  }, [documentId]);

  useEffect(() => {
    if (!documentId) {
      setCurrentDoc(null);
      setCode('');
      setCompileResult(null);
      setPdfBlobUrl(null);
      return;
    }
    (async () => {
      try {
        const res = await editorService.getDocument(documentId);
        setCurrentDoc(res.data);
        setCode(res.data.latex_contenu || '');
        setCompileResult(null);
        
        // Load user's uploaded files to show in the sidebar
        try {
          const filesRes = await editorService.listProjectFiles(documentId);
          setUploadedFiles(filesRes.data.files || []);
        } catch {
          // ignore
        }
      } catch {
        navigate('/editor');
      }
    })();
  }, [documentId, navigate]);

  const handleCreate = async () => {
    try {
      const data = {
        titre: 'Untitled Project',
        latex_contenu: '\\documentclass{article}\n\\begin{document}\n\nHello World\n\n\\end{document}',
      };
      const res = await editorService.createDocument(data);
      await loadDocuments();
      navigate(`/editor/${res.data.id}`);
    } catch {
      // ignore
    }
  };

  const handleDelete = async (e, id) => {
    e.stopPropagation();
    try {
      await editorService.deleteDocument(id);
      setDocuments((prev) => prev.filter((d) => d.id !== id));
      if (documentId === id) navigate('/editor');
    } catch {
      // ignore
    }
  };

  const handleRename = async (e, id, currentTitle) => {
    e.stopPropagation();
    setActiveMenuId(null);
    const newTitle = prompt('New project name:', currentTitle || 'Untitled');
    if (newTitle && newTitle.trim() !== '') {
      try {
        await editorService.updateDocument(id, { titre: newTitle.trim() });
        setDocuments(prev => prev.map(d => d.id === id ? { ...d, titre: newTitle.trim() } : d));
        if (currentDoc?.id === id) {
          setCurrentDoc(prev => ({ ...prev, titre: newTitle.trim() }));
        }
      } catch {
        alert('Failed to rename project.');
      }
    }
  };

  // Mock toggle pin since the backend doesn't support it for documents directly
  const handleTogglePin = (e, id) => {
    e.stopPropagation();
    setActiveMenuId(null);
    setPinnedDocs(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleSave = async () => {
    if (!documentId) return;
    setSaving(true);
    try {
      await editorService.updateDocument(documentId, { latex_contenu: code });
      setIsDirty(false);
      window.location.reload(); // Refresh the page after saving
    } catch {
      // ignore
    } finally {
      setSaving(false);
    }
  };

  const handleCompile = async () => {
    if (!code) return;
    setCompiling(true);
    try {
      const res = await editorService.compileLaTeX(code, documentId);
      setCompileResult(res.data);

      // Convert base64 PDF to a unique Blob URL (defeats browser caching)
      if (res.data.pdf_base64) {
        // Revoke the previous blob URL to free memory
        if (pdfBlobUrl) URL.revokeObjectURL(pdfBlobUrl);
        const byteChars = atob(res.data.pdf_base64);
        const byteArray = new Uint8Array(byteChars.length);
        for (let i = 0; i < byteChars.length; i++) byteArray[i] = byteChars.charCodeAt(i);
        const blob = new Blob([byteArray], { type: 'application/pdf' });
        setPdfBlobUrl(URL.createObjectURL(blob));
      } else {
        setPdfBlobUrl(null);
      }
    } catch (err) {
      console.error("Compile Error:", err);
      let errorMsg = 'Unknown error occurred during compilation';
      
      if (err.response) {
        if (err.response.data?.detail) {
          if (typeof err.response.data.detail === 'string') {
            errorMsg = err.response.data.detail;
          } else if (Array.isArray(err.response.data.detail)) {
            errorMsg = err.response.data.detail.map(e => e.msg).join(', ');
          }
        } else {
          errorMsg = `Server error: ${err.response.status}`;
        }
      } else if (err.request) {
        errorMsg = 'Network Error: No response received from the server. It might be down or blocked by CORS.';
      } else {
        errorMsg = err.message;
      }
      
      setPdfBlobUrl(null);
      setCompileResult({ 
        success: false, 
        errors: errorMsg 
      });
    } finally {
      setCompiling(false);
    }
  };

  // Switch view triggers compile if moving to visual
  const handleViewToggle = async (mode) => {
    setViewMode(mode);
    if (mode === 'visual' && !compileResult && code) {
      handleCompile();
    }
  };

  const handleExport = () => {
    if (!compileResult?.pdf_base64) {
      alert("Please compile the document to Visual View first before exporting.");
      return;
    }
    
    // Trigger download
    const linkSource = `data:application/pdf;base64,${compileResult.pdf_base64}`;
    const downloadLink = document.createElement("a");
    downloadLink.href = linkSource;
    downloadLink.download = `${currentDoc?.titre || 'document'}.pdf`;
    downloadLink.click();
  };

  const handleAiSuggest = async () => {
    if (!aiPrompt.trim()) return;
    const userMessage = { role: 'user', content: aiPrompt };
    setAiMessages(prev => [...prev, userMessage]);
    setAiPrompt('');
    setAiLoading(true);
    try {
      const res = await editorService.aiSuggest(code, userMessage.content, documentId);
      setCode(res.data.suggested_code);
      setIsDirty(true);
      setAiMessages(prev => [...prev, { role: 'ai', content: 'I have updated the code with my suggestions. Please review the changes.' }]);
    } catch {
      setAiMessages(prev => [...prev, { role: 'ai', content: 'Sorry, I encountered an error modifying the code.' }]);
    } finally {
      setAiLoading(false);
    }
  };

  // Dummy file upload to demonstrate UI asset handling
  const fileInputRef = useRef(null);
  const [uploadingAsset, setUploadingAsset] = useState(false);
  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !documentId) return;
    setUploadingAsset(true);
    try {
      await editorService.uploadProjectFile(documentId, file);
      alert('Asset uploaded successfully! You can reference it in your LaTeX code.');
      // Refresh files list
      const filesRes = await editorService.listProjectFiles(documentId);
      setUploadedFiles(filesRes.data.files || []);
    } catch (err) {
      alert('Failed to upload asset.');
    } finally {
      setUploadingAsset(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleFileRename = async (e, fileId, currentName) => {
    e.stopPropagation();
    setActiveFileMenuId(null);
    const newName = prompt('New file name:', currentName);
    if (newName && newName.trim() !== '') {
      try {
        await editorService.renameProjectFile(documentId, fileId, newName.trim());
        setUploadedFiles(prev => prev.map(f => f.id === fileId ? { ...f, nom_fichier: newName.trim() } : f));
      } catch {
        alert('Failed to rename file.');
      }
    }
  };

  const handleFileDelete = async (e, fileId) => {
    e.stopPropagation();
    setActiveFileMenuId(null);
    if (window.confirm('Are you sure you want to delete this file?')) {
      try {
        await editorService.deleteProjectFile(documentId, fileId);
        setUploadedFiles(prev => prev.filter(f => f.id !== fileId));
      } catch {
        alert('Failed to delete file.');
      }
    }
  };

  return (
    <div className="layout-container">
      <Sidebar activePage="latex" hideText={true} />
      
      {/* ── LEFT PANE: SIDEBAR ── */}
      <div className="workspace-sidebar">
        {!documentId ? (
          // STATE A: Projects List
          <div className="state-a-projects">
            <div className="ws-header" style={{ paddingBottom: '15px' }}>
              <span>LATEX PROJECTS</span>
              <Plus size={16} cursor="pointer" onClick={handleCreate} />
            </div>
            <div style={{ padding: '20px' }}>
              <button className="new-project-btn" onClick={handleCreate}>
                <Plus size={16} /> NEW PROJECT
              </button>
            </div>
            <div className="ws-nav projects-list">
              {loadingDocs ? (
                <div style={{ padding: '20px', color: '#999', fontSize: '13px' }}>Loading projects...</div>
              ) : documents.length === 0 ? (
                <div style={{ padding: '20px', color: '#999', fontSize: '13px' }}>No projects yet.</div>
              ) : (
                <>
                  {documents.filter(d => pinnedDocs[d.id]).length > 0 && (
                    <div className="session-list-section">
                      <div className="session-list-section__title" style={{ padding: '10px 20px', fontSize: '11px', color: '#888', fontWeight: 600 }}>PINNED</div>
                      {documents.filter(d => pinnedDocs[d.id]).map(doc => (
                        <div 
                          key={doc.id} 
                          className="ws-item project-item" 
                          onClick={() => { if (editingDocId !== doc.id) navigate(`/editor/${doc.id}`) }}
                          onMouseLeave={() => setActiveMenuId(null)}
                        >
                          <FileText size={14} />
                          {editingDocId === doc.id ? (
                            <input 
                              autoFocus
                              value={editingDocTitle}
                              onChange={(e) => setEditingDocTitle(e.target.value)}
                              onBlur={() => handleRenameDocSubmit(doc.id)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') handleRenameDocSubmit(doc.id);
                                if (e.key === 'Escape') setEditingDocId(null);
                              }}
                              onClick={(e) => e.stopPropagation()}
                              style={{ flex: 1, border: '1px solid #ccc', borderRadius: '4px', padding: '2px 6px', fontSize: '13px', outline: 'none' }}
                            />
                          ) : (
                            <span style={{ flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {doc.titre || 'Untitled'}
                            </span>
                          )}
                          
                          <div className="project-actions" onClick={e => e.stopPropagation()}>
                            <MoreHorizontal 
                              size={16} 
                              className="menu-icon"
                              onClick={() => setActiveMenuId(activeMenuId === doc.id ? null : doc.id)}
                            />
                            {activeMenuId === doc.id && (
                              <div className="project-dropdown">
                                <div className="dropdown-item" onClick={() => { setEditingDocTitle(doc.titre); setEditingDocId(doc.id); setActiveMenuId(null); }}>
                                  Rename
                                </div>
                                <div className="dropdown-item" onClick={(e) => handleTogglePin(e, doc.id)}>
                                  Unpin
                                </div>
                                <div className="dropdown-item delete" onClick={(e) => handleDelete(e, doc.id)}>
                                  Delete
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {documents.filter(d => !pinnedDocs[d.id]).length > 0 && (
                    <div className="session-list-section">
                      <div className="session-list-section__title" style={{ padding: '10px 20px', fontSize: '11px', color: '#888', fontWeight: 600 }}>RECENT</div>
                      {documents.filter(d => !pinnedDocs[d.id]).map(doc => (
                        <div 
                          key={doc.id} 
                          className="ws-item project-item" 
                          onClick={() => { if (editingDocId !== doc.id) navigate(`/editor/${doc.id}`) }}
                          onMouseLeave={() => setActiveMenuId(null)}
                        >
                          <FileText size={14} />
                          {editingDocId === doc.id ? (
                            <input 
                              autoFocus
                              value={editingDocTitle}
                              onChange={(e) => setEditingDocTitle(e.target.value)}
                              onBlur={() => handleRenameDocSubmit(doc.id)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') handleRenameDocSubmit(doc.id);
                                if (e.key === 'Escape') setEditingDocId(null);
                              }}
                              onClick={(e) => e.stopPropagation()}
                              style={{ flex: 1, border: '1px solid #ccc', borderRadius: '4px', padding: '2px 6px', fontSize: '13px', outline: 'none' }}
                            />
                          ) : (
                            <span style={{ flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {doc.titre || 'Untitled'}
                            </span>
                          )}
                          
                          <div className="project-actions" onClick={e => e.stopPropagation()}>
                            <MoreHorizontal 
                              size={16} 
                              className="menu-icon"
                              onClick={() => setActiveMenuId(activeMenuId === doc.id ? null : doc.id)}
                            />
                            {activeMenuId === doc.id && (
                              <div className="project-dropdown">
                                <div className="dropdown-item" onClick={() => { setEditingDocTitle(doc.titre); setEditingDocId(doc.id); setActiveMenuId(null); }}>
                                  Rename
                                </div>
                                <div className="dropdown-item" onClick={(e) => handleTogglePin(e, doc.id)}>
                                  Pin
                                </div>
                                <div className="dropdown-item delete" onClick={(e) => handleDelete(e, doc.id)}>
                                  Delete
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        ) : (
          // STATE B: Project Files
          <div className="state-b-files">
            <div className="ws-header">
              <span>WORKSPACE</span>
              <Plus size={16} cursor="pointer" onClick={() => fileInputRef.current?.click()} />
              <input type="file" ref={fileInputRef} hidden onChange={handleFileUpload} />
            </div>
            
            <div className="back-btn-container" onClick={() => navigate('/editor')}>
              <ArrowLeft size={14} />
              <span>Back to Projects</span>
            </div>

            <div className="ws-nav">
              <div className="ws-folder">
                <div className="ws-item">
                  <Folder size={14} />
                  <span>src</span>
                </div>
                <div className="ws-subitems">
                  <div className="ws-item active">
                    <FileCode size={14} />
                    <span>main.tex</span>
                  </div>
                </div>
              </div>
              
              <div className="ws-folder">
                <div className="ws-item">
                  <Folder size={14} />
                  <span>assets</span>
                </div>
                <div className="ws-subitems">
                  {uploadedFiles.map(file => (
                    <div key={file.id} className="ws-item project-item" onMouseLeave={() => setActiveFileMenuId(null)}>
                      <FileText size={14} />
                      {editingFileId === file.id ? (
                        <input 
                          autoFocus
                          value={editingFileName}
                          onChange={(e) => setEditingFileName(e.target.value)}
                          onBlur={() => handleRenameFileSubmit(file.id)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleRenameFileSubmit(file.id);
                            if (e.key === 'Escape') setEditingFileId(null);
                          }}
                          onClick={(e) => e.stopPropagation()}
                          style={{ flex: 1, border: '1px solid #ccc', borderRadius: '4px', padding: '2px 6px', fontSize: '13px', outline: 'none' }}
                        />
                      ) : (
                        <span style={{ flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {file.nom_fichier}
                        </span>
                      )}
                      
                      <div className="project-actions" onClick={e => e.stopPropagation()}>
                        <MoreHorizontal 
                          size={16} 
                          className="menu-icon"
                          onClick={() => setActiveFileMenuId(activeFileMenuId === file.id ? null : file.id)}
                        />
                        {activeFileMenuId === file.id && (
                          <div className="project-dropdown" style={{ right: '-5px' }}>
                            <div className="dropdown-item" onClick={() => { setEditingFileName(file.nom_fichier); setEditingFileId(file.id); setActiveFileMenuId(null); }}>
                              Rename
                            </div>
                            <div className="dropdown-item delete" onClick={(e) => handleFileDelete(e, file.id)}>
                              Delete
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                  <div className="ws-item upload-asset-btn" onClick={() => fileInputRef.current?.click()}>
                    <Upload size={14} />
                    <span>{uploadingAsset ? 'Uploading...' : 'Upload File/Image'}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── CENTER PANE: EDITOR & PDF ── */}
      <div className="editor-main">
        {!documentId ? (
          <div className="visual-editor" style={{ alignItems: 'center', backgroundColor: '#fff' }}>
            <div style={{ textAlign: 'center', color: '#999' }}>
              <FileCode size={48} style={{ opacity: 0.3, marginBottom: '20px' }} />
              <h2 style={{ color: '#666', fontWeight: 600 }}>Select or create a project to start editing</h2>
            </div>
          </div>
        ) : (
          <>
            <div className="editor-topbar">
              <div className="editor-topbar-left">
                <div className="doc-status">
                  <FileCode size={16} color="#666" />
                  <span className="doc-name">{currentDoc?.titre || 'main.tex'}</span>
                  <span 
                    className="status-dot" 
                    style={{ 
                      display: 'inline-block',
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      margin: '0 8px',
                      backgroundColor: isDirty ? '#ff4d4d' : '#4caf50',
                      boxShadow: isDirty ? '0 0 8px #ff4d4d' : 'none',
                      transition: 'all 0.3s ease'
                    }}
                  ></span>
                  <span className="status-text">{saving ? 'Saving...' : ''}</span>
                </div>
                <div className="view-toggle">
                  <span 
                    className={`toggle-btn ${viewMode === 'code' ? 'active' : ''}`}
                    onClick={() => handleViewToggle('code')}
                  >
                    CODE VIEW
                  </span>
                  <span 
                    className={`toggle-btn ${viewMode === 'visual' ? 'active' : ''}`}
                    onClick={() => handleViewToggle('visual')}
                  >
                    VISUAL VIEW
                  </span>
                </div>
                <div className="topbar-actions" style={{ display: 'flex', gap: '10px' }}>
                  <button className="action-btn" onClick={handleSave} disabled={saving} style={{ padding: '6px 12px', minWidth: '80px' }}>
                    Save
                  </button>
                  <button className="action-btn" onClick={handleExport} style={{ padding: '6px 12px', minWidth: '80px' }}>
                    Export
                  </button>
                </div>
              </div>
              <div className="editor-topbar-right">
                <div className="assistant-header">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span>ASSISTANT</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="editor-content-area">
              {viewMode === 'code' ? (
                <div className="code-editor-container" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                  <textarea
                    className="latex-textarea"
                    value={code}
                    onChange={(e) => {
                      setCode(e.target.value);
                      setIsDirty(true);
                    }}
                    spellCheck={false}
                    placeholder="% Write LaTeX code here..."
                  />
                </div>
              ) : (
                <div className="visual-editor">
                  {compiling ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#999' }}>
                      Compiling PDF...
                    </div>
                  ) : pdfBlobUrl ? (
                    <iframe 
                      src={pdfBlobUrl} 
                      className="pdf-iframe"
                      title="PDF Preview"
                    />
                  ) : (
                    <div className="document-page" style={{ position: 'relative' }}>
                      {compileResult?.errors ? (
                        <div style={{ color: 'red', whiteSpace: 'pre-wrap', padding: '20px' }}>
                          Compilation failed: {compileResult.errors}
                        </div>
                      ) : (
                        <div style={{ textAlign: 'center', color: '#999', paddingTop: '100px' }}>
                          PDF not compiled yet. Wait or switch back to Code View.
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
              
              {/* ── RIGHT PANE: ASSISTANT ── */}
              <div className="assistant-sidebar">
                <div className="assistant-messages">
                  {aiMessages.map((msg, idx) => (
                    msg.role === 'ai' ? (
                      <div key={idx} style={{ marginBottom: '20px' }}>
                        <div className="assistant-message-header">
                          <div className="ai-avatar">Lx</div>
                          <span>Lexis AI</span>
                        </div>
                        <div className="assistant-bubble">
                          {msg.content}
                        </div>
                      </div>
                    ) : (
                      <div key={idx} style={{ marginBottom: '20px', textAlign: 'right' }}>
                        <div className="assistant-bubble" style={{ backgroundColor: '#e0e0e0', display: 'inline-block', textAlign: 'left' }}>
                          {msg.content}
                        </div>
                      </div>
                    )
                  ))}
                  
                  {aiLoading && (
                    <div style={{ marginBottom: '20px' }}>
                      <div className="assistant-message-header">
                        <div className="ai-avatar">Lx</div>
                        <span>Lexis AI</span>
                      </div>
                      <div className="assistant-bubble">
                        Thinking and analyzing your code...
                      </div>
                    </div>
                  )}

                  <div className="context-sources-section">
                    <div className="context-header">CONTEXT SOURCES</div>
                    <div className="source-chip">
                      <FileText size={12} />
                      <span>{currentDoc?.titre || 'main.tex'}</span>
                    </div>
                  </div>
                </div>

                <div className="assistant-input-area">
                  <div className="assistant-input-box">
                    <input 
                      type="text" 
                      placeholder="Ask me to modify the code..." 
                      value={aiPrompt}
                      onChange={(e) => setAiPrompt(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleAiSuggest()}
                      disabled={aiLoading}
                    />
                    <Send 
                      size={16} 
                      color="#999" 
                      style={{ cursor: aiLoading || !aiPrompt.trim() ? 'default' : 'pointer' }} 
                      onClick={handleAiSuggest}
                    />
                  </div>
                  <div className="assistant-footer">
                    <span>Enter to send</span>
                    <Paperclip size={14} color="#999" style={{ cursor: 'pointer' }} />
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default EditorPage;
