import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Plus,
  Save,
  Play,
  Sparkles,
  FileText,
  Trash2,
  Loader2,
  ChevronLeft,
} from 'lucide-react';
import { editorService } from '../services/editorService';
import './EditorPage.css';

export default function EditorPage() {
  const { documentId } = useParams();
  const navigate = useNavigate();

  const [documents, setDocuments] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [currentDoc, setCurrentDoc] = useState(null);
  const [code, setCode] = useState('');
  const [saving, setSaving] = useState(false);
  const [compiling, setCompiling] = useState(false);
  const [compileResult, setCompileResult] = useState(null);
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [loadingDocs, setLoadingDocs] = useState(true);

  const autoSaveTimer = useRef(null);

  // Load documents list
  const loadDocuments = useCallback(async () => {
    try {
      const res = await editorService.listDocuments();
      setDocuments(res.data.documents || []);
    } catch {
      /* ignore */
    } finally {
      setLoadingDocs(false);
    }
  }, []);

  useEffect(() => {
    loadDocuments();
  }, [loadDocuments]);

  // Load templates
  useEffect(() => {
    (async () => {
      try {
        const res = await editorService.listTemplates();
        setTemplates(res.data.templates || []);
      } catch {
        /* ignore */
      }
    })();
  }, []);

  // Load document when ID changes
  useEffect(() => {
    if (!documentId) {
      setCurrentDoc(null);
      setCode('');
      return;
    }
    (async () => {
      try {
        const res = await editorService.getDocument(documentId);
        setCurrentDoc(res.data);
        setCode(res.data.latex_contenu || '');
      } catch {
        navigate('/editor');
      }
    })();
  }, [documentId, navigate]);

  // Auto-save (debounced)
  useEffect(() => {
    if (!documentId || !currentDoc) return;

    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    autoSaveTimer.current = setTimeout(async () => {
      try {
        await editorService.updateDocument(documentId, { latex_contenu: code });
      } catch {
        /* ignore */
      }
    }, 2000);

    return () => clearTimeout(autoSaveTimer.current);
  }, [code, documentId, currentDoc]);

  // Create new document
  const handleCreate = async (templateId = null) => {
    try {
      const data = {
        titre: 'Document sans titre',
        latex_contenu: '',
      };
      if (templateId) data.modele_id = templateId;
      const res = await editorService.createDocument(data);
      await loadDocuments();
      navigate(`/editor/${res.data.id}`);
      setShowTemplates(false);
    } catch {
      /* ignore */
    }
  };

  // Save
  const handleSave = async () => {
    if (!documentId) return;
    setSaving(true);
    try {
      await editorService.updateDocument(documentId, { latex_contenu: code });
    } catch {
      /* ignore */
    } finally {
      setSaving(false);
    }
  };

  // Compile
  const handleCompile = async () => {
    setCompiling(true);
    setCompileResult(null);
    try {
      const res = await editorService.compileLaTeX(code);
      setCompileResult(res.data);
    } catch {
      setCompileResult({ success: false, errors: 'Erreur réseau' });
    } finally {
      setCompiling(false);
    }
  };

  // AI Suggest
  const handleAiSuggest = async () => {
    if (!aiPrompt.trim()) return;
    setAiLoading(true);
    try {
      const res = await editorService.aiSuggest(code, aiPrompt);
      setCode(res.data.suggested_code);
      setAiPrompt('');
    } catch {
      /* ignore */
    } finally {
      setAiLoading(false);
    }
  };

  // Delete
  const handleDelete = async (id) => {
    try {
      await editorService.deleteDocument(id);
      setDocuments((prev) => prev.filter((d) => d.id !== id));
      if (documentId === id) navigate('/editor');
    } catch {
      /* ignore */
    }
  };

  return (
    <div className="editor-page">
      {/* ── Sidebar: Documents List ── */}
      <aside className="editor-sidebar" id="editor-sidebar">
        <div className="editor-sidebar__header">
          <h2 className="editor-sidebar__title">DOCUMENTS</h2>
          <button
            className="editor-sidebar__new"
            onClick={() => setShowTemplates(!showTemplates)}
            title="Nouveau document"
            id="new-doc-btn"
          >
            <Plus size={18} />
          </button>
        </div>

        {/* Templates dropdown */}
        {showTemplates && (
          <div className="editor-templates">
            <button
              className="editor-template-item"
              onClick={() => handleCreate()}
            >
              <FileText size={14} /> Document vide
            </button>
            {templates.map((t) => (
              <button
                key={t.id}
                className="editor-template-item"
                onClick={() => handleCreate(t.id)}
              >
                <FileText size={14} /> {t.nom}
              </button>
            ))}
          </div>
        )}

        <div className="editor-sidebar__list">
          {documents.map((doc) => (
            <div
              key={doc.id}
              className={`editor-doc-item ${
                documentId === doc.id ? 'editor-doc-item--active' : ''
              }`}
              onClick={() => navigate(`/editor/${doc.id}`)}
            >
              <div className="editor-doc-item__info">
                <span className="editor-doc-item__title">
                  {doc.titre || 'Sans titre'}
                </span>
                <span className="editor-doc-item__meta">
                  {doc.statut === 'finalise' ? '✓ Finalisé' : 'Brouillon'}
                </span>
              </div>
              <button
                className="editor-doc-item__delete"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDelete(doc.id);
                }}
                title="Supprimer"
              >
                <Trash2 size={13} />
              </button>
            </div>
          ))}

          {!loadingDocs && documents.length === 0 && (
            <div className="editor-sidebar__empty">
              <FileText size={24} opacity={0.3} />
              <span>Aucun document</span>
            </div>
          )}
        </div>
      </aside>

      {/* ── Editor Panel ── */}
      <div className="editor-main">
        {!documentId ? (
          <div className="editor-empty">
            <FileText size={48} opacity={0.2} />
            <h2>Éditeur LaTeX</h2>
            <p>Sélectionnez un document ou créez-en un nouveau.</p>
            <button
              className="editor-empty__btn"
              onClick={() => handleCreate()}
              id="create-empty-doc"
            >
              <Plus size={16} /> Nouveau document
            </button>
          </div>
        ) : (
          <>
            {/* Toolbar */}
            <div className="editor-toolbar" id="editor-toolbar">
              <div className="editor-toolbar__left">
                <button
                  className="editor-toolbar__btn"
                  onClick={handleSave}
                  disabled={saving}
                  title="Sauvegarder"
                >
                  {saving ? (
                    <Loader2 size={16} className="spin" />
                  ) : (
                    <Save size={16} />
                  )}
                  Sauvegarder
                </button>
                <button
                  className="editor-toolbar__btn editor-toolbar__btn--accent"
                  onClick={handleCompile}
                  disabled={compiling}
                  title="Compiler en PDF"
                >
                  {compiling ? (
                    <Loader2 size={16} className="spin" />
                  ) : (
                    <Play size={16} />
                  )}
                  Compiler
                </button>
              </div>
              <div className="editor-toolbar__right">
                <div className="editor-ai-bar">
                  <Sparkles size={14} className="editor-ai-icon" />
                  <input
                    className="editor-ai-input"
                    placeholder="Demander à l'IA de modifier le code..."
                    value={aiPrompt}
                    onChange={(e) => setAiPrompt(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAiSuggest()}
                    disabled={aiLoading}
                    id="ai-suggest-input"
                  />
                  <button
                    className="editor-ai-submit"
                    onClick={handleAiSuggest}
                    disabled={aiLoading || !aiPrompt.trim()}
                  >
                    {aiLoading ? (
                      <Loader2 size={14} className="spin" />
                    ) : (
                      'Suggérer'
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Compile result banner */}
            {compileResult && (
              <div
                className={`editor-compile-result ${
                  compileResult.success
                    ? 'editor-compile-result--ok'
                    : 'editor-compile-result--err'
                }`}
              >
                {compileResult.success
                  ? '✓ Compilation réussie'
                  : `✗ Erreur: ${compileResult.errors}`}
              </div>
            )}

            {/* Code Area */}
            <div className="editor-code-area">
              <textarea
                className="editor-textarea"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="Écrivez votre code LaTeX ici..."
                spellCheck={false}
                id="latex-code-editor"
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
