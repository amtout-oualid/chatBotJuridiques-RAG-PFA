import React from 'react';
import Sidebar from '../components/Sidebar';
import { Plus, Folder, File, Settings, FileText, FileCode, MoreHorizontal, MessageSquare, Send, Paperclip } from 'lucide-react';
import './LatexEditorPage.css';

const LatexEditorPage = () => {
  return (
    <div className="layout-container">
      <Sidebar activePage="latex" hideText={true} />
      
      <div className="workspace-sidebar">
        <div className="ws-header">
          <span>WORKSPACE</span>
          <Plus size={16} cursor="pointer" />
        </div>
        
        <div className="ws-nav">
          <div className="ws-folder">
            <div className="ws-item">
              <Folder size={14} />
              <span>src</span>
            </div>
            <div className="ws-subitems">
              <div className="ws-item active">
                <FileCode size={14} />
                <span>main.tex</span>
              </div>
              <div className="ws-item">
                <FileCode size={14} />
                <span>abstract.tex</span>
              </div>
              <div className="ws-item">
                <FileCode size={14} />
                <span>methods.tex</span>
              </div>
            </div>
          </div>
          
          <div className="ws-item">
            <Folder size={14} />
            <span>figures</span>
          </div>
          
          <div className="ws-item" style={{ marginTop: '20px' }}>
            <Settings size={14} />
            <span>preamble.sty</span>
          </div>
          <div className="ws-item">
            <FileText size={14} />
            <span>references.bib</span>
          </div>
        </div>
      </div>

      <div className="editor-main">
        <div className="editor-topbar">
          <div className="editor-topbar-left">
            <div className="doc-status">
              <FileCode size={16} color="#666" />
              <span className="doc-name">main.tex</span>
              <span className="dot"></span>
              <span className="status-text">Saved</span>
            </div>
            <div className="view-toggle">
              <span className="toggle-btn">CODE VIEW</span>
              <span className="toggle-btn active">VISUAL VIEW</span>
            </div>
          </div>
          <div className="editor-topbar-right">
            <div className="assistant-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Settings size={16} />
                <span>ASSISTANT</span>
              </div>
              <MoreHorizontal size={16} cursor="pointer" />
            </div>
          </div>
        </div>

        <div className="editor-content-area">
          <div className="visual-editor">
            <div className="document-page">
              <h1 className="doc-title">A Novel Framework for Artificial Intelligence in Legal Discovery</h1>
              <div className="doc-authors">
                <p>Jane Doe¹ and John Smith²</p>
                <p className="affiliations">
                  ¹Department of Computer Science, University of Technology<br/>
                  ²Faculty of Law, State University
                </p>
              </div>
              
              <h2 className="doc-heading">Abstract</h2>
              <div className="doc-body">
                This paper presents a comprehensive framework for the integration of large language models (LLMs) into the electronic discovery (e-discovery) process. We propose a pipeline that significantly reduces manual review time while maintaining high precision and recall in document categorization. Our methodology introduces a novel prompting strategy designed specifically for complex legal terminology and ambiguous contexts.
              </div>
              <h2 className="doc-heading" style={{ marginTop: '40px' }}>1 Introduction</h2>
            </div>
          </div>
          
          <div className="assistant-sidebar">
            <div className="assistant-messages">
              <div className="assistant-message-header">
                <div className="ai-avatar">Lx</div>
                <span>Lexis AI</span>
              </div>
              <div className="assistant-bubble">
                I noticed you mentioned predictive coding in the introduction. Would you like me to suggest some recent citations comparing LLM performance against traditional TAR 2.0 protocols?
              </div>
              <div className="assistant-actions">
                <button className="action-btn">Yes, insert citations</button>
                <button className="action-btn">Show me first</button>
              </div>

              <div className="context-sources-section">
                <div className="context-header">CONTEXT SOURCES</div>
                <div className="source-chip">
                  <FileText size={12} />
                  <span>smith_et_al_2023.pdf</span>
                </div>
                <div className="source-chip">
                  <FileText size={12} />
                  <span>tar_guidelines.pdf</span>
                </div>
              </div>
            </div>

            <div className="assistant-input-area">
              <div className="assistant-input-box">
                <input type="text" placeholder="Ask about the document..." />
                <Send size={16} color="#999" style={{ cursor: 'pointer' }} />
              </div>
              <div className="assistant-footer">
                <span>Ctrl+Enter to send</span>
                <Paperclip size={14} color="#999" style={{ cursor: 'pointer' }} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LatexEditorPage;
