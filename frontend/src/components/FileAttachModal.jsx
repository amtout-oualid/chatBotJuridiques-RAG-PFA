import { useEffect, useState } from 'react';
import { X, FileText, Loader2 } from 'lucide-react';
import { fileService } from '../services/fileService';
import './FileAttachModal.css';

export default function FileAttachModal({ open, onClose, onSelect, selectedFileId }) {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    setError('');
    fileService
      .listFiles()
      .then((res) => setFiles(res.data.files || []))
      .catch(() => setError('Unable to load your documents.'))
      .finally(() => setLoading(false));
  }, [open]);

  if (!open) return null;

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
          <X size={18} />
        </button>
      </div>
      <p className="file-modal-hint">Select a document from your private database to include as context.</p>

      {loading && (
        <div className="file-modal-loading">
          <Loader2 size={20} className="file-modal-spinner" />
          Loading files...
        </div>
      )}

      {error && <p className="file-modal-error">{error}</p>}

      {!loading && !error && files.length === 0 && (
        <p className="file-modal-empty">No files uploaded yet. Add documents in the Database page.</p>
      )}

      {!loading && files.length > 0 && (
        <ul className="file-modal-list">
          {files.map((file) => (
            <li key={file.id}>
              <button
                type="button"
                className={`file-modal-item ${selectedFileId === file.id ? 'selected' : ''}`}
                onClick={() => {
                  onSelect(file);
                  onClose();
                }}
              >
                <FileText size={18} />
                <span className="file-modal-item-name">{file.nom_fichier}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  </div>
  );
}
