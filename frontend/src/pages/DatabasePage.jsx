import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Search,
  Folder,
  FileText,
  FileSpreadsheet,
  File as FileIcon,
  Upload,
  LayoutGrid,
  List as ListIcon,
  ChevronLeft,
  ChevronRight,
  MoreVertical,
  Trash2,
  Edit2,
  Loader2
} from 'lucide-react';
import Sidebar from '../components/Sidebar';
import Topbar from '../components/Topbar';
import { fileService } from '../services/fileService';
import './DatabasePage.css';

export default function DatabasePage() {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'list'
  const [activeMenuId, setActiveMenuId] = useState(null);
  const [activeFilter, setActiveFilter] = useState('All');
  
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

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = () => setActiveMenuId(null);
    window.addEventListener('click', handleClickOutside);
    return () => window.removeEventListener('click', handleClickOutside);
  }, []);

  const handleUpload = async (e) => {
    const filesList = e.target.files;
    if (!filesList || filesList.length === 0) return;

    setUploading(true);
    try {
      const uploadPromises = Array.from(filesList).map(file => 
        fileService.uploadFile(file)
      );
      await Promise.all(uploadPromises);
      await loadFiles();
    } catch (err) {
      console.error('Upload failed:', err);
      alert('Failed to upload file(s). Please try again.');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDelete = async (e, id) => {
    e.stopPropagation();
    try {
      await fileService.deleteFile(id);
      setFiles((prev) => prev.filter((f) => f.id !== id));
      setActiveMenuId(null);
    } catch {
      /* ignore */
    }
  };

  const handleRename = (e, id) => {
    e.stopPropagation();
    // In a real app, open a modal or inline edit to rename
    alert('Rename feature to be implemented');
    setActiveMenuId(null);
  };

  const toggleMenu = (e, id) => {
    e.stopPropagation();
    setActiveMenuId(activeMenuId === id ? null : id);
  };

  const formatSize = (bytes) => {
    if (!bytes) return '—';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      day: '2-digit',
      month: 'short',
    });
  };

  const getFileIcon = (mimeType) => {
    if (!mimeType) return <FileIcon size={20} className="card-icon" />;
    if (mimeType.includes('pdf')) return <FileText size={20} className="card-icon" />;
    if (mimeType.includes('sheet') || mimeType.includes('excel')) return <FileSpreadsheet size={20} className="card-icon" />;
    return <FileIcon size={20} className="card-icon" />;
  };

  // Basic client-side filtering based on search query and active filter
  const filteredFiles = files.filter(f => {
    const matchesSearch = f.nom_fichier.toLowerCase().includes(searchQuery.toLowerCase());
    
    // Simple mock logic for filtering by category (could be based on actual backend categorization or tags)
    let matchesFilter = true;
    if (activeFilter !== 'All') {
      const lowerName = f.nom_fichier.toLowerCase();
      if (activeFilter === 'Contracts') matchesFilter = lowerName.includes('contract') || lowerName.includes('agreement');
      else if (activeFilter === 'Litigation') matchesFilter = lowerName.includes('case') || lowerName.includes('v.') || lowerName.includes('subpoena');
      else if (activeFilter === 'M&A') matchesFilter = lowerName.includes('merger') || lowerName.includes('acquisition') || lowerName.includes('m&a');
      else if (activeFilter === 'IP') matchesFilter = lowerName.includes('ip') || lowerName.includes('patent') || lowerName.includes('trademark');
    }
    
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="layout-container">
      <Sidebar />
      <div className="main-content">
        <Topbar />
        <div className="database-area">
          <div className="database-header-center">
            <h1>Database Explorer</h1>
            
            <div className="db-search-container">
              <Search size={18} color="#999" />
              <input 
                type="text" 
                placeholder="Search legal documents, case files, or precedents..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <button className="db-search-btn">Search</button>
            </div>

            <div className="quick-filters">
              <span className="filter-label">QUICK FILTERS:</span>
              <span 
                className={`filter-chip ${activeFilter === 'All' ? 'active' : ''}`}
                onClick={() => setActiveFilter('All')}
                style={{ backgroundColor: activeFilter === 'All' ? '#e0e0e0' : undefined }}
              >All</span>
              <span 
                className={`filter-chip ${activeFilter === 'Contracts' ? 'active' : ''}`}
                onClick={() => setActiveFilter('Contracts')}
                style={{ backgroundColor: activeFilter === 'Contracts' ? '#e0e0e0' : undefined }}
              >Contracts</span>
              <span 
                className={`filter-chip ${activeFilter === 'Litigation' ? 'active' : ''}`}
                onClick={() => setActiveFilter('Litigation')}
                style={{ backgroundColor: activeFilter === 'Litigation' ? '#e0e0e0' : undefined }}
              >Litigation</span>
              <span 
                className={`filter-chip ${activeFilter === 'M&A' ? 'active' : ''}`}
                onClick={() => setActiveFilter('M&A')}
                style={{ backgroundColor: activeFilter === 'M&A' ? '#e0e0e0' : undefined }}
              >M&A</span>
              <span 
                className={`filter-chip ${activeFilter === 'IP' ? 'active' : ''}`}
                onClick={() => setActiveFilter('IP')}
                style={{ backgroundColor: activeFilter === 'IP' ? '#e0e0e0' : undefined }}
              >IP</span>
            </div>
          </div>

          <div className="db-content">
            <div className="db-toolbar">
              <div className="breadcrumbs">
                <span>Root</span>
                <span className="separator">›</span>
                <span>My Documents</span>
              </div>
              <div className="view-toggles">
                <button 
                  className={`view-btn ${viewMode === 'list' ? 'active' : ''}`}
                  onClick={() => setViewMode('list')}
                >
                  <ListIcon size={16} />
                </button>
                <button 
                  className={`view-btn ${viewMode === 'grid' ? 'active' : ''}`}
                  onClick={() => setViewMode('grid')}
                >
                  <LayoutGrid size={16} />
                </button>
              </div>
            </div>

            {loading ? (
              <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
                <Loader2 size={32} className="spin" style={{ margin: '0 auto' }} />
                <p style={{ marginTop: '16px' }}>Loading files...</p>
              </div>
            ) : (
              <div className={viewMode === 'grid' ? 'db-grid' : 'db-list-view'}>
                {viewMode === 'grid' && (
                  <div 
                    className="db-card upload-card" 
                    onClick={() => !uploading && fileInputRef.current?.click()}
                    style={{ cursor: uploading ? 'wait' : 'pointer' }}
                  >
                    {uploading ? (
                      <Loader2 size={24} className="card-icon spin" />
                    ) : (
                      <Upload size={24} className="card-icon" />
                    )}
                    <div className="card-title">{uploading ? 'Uploading...' : 'Upload File'}</div>
                    <div className="card-meta">Drag and drop</div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      onChange={handleUpload}
                      hidden
                      multiple
                    />
                  </div>
                )}
                
                {viewMode === 'list' && (
                  <div 
                    className="list-item" 
                    style={{ borderStyle: 'dashed', backgroundColor: '#fafafa', justifyContent: 'center', gap: '10px' }}
                    onClick={() => !uploading && fileInputRef.current?.click()}
                  >
                     {uploading ? <Loader2 size={16} className="spin" /> : <Upload size={16} />}
                     <span style={{ fontWeight: 600 }}>{uploading ? 'Uploading...' : 'Upload File (Drag and drop)'}</span>
                     <input
                      ref={fileInputRef}
                      type="file"
                      onChange={handleUpload}
                      hidden
                      multiple
                    />
                  </div>
                )}

                {filteredFiles.map((file) => (
                  viewMode === 'grid' ? (
                    <div className="db-card" key={file.id}>
                      {getFileIcon(file.type_mime)}
                      
                      <div className="db-card-actions" onClick={(e) => toggleMenu(e, file.id)}>
                        <MoreVertical size={16} />
                      </div>
                      
                      {activeMenuId === file.id && (
                        <div className="db-dropdown-menu">
                          <button className="db-dropdown-item" onClick={(e) => handleRename(e, file.id)}>
                            <Edit2 size={14} /> Rename
                          </button>
                          <button className="db-dropdown-item danger" onClick={(e) => handleDelete(e, file.id)}>
                            <Trash2 size={14} /> Delete
                          </button>
                        </div>
                      )}

                      <div className="card-title" title={file.nom_fichier}>{file.nom_fichier}</div>
                      <div className="card-meta-row">
                        <span>{file.type_mime?.split('/')[1]?.toUpperCase() || 'FILE'} • {formatSize(file.taille_octets)}</span>
                        <span>{formatDate(file.date_creation)}</span>
                      </div>
                    </div>
                  ) : (
                    <div className="list-item" key={file.id}>
                      <div className="list-item-left">
                         {getFileIcon(file.type_mime)}
                         <span style={{ fontWeight: 600, fontSize: '13px' }}>{file.nom_fichier}</span>
                      </div>
                      <div className="list-item-right">
                         <span>{file.type_mime?.split('/')[1]?.toUpperCase() || 'FILE'}</span>
                         <span>{formatSize(file.taille_octets)}</span>
                         <span>{formatDate(file.date_creation)}</span>
                         <div style={{ position: 'relative' }}>
                           <div className="db-card-actions" style={{ position: 'static' }} onClick={(e) => toggleMenu(e, file.id)}>
                             <MoreVertical size={16} />
                           </div>
                           {activeMenuId === file.id && (
                              <div className="db-dropdown-menu" style={{ right: 0, top: '24px' }}>
                                <button className="db-dropdown-item" onClick={(e) => handleRename(e, file.id)}>
                                  <Edit2 size={14} /> Rename
                                </button>
                                <button className="db-dropdown-item danger" onClick={(e) => handleDelete(e, file.id)}>
                                  <Trash2 size={14} /> Delete
                                </button>
                              </div>
                            )}
                         </div>
                      </div>
                    </div>
                  )
                ))}
              </div>
            )}

            {!loading && (
              <div className="pagination">
                <div className="page-info">Showing {filteredFiles.length} items in Database</div>
                <div className="page-controls">
                  <button><ChevronLeft size={16} /></button>
                  <span>Page 1 of 1</span>
                  <button><ChevronRight size={16} /></button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
