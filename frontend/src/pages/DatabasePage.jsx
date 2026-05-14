import React, { useState, useEffect, useRef } from 'react';
import { fileService } from '../services/fileService';

export default function DatabasePage() {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  const fileInputRef = useRef(null);

  const fetchFiles = async () => {
    setLoading(true);
    try {
      // Assuming fileService.listFiles() returns { data: [...] }
      const response = await fileService.listFiles();
      setFiles(response.data || []);
    } catch (error) {
      console.error('Error fetching files:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFiles();
  }, []);

  const handleUploadClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = async (event) => {
    const selectedFile = event.target.files[0];
    if (!selectedFile) return;

    setUploading(true);
    try {
      await fileService.uploadFile(selectedFile);
      await fetchFiles(); // Refresh list
    } catch (error) {
      console.error('Error uploading file:', error);
      alert('Failed to upload file');
    } finally {
      setUploading(false);
      // reset input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleSearch = async () => {
    setLoading(true);
    try {
      if (!searchQuery.trim()) {
        await fetchFiles();
      } else {
        const response = await fileService.searchFiles(searchQuery);
        setFiles(response.data || []);
      }
    } catch (error) {
      console.error('Error searching files:', error);
    } finally {
      setLoading(false);
    }
  };

  // Helper to format date
  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: '2-digit' });
  };

  // Helper to format size
  const formatSize = (bytes) => {
    if (!bytes) return '0 KB';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const getFileIcon = (filename) => {
    if (!filename) return 'description';
    const lower = filename.toLowerCase();
    if (lower.endsWith('.pdf')) return 'picture_as_pdf';
    if (lower.endsWith('.doc') || lower.endsWith('.docx')) return 'description';
    if (lower.endsWith('.xls') || lower.endsWith('.xlsx')) return 'table_chart';
    if (lower.endsWith('.png') || lower.endsWith('.jpg') || lower.endsWith('.jpeg')) return 'image';
    return 'description';
  };

  return (
    <div className="w-full h-full p-margin-mobile md:p-margin-desktop max-w-container-max mx-auto">
      {/* Large Search Area */}
      <section className="mb-section-gap pt-12 flex flex-col items-center text-center">
        <h1 className="font-headline-lg-mobile md:font-headline-lg text-headline-lg-mobile md:text-headline-lg text-primary mb-8 tracking-tight">
          Database Explorer
        </h1>
        <div className="w-full max-w-2xl relative">
          <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-secondary text-xl">search</span>
          <input 
            type="text" 
            className="w-full bg-surface-bright border border-border-subtle rounded py-4 pl-12 pr-4 text-body-lg font-body-lg text-primary focus:outline-none focus:border-primary transition-colors shadow-sm placeholder:text-secondary-fixed-dim" 
            placeholder="Search legal documents, case files, or precedents..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          />
          <button 
            onClick={handleSearch}
            className="absolute right-2 top-1/2 -translate-y-1/2 px-4 py-2 bg-surface-muted border border-border-subtle rounded font-body-md text-body-md text-text-charcoal hover:bg-border-subtle transition-colors"
          >
            Search
          </button>
        </div>
        
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <span className="font-label-caps text-label-caps text-secondary uppercase tracking-wider mr-2 self-center">Quick Filters:</span>
          <button className="px-3 py-1 bg-surface-muted text-text-charcoal font-code-sm text-code-sm rounded hover:bg-border-subtle transition-colors">Contracts</button>
          <button className="px-3 py-1 bg-surface-muted text-text-charcoal font-code-sm text-code-sm rounded hover:bg-border-subtle transition-colors">Litigation</button>
          <button className="px-3 py-1 bg-surface-muted text-text-charcoal font-code-sm text-code-sm rounded hover:bg-border-subtle transition-colors">M&A</button>
          <button className="px-3 py-1 bg-surface-muted text-text-charcoal font-code-sm text-code-sm rounded hover:bg-border-subtle transition-colors">IP</button>
        </div>
      </section>

      {/* Breadcrumbs & Actions */}
      <div className="flex justify-between items-end border-b border-border-subtle pb-4 mb-8">
        <div className="flex items-center gap-2 text-secondary font-body-md text-body-md">
          <a href="#" className="hover:text-primary transition-colors">Root</a>
          <span className="material-symbols-outlined text-sm">chevron_right</span>
          <a href="#" className="hover:text-primary transition-colors">Corporate</a>
          <span className="material-symbols-outlined text-sm">chevron_right</span>
          <span className="text-primary font-medium">Q3 Filings</span>
        </div>
        <div className="flex gap-3">
          <button className="p-2 border border-border-subtle rounded text-secondary hover:text-primary hover:border-primary transition-colors flex items-center justify-center">
            <span className="material-symbols-outlined text-sm">filter_list</span>
          </button>
          <button className="p-2 border border-border-subtle rounded text-secondary hover:text-primary hover:border-primary transition-colors flex items-center justify-center">
            <span className="material-symbols-outlined text-sm">grid_view</span>
          </button>
        </div>
      </div>

      {/* Grid Layout */}
      <section className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-stack-gap pb-12">
        {loading ? (
          <div className="col-span-full flex justify-center py-12 text-secondary font-code-sm">
            Loading documents...
          </div>
        ) : (
          <>
            {/* Static Folder Cards (Preserved from UI Design) */}
            <div className="group bg-surface-bright border border-border-subtle rounded p-5 hover:border-primary transition-colors cursor-pointer flex flex-col h-full">
              <div className="flex justify-between items-start mb-4">
                <div className="w-10 h-10 bg-surface-muted rounded flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-on-primary transition-colors">
                  <span className="material-symbols-outlined" style={{fontVariationSettings: "'FILL' 1"}}>folder</span>
                </div>
                <button className="text-secondary opacity-0 group-hover:opacity-100 transition-opacity"><span className="material-symbols-outlined text-sm">more_vert</span></button>
              </div>
              <div className="mt-auto">
                <h3 className="font-body-md text-body-md text-primary font-medium truncate mb-1">Acquisition Documents</h3>
                <p className="font-code-sm text-code-sm text-secondary">124 items</p>
              </div>
            </div>

            <div className="group bg-surface-bright border border-border-subtle rounded p-5 hover:border-primary transition-colors cursor-pointer flex flex-col h-full">
              <div className="flex justify-between items-start mb-4">
                <div className="w-10 h-10 bg-surface-muted rounded flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-on-primary transition-colors">
                  <span className="material-symbols-outlined" style={{fontVariationSettings: "'FILL' 1"}}>folder</span>
                </div>
                <button className="text-secondary opacity-0 group-hover:opacity-100 transition-opacity"><span className="material-symbols-outlined text-sm">more_vert</span></button>
              </div>
              <div className="mt-auto">
                <h3 className="font-body-md text-body-md text-primary font-medium truncate mb-1">Board Minutes</h3>
                <p className="font-code-sm text-code-sm text-secondary">45 items</p>
              </div>
            </div>

            <div className="group bg-surface-bright border border-border-subtle rounded p-5 hover:border-primary transition-colors cursor-pointer flex flex-col h-full">
              <div className="flex justify-between items-start mb-4">
                <div className="w-10 h-10 bg-surface-muted rounded flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-on-primary transition-colors">
                  <span className="material-symbols-outlined" style={{fontVariationSettings: "'FILL' 1"}}>folder</span>
                </div>
                <button className="text-secondary opacity-0 group-hover:opacity-100 transition-opacity"><span className="material-symbols-outlined text-sm">more_vert</span></button>
              </div>
              <div className="mt-auto">
                <h3 className="font-body-md text-body-md text-primary font-medium truncate mb-1">Financial Disclosures</h3>
                <p className="font-code-sm text-code-sm text-secondary">89 items</p>
              </div>
            </div>

            {/* Dynamic Rendered Files */}
            {files.map((file) => (
              <div key={file.id} className="group bg-surface-bright border border-border-subtle rounded p-5 hover:border-primary transition-colors cursor-pointer flex flex-col h-full">
                <div className="flex justify-between items-start mb-4">
                  <div className="w-10 h-10 bg-surface-muted rounded flex items-center justify-center text-secondary border border-border-subtle">
                    <span className="material-symbols-outlined text-xl">{getFileIcon(file.nom_fichier)}</span>
                  </div>
                  <button 
                    className="text-secondary opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-surface-muted rounded"
                    onClick={(e) => {
                      e.stopPropagation();
                      // delete implementation could go here
                    }}
                  >
                    <span className="material-symbols-outlined text-sm">more_vert</span>
                  </button>
                </div>
                <div className="mt-auto overflow-hidden">
                  <h3 className="font-body-md text-body-md text-primary font-medium truncate mb-1" title={file.nom_fichier}>
                    {file.nom_fichier || 'Untitled Document'}
                  </h3>
                  <div className="flex justify-between items-center">
                    <span className="font-code-sm text-code-sm text-secondary truncate mr-2">
                      {file.nom_fichier?.split('.').pop()?.toUpperCase() || 'FILE'} • {file.taille_ko ? formatSize(file.taille_ko * 1024) : 'Unknown'}
                    </span>
                    <span className="font-code-sm text-code-sm text-tertiary-fixed-dim whitespace-nowrap">
                      {formatDate(file.date_creation || new Date().toISOString())}
                    </span>
                  </div>
                </div>
              </div>
            ))}

            {/* Empty Slot / Upload Area */}
            <div 
              className={`bg-surface-muted border border-dashed border-border-subtle rounded p-5 flex flex-col items-center justify-center h-full text-center cursor-pointer min-h-[160px] ${uploading ? 'opacity-50' : 'hover:bg-surface-bright transition-colors'}`}
              onClick={!uploading ? handleUploadClick : undefined}
            >
              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                onChange={handleFileChange}
              />
              {uploading ? (
                <>
                  <span className="material-symbols-outlined text-secondary mb-2 text-2xl animate-pulse">cloud_upload</span>
                  <span className="font-body-md text-body-md text-primary font-medium">Uploading...</span>
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-secondary mb-2 text-2xl">upload_file</span>
                  <span className="font-body-md text-body-md text-primary font-medium">Upload File</span>
                  <span className="font-code-sm text-code-sm text-secondary mt-1">Click or Drop</span>
                </>
              )}
            </div>
          </>
        )}
      </section>
      
      {/* Pagination / Footer area */}
      {!loading && (
        <div className="mt-4 pt-6 border-t border-border-subtle flex justify-between items-center text-secondary font-code-sm text-code-sm pb-12">
          <span>Showing {files.length > 0 ? `1-${files.length}` : '0'} of {files.length} items</span>
          <div className="flex gap-2">
            <button className="p-1 hover:text-primary transition-colors"><span className="material-symbols-outlined text-sm">chevron_left</span></button>
            <span className="px-2 self-center">Page 1 of 1</span>
            <button className="p-1 hover:text-primary transition-colors"><span className="material-symbols-outlined text-sm">chevron_right</span></button>
          </div>
        </div>
      )}
    </div>
  );
}
