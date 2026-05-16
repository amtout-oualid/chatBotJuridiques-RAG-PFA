import React from 'react';
import { Search } from 'lucide-react';

const Topbar = ({ activeTab }) => {
  return (
    <div className="topbar">
      <div className="topbar-left">
        <div className="brand-name">Lexis Legal</div>
        <div className="topbar-nav">
          <span className={activeTab === 'drafts' ? 'active' : ''}>Drafts</span>
          <span className={activeTab === 'recent' ? 'active' : ''}>Recent</span>
          <span className={activeTab === 'starred' ? 'active' : ''}>Starred</span>
        </div>
      </div>
      <div className="topbar-center">
        <div className="search-bar">
          <Search size={16} color="#999" />
          <input type="text" placeholder="Search context..." />
        </div>
      </div>
      <div className="topbar-right">
        <div className="sign-in">SIGN IN</div>
        <button className="btn-dark">NEW DOCUMENT</button>
      </div>
    </div>
  );
};

export default Topbar;
