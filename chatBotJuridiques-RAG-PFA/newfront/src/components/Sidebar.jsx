import React from 'react';
import { MessageSquare, Database, PenTool, Book, Settings } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Sidebar = ({ activePage, hideText = false }) => {
  const navigate = useNavigate();

  return (
    <div className="sidebar" style={{ width: hideText ? '60px' : '80px' }}>
      <div className="sidebar-logo">
        {hideText ? 'L.' : 'Lx'}
      </div>
      <div className="sidebar-nav">
        <div 
          className={`sidebar-item ${activePage === 'chat' ? 'active' : ''}`}
          onClick={() => navigate('/chat')}
        >
          <MessageSquare size={hideText ? 24 : 20} strokeWidth={1.5} />
          {!hideText && <span>Chat</span>}
        </div>
        <div 
          className={`sidebar-item ${activePage === 'database' ? 'active' : ''}`}
          onClick={() => navigate('/database')}
        >
          <Database size={hideText ? 24 : 20} strokeWidth={1.5} />
          {!hideText && <span>Database</span>}
        </div>
        <div 
          className={`sidebar-item ${activePage === 'latex' ? 'active' : ''}`}
          onClick={() => navigate('/latex')}
        >
          <PenTool size={hideText ? 24 : 20} strokeWidth={1.5} />
          {!hideText && <span>{activePage === 'chat' ? 'LaTeX' : 'LaTeX Editor'}</span>}
        </div>
        <div 
          className={`sidebar-item ${activePage === 'library' ? 'active' : ''}`}
        >
          <Book size={hideText ? 24 : 20} strokeWidth={1.5} />
          {!hideText && <span>Library</span>}
        </div>
      </div>
      <div className="sidebar-bottom">
        {!hideText ? (
          <Settings size={20} strokeWidth={1.5} color="#666" />
        ) : (
          <div style={{ width: 30, height: 30, borderRadius: '50%', backgroundColor: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 12 }}>
            L
          </div>
        )}
      </div>
    </div>
  );
};

export default Sidebar;
