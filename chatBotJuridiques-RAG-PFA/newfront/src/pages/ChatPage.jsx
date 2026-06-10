import React from 'react';
import Sidebar from '../components/Sidebar';
import Topbar from '../components/Topbar';
import { Plus, Edit2, ArrowUp, XSquare } from 'lucide-react';
import './ChatPage.css';

const ChatPage = () => {
  return (
    <div className="layout-container">
      <Sidebar activePage="chat" />
      <div className="secondary-sidebar">
        <button className="new-chat-btn">
          <span>NEW CHAT</span>
          <Plus size={16} />
        </button>
        
        <div className="sidebar-section">
          <div className="section-title">PINNED</div>
          <div className="nav-item active">Alpha Corp M&A Terms</div>
          <div className="nav-item">IP Infringement Precedent</div>
        </div>

        <div className="sidebar-section">
          <div className="section-title">RECENT</div>
          <div className="nav-item">Employment Contract Draft v2</div>
          <div className="nav-item">Subpoena Compliance Check</div>
          <div className="nav-item">Case Summary: Smith v. Jones</div>
        </div>
      </div>

      <div className="main-content">
        <Topbar activeTab="recent" />
        <div className="chat-area">
          <div className="chat-history">
            <div className="chat-header-center">
              <div className="icon-box">
                <Edit2 size={24} strokeWidth={1.5} />
              </div>
              <h1>Alpha Corp M&A Terms</h1>
              <p>I am ready to analyze the merger agreement. You can paste<br/>clauses or ask for specific precedent comparisons.</p>
            </div>

            <div className="user-message">
              <p>Please review Section 4.2 (Indemnification) of the uploaded draft and highlight any non-standard deviations from typical Delaware corporate law practice regarding survival periods.</p>
            </div>

            <div className="ai-message">
              <p>I have analyzed Section 4.2 (Indemnification) of the provided draft against standard Delaware corporate M&A precedents.</p>
              <p>Key Findings:</p>
              <ul>
                <li>The proposed survival period for general representations and warranties is set at <strong>24 months</strong>. This is notably longer than the typical 12-18 month standard observed in recent mid-market Delaware transactions.</li>
                <li>The Fundamental Representations are stated to survive indefinitely, which is standard practice.</li>
                <li>There is an unusual carve-out regarding the definition of "Losses" that excludes consequential damages even if reasonably foreseeable.</li>
              </ul>
              <div className="code-block">
                <span className="code-header">Draft excerpt (Sec 4.2.a):</span>
                <span>"...shall survive the Closing and shall terminate on the twenty-four (24) month anniversary of the"</span>
              </div>
            </div>
          </div>

          <div className="chat-input-container">
            <div className="chat-input-box">
              <Plus size={20} className="input-icon" color="#666" />
              <input type="text" placeholder="Message Lexis AI or type '/' for commands..." />
              <button className="send-btn">
                <ArrowUp size={16} color="#fff" />
              </button>
            </div>
            <div className="disclaimer">
              Lexis AI can make mistakes. Consider verifying critical legal assertions.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatPage;
