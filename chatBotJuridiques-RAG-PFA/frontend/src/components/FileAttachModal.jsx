import { useEffect, useState } from 'react';
import { X, FileText, Loader2, Search, FileSpreadsheet, File as FileIcon, LayoutGrid, List as ListIcon } from 'lucide-react';
import { fileService } from '../services/fileService';
import './FileAttachModal.css';

export default function FileAttachModal({ open, onClose, onSelect, selectedFileId }) {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState('grid');
  const [currentSelectedId, setCurrentSelectedId] = useState(selectedFileId);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    setError('');
    setCurrentSelectedId(selectedFileId);
    fileService
      .listFiles()
      .then((res) => setFiles(res.data.files || []))
      .catch(() => setError('Unable to load your documents.'))
      .finally(() => setLoading(false));
  }, [open, selectedFileId]);

  if (!open) return null;

  const getFileIcon = (mimeType) => {
    if (!mimeType) return <FileIcon size={24} className="card-icon" />;
    if (mimeType.includes('pdf')) return <FileText size={24} className="card-icon" />;
    if (mimeType.includes('sheet') || mimeType.includes('excel')) return <FileSpreadsheet size={24} className="card-icon" />;
    return <FileIcon size={24} className="card-icon" />;
  };

  const formatSize = (bytes) => {
    if (!bytes) return '—';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const filteredFiles = files.filter(f => 
    f.nom_fichier.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAttach = () => {
    const file = files.find(f => f.id === currentSelectedId);
    if (file) {
      onSelect(file);
      onClose();
    }
  };

  return (
    <div className="file-modal-overlay" onClick={onClose} role="presentation">
      <div
        className="file-modal"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-labelledby="file-modal-title"
      >
        <div className="file-modal-header">
          <h3 id="file-modal-title">Attach from Database</h3>
          <button type="button" className="file-modal-close" onClick={onClose} aria-label="Close">
            <X size={20} />
          </button>
        </div>
        
        <div className="file-modal-body">
          <div className="file-modal-toolbar">
            <div className="file-modal-breadcrumbs">
              <span>Root</span>
              <span className="separator">›</span>
              <span className="current">My Documents</span>
            </div>
            <div className="file-modal-search">
              <Search size={14} color="#999" />
              <input 
                type="text" 
                placeholder="Search documents..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <div className="file-modal-content">
            {loading && (
              <div className="file-modal-loading">
                <Loader2 size={24} className="file-modal-spinner" />
                Loading database...
              </div>
            )}

            {error && <p className="file-modal-error">{error}</p>}

            {!loading && !error && files.length === 0 && (
              <p className="file-modal-empty">No files uploaded yet. Add documents in the Database page.</p>
            )}

            {!loading && files.length > 0 && (
              <div className={viewMode === 'grid' ? 'file-modal-grid' : 'file-modal-list'}>
                {filteredFiles.map((file) => (
                  viewMode === 'grid' ? (
                    <div 
                      key={file.id}
                      className={`file-modal-card ${currentSelectedId === file.id ? 'selected' : ''}`}
                      onClick={() => setCurrentSelectedId(file.id)}
                      onDoubleClick={handleAttach}
                    >
                      {getFileIcon(file.type_mime)}
                      <div className="card-title" title={file.nom_fichier}>{file.nom_fichier}</div>
                      <div className="card-meta">
                        {file.type_mime?.split('/')[1]?.toUpperCase() || 'FILE'} • {formatSize(file.taille_octets)}
                      </div>
                    </div>
                  ) : (
                    <div 
                      key={file.id}
                      className={`file-modal-list-item ${currentSelectedId === file.id ? 'selected' : ''}`}
                      onClick={() => setCurrentSelectedId(file.id)}
                      onDoubleClick={handleAttach}
                    >
                      <FileText size={18} color="#555" />
                      <div className="file-modal-list-item-name" title={file.nom_fichier}>{file.nom_fichier}</div>
                      <div className="file-modal-list-item-meta">
                        {formatSize(file.taille_octets)}
                      </div>
                    </div>
                  )
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="file-modal-footer">
          <div className="file-modal-info">
            {currentSelectedId ? '1 file selected' : '0 files selected'}
          </div>
          <div className="file-modal-actions">
            <button className="file-modal-btn btn-cancel" onClick={onClose}>Cancel</button>
            <button 
              className="file-modal-btn btn-attach" 
              onClick={handleAttach}
              disabled={!currentSelectedId}
            >
              Attach Document
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
