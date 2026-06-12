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
  Loader2,
  FolderPlus
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
  const [viewMode, setViewMode] = useState('grid');
  const [activeMenuId, setActiveMenuId] = useState(null);
  
  // Sorting
  const [orderBy, setOrderBy] = useState('creation'); // creation, modification, size, name, type
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;

  // Virtual Folders
  const [currentPath, setCurrentPath] = useState(['Root', 'My Documents']);
  const [virtualFolders, setVirtualFolders] = useState(() => {
    try {
      const saved = localStorage.getItem('dmsFolders');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const fileInputRef = useRef(null);

  // Inline editing state
  const [editingItemId, setEditingItemId] = useState(null);
  const [editingItemName, setEditingItemName] = useState('');
  const [isEditingFolder, setIsEditingFolder] = useState(false);

  // Modal state
  const [showNewFolderModal, setShowNewFolderModal] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');

  useEffect(() => {
    localStorage.setItem('dmsFolders', JSON.stringify(virtualFolders));
  }, [virtualFolders]);

  const loadFiles = useCallback(async () => {
    try {
      const res = await fileService.listFiles();
      // Add a mock virtualPath to files if not present
      const loadedFiles = (res.data.files || []).map(f => {
        // Just put them all in Root/My Documents for this MVP unless mapped elsewhere
        const savedMap = JSON.parse(localStorage.getItem('fileFolderMap') || '{}');
        return { ...f, virtualPath: savedMap[f.id] || 'Root/My Documents' };
      });
      setFiles(loadedFiles);
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadFiles();
  }, [loadFiles]);

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
      const newFiles = await Promise.all(uploadPromises);
      
      // Map new files to current path
      const savedMap = JSON.parse(localStorage.getItem('fileFolderMap') || '{}');
      const currentPathString = currentPath.join('/');
      newFiles.forEach(res => {
        if(res.data) savedMap[res.data.id] = currentPathString;
      });
      localStorage.setItem('fileFolderMap', JSON.stringify(savedMap));

      await loadFiles();
    } catch (err) {
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

  const handleDeleteFolder = (e, folderId) => {
    e.stopPropagation();
    setVirtualFolders(prev => prev.filter(f => f.id !== folderId));
    setActiveMenuId(null);
  };

  const handleRename = (e, id, type, currentName) => {
    e.stopPropagation();
    setEditingItemId(id);
    setEditingItemName(currentName);
    setIsEditingFolder(type === 'folder');
    setActiveMenuId(null);
  };

  const handleRenameSubmit = async () => {
    if (!editingItemName || !editingItemName.trim()) {
      setEditingItemId(null);
      return;
    }
    const newName = editingItemName.trim();
    if (isEditingFolder) {
      setVirtualFolders(prev => prev.map(f => f.id === editingItemId ? { ...f, name: newName } : f));
    } else {
      try {
        await fileService.renameFile(editingItemId, newName);
        setFiles(prev => prev.map(f => f.id === editingItemId ? { ...f, nom_fichier: newName } : f));
      } catch {
        alert('Failed to rename file.');
      }
    }
    setEditingItemId(null);
  };

  const toggleMenu = (e, id) => {
    e.stopPropagation();
    setActiveMenuId(activeMenuId === id ? null : id);
  };

  const createFolder = () => {
    const folderName = prompt('New folder name:');
    if (folderName && folderName.trim()) {
      setVirtualFolders(prev => [
        ...prev, 
        { id: Date.now().toString(), name: folderName.trim(), parentPath: currentPath.join('/') }
      ]);
    }
  };

  const navigateToFolder = (folderName) => {
    setCurrentPage(1);
    setCurrentPath(prev => [...prev, folderName]);
  };

  const navigateToBreadcrumb = (index) => {
    setCurrentPage(1);
    setCurrentPath(prev => prev.slice(0, index + 1));
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

  const currentPathString = currentPath.join('/');
  
  // Get folders in current path
  const currentFolders = virtualFolders.filter(f => f.parentPath === currentPathString && f.name.toLowerCase().includes(searchQuery.toLowerCase()));

  // Get files in current path
  let currentFiles = files.filter(f => f.virtualPath === currentPathString && f.nom_fichier.toLowerCase().includes(searchQuery.toLowerCase()));

  // Sort files
  currentFiles.sort((a, b) => {
    if (orderBy === 'creation') return new Date(b.date_creation) - new Date(a.date_creation);
    if (orderBy === 'modification') return new Date(b.date_creation) - new Date(a.date_creation); // Fallback
    if (orderBy === 'size') return (b.taille_octets || 0) - (a.taille_octets || 0);
    if (orderBy === 'name') return a.nom_fichier.localeCompare(b.nom_fichier);
    if (orderBy === 'type') return (a.type_mime || '').localeCompare(b.type_mime || '');
    return 0;
  });

  // Pagination Logic
  const totalItems = currentFolders.length + currentFiles.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
  
  // Ensure current page is valid
  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) setCurrentPage(totalPages);
  }, [totalPages, currentPage]);

  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;

  // Combine and slice for pagination
  const combinedItems = [...currentFolders.map(f => ({...f, isFolder: true})), ...currentFiles];
  const paginatedItems = combinedItems.slice(startIndex, endIndex);

  const renderInlineEdit = (id, type) => (
    <input 
      autoFocus
      value={editingItemName}
      onChange={(e) => setEditingItemName(e.target.value)}
      onBlur={handleRenameSubmit}
      onKeyDown={(e) => {
        if (e.key === 'Enter') handleRenameSubmit();
        if (e.key === 'Escape') setEditingItemId(null);
      }}
      onClick={(e) => e.stopPropagation()}
      style={{ border: '1px solid #ccc', borderRadius: '4px', padding: '2px 6px', fontSize: '13px', outline: 'none', width: '100%', boxSizing: 'border-box' }}
    />
  );

  return (
    <div className="layout-container">
      <Sidebar />
      <div className="main-content">
        <Topbar actionText="New Folder" onAction={() => setShowNewFolderModal(true)} />
        
        {/* NEW FOLDER MODAL */}
        {showNewFolderModal && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
            <div style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '8px', width: '300px', boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}>
              <h3 style={{ marginTop: 0, marginBottom: '15px', fontSize: '16px' }}>Create New Folder</h3>
              <input 
                autoFocus
                type="text" 
                placeholder="Folder name" 
                value={newFolderName}
                onChange={e => setNewFolderName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    if (newFolderName.trim()) {
                      setVirtualFolders(prev => [...prev, { id: Date.now().toString(), name: newFolderName.trim(), parentPath: currentPath.join('/') }]);
                      setShowNewFolderModal(false);
                      setNewFolderName('');
                    }
                  }
                }}
                style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd', marginBottom: '15px', boxSizing: 'border-box' }}
              />
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button onClick={() => { setShowNewFolderModal(false); setNewFolderName(''); }} style={{ padding: '6px 12px', background: '#f5f5f5', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Cancel</button>
                <button 
                  onClick={() => {
                    if (newFolderName.trim()) {
                      setVirtualFolders(prev => [...prev, { id: Date.now().toString(), name: newFolderName.trim(), parentPath: currentPath.join('/') }]);
                      setShowNewFolderModal(false);
                      setNewFolderName('');
                    }
                  }} 
                  style={{ padding: '6px 12px', background: '#000', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                >
                  Create
                </button>
              </div>
            </div>
          </div>
        )}

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
              <span className="filter-label">ORDER BY:</span>
              <span 
                className={`filter-chip ${orderBy === 'creation' ? 'active' : ''}`}
                onClick={() => setOrderBy('creation')}
                style={{ backgroundColor: orderBy === 'creation' ? '#e0e0e0' : undefined }}
              >Creation Date</span>
              <span 
                className={`filter-chip ${orderBy === 'modification' ? 'active' : ''}`}
                onClick={() => setOrderBy('modification')}
                style={{ backgroundColor: orderBy === 'modification' ? '#e0e0e0' : undefined }}
              >Modification Date</span>
              <span 
                className={`filter-chip ${orderBy === 'size' ? 'active' : ''}`}
                onClick={() => setOrderBy('size')}
                style={{ backgroundColor: orderBy === 'size' ? '#e0e0e0' : undefined }}
              >Size</span>
              <span 
                className={`filter-chip ${orderBy === 'name' ? 'active' : ''}`}
                onClick={() => setOrderBy('name')}
                style={{ backgroundColor: orderBy === 'name' ? '#e0e0e0' : undefined }}
              >Name</span>
              <span 
                className={`filter-chip ${orderBy === 'type' ? 'active' : ''}`}
                onClick={() => setOrderBy('type')}
                style={{ backgroundColor: orderBy === 'type' ? '#e0e0e0' : undefined }}
              >Type</span>
            </div>
          </div>

          <div className="db-content">
            <div className="db-toolbar">
              <div className="breadcrumbs">
                {currentPath.map((crumb, idx) => (
                  <span key={idx} style={{ display: 'flex', alignItems: 'center' }}>
                    <span 
                      style={{ cursor: idx === 0 ? 'default' : 'pointer', color: idx === currentPath.length - 1 ? '#000' : '#666' }}
                      onClick={() => { if (idx > 0) navigateToBreadcrumb(idx) }}
                    >
                      {crumb}
                    </span>
                    {idx < currentPath.length - 1 && <span className="separator" style={{ margin: '0 8px', color: '#ccc' }}>›</span>}
                  </span>
                ))}
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
                {viewMode === 'grid' && currentPage === 1 && (
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
                
                {viewMode === 'list' && currentPage === 1 && (
                  <div 
                    className="list-item" 
                    style={{ borderStyle: 'dashed', backgroundColor: '#fafafa', justifyContent: 'center', gap: '10px', cursor: 'pointer' }}
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

                {paginatedItems.map((item) => (
                  item.isFolder ? (
                    // FOLDER RENDER
                    viewMode === 'grid' ? (
                      <div className="db-card" key={item.id} onClick={() => { if (editingItemId !== item.id) navigateToFolder(item.name) }} style={{ cursor: 'pointer', backgroundColor: '#fdfdfd' }}>
                        <Folder size={32} color="#555" style={{ marginBottom: '12px' }} />
                        <div className="db-card-actions" onClick={(e) => toggleMenu(e, item.id)}>
                          <MoreVertical size={16} />
                        </div>
                        {activeMenuId === item.id && (
                          <div className="db-dropdown-menu">
                            <button className="db-dropdown-item" onClick={(e) => handleRename(e, item.id, 'folder', item.name)}>
                              <Edit2 size={14} /> Rename
                            </button>
                            <button className="db-dropdown-item danger" onClick={(e) => handleDeleteFolder(e, item.id)}>
                              <Trash2 size={14} /> Delete
                            </button>
                          </div>
                        )}
                        <div className="card-title" title={item.name}>
                          {editingItemId === item.id ? renderInlineEdit(item.id, 'folder') : item.name}
                        </div>
                        <div className="card-meta-row">
                          <span>Folder</span>
                        </div>
                      </div>
                    ) : (
                      <div className="list-item" key={item.id} onClick={() => { if (editingItemId !== item.id) navigateToFolder(item.name) }} style={{ cursor: 'pointer' }}>
                        <div className="list-item-left">
                           <Folder size={20} color="#555" />
                           {editingItemId === item.id ? (
                             <div style={{ flex: 1 }}>{renderInlineEdit(item.id, 'folder')}</div>
                           ) : (
                             <span style={{ fontWeight: 600, fontSize: '13px' }}>{item.name}</span>
                           )}
                        </div>
                        <div className="list-item-right">
                           <span>FOLDER</span>
                           <span>—</span>
                           <span>—</span>
                           <div style={{ position: 'relative' }}>
                             <div className="db-card-actions" style={{ position: 'static' }} onClick={(e) => toggleMenu(e, item.id)}>
                               <MoreVertical size={16} />
                             </div>
                             {activeMenuId === item.id && (
                                <div className="db-dropdown-menu" style={{ right: 0, top: '24px' }}>
                                  <button className="db-dropdown-item" onClick={(e) => handleRename(e, item.id, 'folder', item.name)}>
                                    <Edit2 size={14} /> Rename
                                  </button>
                                  <button className="db-dropdown-item danger" onClick={(e) => handleDeleteFolder(e, item.id)}>
                                    <Trash2 size={14} /> Delete
                                  </button>
                                </div>
                              )}
                           </div>
                        </div>
                      </div>
                    )
                  ) : (
                    // FILE RENDER
                    viewMode === 'grid' ? (
                      <div className="db-card" key={item.id}>
                        {getFileIcon(item.type_mime)}
                        
                        <div className="db-card-actions" onClick={(e) => toggleMenu(e, item.id)}>
                          <MoreVertical size={16} />
                        </div>
                        
                        {activeMenuId === item.id && (
                          <div className="db-dropdown-menu">
                            <button className="db-dropdown-item" onClick={(e) => handleRename(e, item.id, 'file', item.nom_fichier)}>
                              <Edit2 size={14} /> Rename
                            </button>
                            <button className="db-dropdown-item danger" onClick={(e) => handleDelete(e, item.id)}>
                              <Trash2 size={14} /> Delete
                            </button>
                          </div>
                        )}

                        <div className="card-title" title={item.nom_fichier}>
                          {editingItemId === item.id ? renderInlineEdit(item.id, 'file') : item.nom_fichier}
                        </div>
                        <div className="card-meta-row">
                          <span>{item.type_mime?.split('/')[1]?.toUpperCase() || 'FILE'} • {formatSize(item.taille_octets)}</span>
                          <span>{formatDate(item.date_creation)}</span>
                        </div>
                      </div>
                    ) : (
                      <div className="list-item" key={item.id}>
                        <div className="list-item-left">
                           {getFileIcon(item.type_mime)}
                           {editingItemId === item.id ? (
                             <div style={{ flex: 1 }}>{renderInlineEdit(item.id, 'file')}</div>
                           ) : (
                             <span style={{ fontWeight: 600, fontSize: '13px' }}>{item.nom_fichier}</span>
                           )}
                        </div>
                        <div className="list-item-right">
                           <span>{item.type_mime?.split('/')[1]?.toUpperCase() || 'FILE'}</span>
                           <span>{formatSize(item.taille_octets)}</span>
                           <span>{formatDate(item.date_creation)}</span>
                           <div style={{ position: 'relative' }}>
                             <div className="db-card-actions" style={{ position: 'static' }} onClick={(e) => toggleMenu(e, item.id)}>
                               <MoreVertical size={16} />
                             </div>
                             {activeMenuId === item.id && (
                                <div className="db-dropdown-menu" style={{ right: 0, top: '24px' }}>
                                  <button className="db-dropdown-item" onClick={(e) => handleRename(e, item.id, 'file', item.nom_fichier)}>
                                    <Edit2 size={14} /> Rename
                                  </button>
                                  <button className="db-dropdown-item danger" onClick={(e) => handleDelete(e, item.id)}>
                                    <Trash2 size={14} /> Delete
                                  </button>
                                </div>
                              )}
                           </div>
                        </div>
                      </div>
                    )
                  )
                ))}
              </div>
            )}

            {!loading && (
              <div className="pagination">
                <div className="page-info">Showing {paginatedItems.length} items of {totalItems}</div>
                <div className="page-controls">
                  <button 
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    style={{ opacity: currentPage === 1 ? 0.5 : 1, cursor: currentPage === 1 ? 'not-allowed' : 'pointer', background: 'none', border: 'none' }}
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <span style={{ margin: '0 10px', fontSize: '14px', fontWeight: '500' }}>Page {currentPage} of {totalPages}</span>
                  <button 
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    style={{ opacity: currentPage === totalPages ? 0.5 : 1, cursor: currentPage === totalPages ? 'not-allowed' : 'pointer', background: 'none', border: 'none' }}
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}