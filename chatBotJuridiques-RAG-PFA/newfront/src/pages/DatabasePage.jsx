import React from 'react';
import Sidebar from '../components/Sidebar';
import Topbar from '../components/Topbar';
import { Search, Folder, FileText, FileSpreadsheet, File, Upload, LayoutGrid, List as ListIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import './DatabasePage.css';

const DatabasePage = () => {
  return (
    <div className="layout-container">
      <Sidebar activePage="database" />
      <div className="main-content">
        <Topbar activeTab="" />
        <div className="database-area">
          <div className="database-header-center">
            <h1>Database Explorer</h1>
            
            <div className="db-search-container">
              <Search size={18} color="#999" />
              <input type="text" placeholder="Search legal documents, case files, or precedents..." />
              <button className="db-search-btn">Search</button>
            </div>

            <div className="quick-filters">
              <span className="filter-label">QUICK FILTERS:</span>
              <span className="filter-chip">Contracts</span>
              <span className="filter-chip">Litigation</span>
              <span className="filter-chip">M&A</span>
              <span className="filter-chip">IP</span>
            </div>
          </div>

          <div className="db-content">
            <div className="db-toolbar">
              <div className="breadcrumbs">
                <span>Root</span>
                <span className="separator">›</span>
                <span>Corporate</span>
                <span className="separator">›</span>
                <span className="current">Q3 Filings</span>
              </div>
              <div className="view-toggles">
                <button className="view-btn"><ListIcon size={16} /></button>
                <button className="view-btn active"><LayoutGrid size={16} /></button>
              </div>
            </div>

            <div className="db-grid">
              <div className="db-card">
                <Folder size={20} className="card-icon" />
                <div className="card-title">Acquisition Documents</div>
                <div className="card-meta">124 items</div>
              </div>
              <div className="db-card">
                <Folder size={20} className="card-icon" />
                <div className="card-title">Board Minutes</div>
                <div className="card-meta">45 items</div>
              </div>
              <div className="db-card">
                <Folder size={20} className="card-icon" />
                <div className="card-title">Financial Disclosures</div>
                <div className="card-meta">89 items</div>
              </div>
              <div className="db-card">
                <FileText size={20} className="card-icon" />
                <div className="card-title">Q3_Earnings_Report_...</div>
                <div className="card-meta-row">
                  <span>PDF • 2.4 MB</span>
                  <span>Oct 12</span>
                </div>
              </div>
              <div className="db-card">
                <File size={20} className="card-icon" />
                <div className="card-title">Merger_Agreement_D...</div>
                <div className="card-meta-row">
                  <span>DOCX • 1.1 MB</span>
                  <span>Oct 10</span>
                </div>
              </div>
              <div className="db-card">
                <File size={20} className="card-icon" />
                <div className="card-title">Employee_Stock_Opti...</div>
                <div className="card-meta-row">
                  <span>DOCX • 840 KB</span>
                  <span>Oct 05</span>
                </div>
              </div>
              <div className="db-card">
                <FileSpreadsheet size={20} className="card-icon" />
                <div className="card-title">Cap_Table_Analysis_Q...</div>
                <div className="card-meta-row">
                  <span>XLSX • 3.2 MB</span>
                  <span>Sep 28</span>
                </div>
              </div>
              <div className="db-card upload-card">
                <Upload size={20} className="card-icon" />
                <div className="card-title">Upload File</div>
                <div className="card-meta">Drag and drop</div>
              </div>
            </div>

            <div className="pagination">
              <div className="page-info">Showing 1-7 of 24 items in Corporate/Q3 Filings</div>
              <div className="page-controls">
                <button><ChevronLeft size={16} /></button>
                <span>Page 1 of 4</span>
                <button><ChevronRight size={16} /></button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DatabasePage;
