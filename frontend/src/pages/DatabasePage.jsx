import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Upload,
  Search,
  FileText,
  Trash2,
  CheckCircle,
  Clock,
  Loader2,
  X,
} from 'lucide-react';
import { fileService } from '../services/fileService';
import './DatabasePage.css';

export default function DatabasePage() {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState(null);
  const fileInputRef = useRef(null);

  const loadFiles = useCallback(async () => {
    try {
      const res = await fileService.listFiles();
      setFiles(res.data.files || []);
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadFiles();
  }, [loadFiles]);

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      await fileService.uploadFile(file);
      await loadFiles();
    } catch {
      /* ignore */
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDelete = async (id) => {
    try {
      await fileService.deleteFile(id);
      setFiles((prev) => prev.filter((f) => f.id !== id));
      if (searchResults) {
        setSearchResults((prev) => ({
          ...prev,
          results: prev.results.filter((f) => f.id !== id),
        }));
      }
    } catch {
      /* ignore */
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setSearchResults(null);
      return;
    }
    try {
      const res = await fileService.searchFiles(searchQuery);
      setSearchResults(res.data);
    } catch {
      /* ignore */
    }
  };

  const handleSearchKeyDown = (e) => {
    if (e.key === 'Enter') handleSearch();
  };

  const clearSearch = () => {
    setSearchQuery('');
    setSearchResults(null);
  };

  const displayFiles = searchResults ? searchResults.results : files;

  const formatSize = (bytes) => {
    if (!bytes) return '—';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  return (
    <div className="db-page">
      {/* ── Header ── */}
      <header className="db-header">
        <div className="db-header__left">
          <h1 className="db-header__title">Ma Base Documentaire</h1>
          <span className="db-header__count">{files.length} fichiers</span>
        </div>
        <div className="db-header__actions">
          <div className="db-search">
            <Search size={16} className="db-search__icon" />
            <input
              type="text"
              className="db-search__input"
              placeholder="Rechercher des fichiers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleSearchKeyDown}
              id="file-search-input"
            />
            {searchQuery && (
              <button className="db-search__clear" onClick={clearSearch}>
                <X size={14} />
              </button>
            )}
          </div>
          <button
            className="db-upload-btn"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            id="file-upload-btn"
          >
            {uploading ? <Loader2 size={16} className="spin" /> : <Upload size={16} />}
            {uploading ? 'Envoi...' : 'Télécharger'}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.doc,.docx,.txt"
            onChange={handleUpload}
            hidden
          />
        </div>
      </header>

      {/* ── Search results indicator ── */}
      {searchResults && (
        <div className="db-search-info">
          Résultats pour « {searchResults.query} » — {searchResults.results.length} fichier(s)
          <button onClick={clearSearch}>Effacer</button>
        </div>
      )}

      {/* ── File Grid ── */}
      <div className="db-grid">
        {loading ? (
          <div className="db-empty">
            <div className="spinner spinner--lg" />
          </div>
        ) : displayFiles.length === 0 ? (
          <div className="db-empty">
            <FileText size={40} opacity={0.3} />
            <p>{searchResults ? 'Aucun résultat' : 'Aucun fichier téléchargé'}</p>
            {!searchResults && (
              <button
                className="db-upload-btn"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload size={16} /> Télécharger votre premier document
              </button>
            )}
          </div>
        ) : (
          <table className="db-table" id="files-table">
            <thead>
              <tr>
                <th>Nom du fichier</th>
                <th>Type</th>
                <th>Taille</th>
                <th>RAG</th>
                <th>Date</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {displayFiles.map((file) => (
                <tr key={file.id} className="db-row fade-in">
                  <td>
                    <div className="db-row__name">
                      <FileText size={16} />
                      <span>{file.nom_fichier}</span>
                    </div>
                  </td>
                  <td className="db-row__meta">
                    {file.type_mime?.split('/')[1]?.toUpperCase() || '—'}
                  </td>
                  <td className="db-row__meta">{formatSize(file.taille_octets)}</td>
                  <td>
                    {file.indexe_rag ? (
                      <span className="db-badge db-badge--success">
                        <CheckCircle size={12} /> Indexé
                      </span>
                    ) : (
                      <span className="db-badge db-badge--pending">
                        <Clock size={12} /> En attente
                      </span>
                    )}
                  </td>
                  <td className="db-row__meta">{formatDate(file.date_creation)}</td>
                  <td>
                    <button
                      className="db-row__delete"
                      onClick={() => handleDelete(file.id)}
                      title="Supprimer"
                    >
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
