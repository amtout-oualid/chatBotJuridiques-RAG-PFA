import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, Clock, FileText, Lock, Zap, Shield, HelpCircle, ChevronRight, MessageSquare, Database, Edit2 } from 'lucide-react';
import './LandingPage.css';

const LandingPage = () => {
  const navigate = useNavigate();

  return (
    <div className="landing-container">
      <nav className="landing-nav">
        <div className="nav-logo">LEXIS LAW</div>
        <div className="nav-links">
          <span>Use Cases</span>
          <span>How it Works</span>
          <span>The Ecosystem</span>
          <span>Reviews</span>
          <span>FAQ</span>
        </div>
        <div className="nav-actions">
          <span className="sign-in-link">Sign In</span>
          <button className="get-started-btn" onClick={() => navigate('/chat')}>Get Started</button>
        </div>
      </nav>

      <section className="hero-section">
        <div className="hero-pill">AUTOMATED LEGAL INTELLIGENCE</div>
        <h1 className="hero-title">Elite Legal Power,<br/>Accessible to Everyone</h1>
        <p className="hero-subtitle">
          Whether you are navigating a personal legal dispute or optimizing<br/>
          your law practice, Lexis Law gives you instant, fact-checked<br/>
          answers and generates professional legal documents in seconds.
        </p>
        <div className="hero-buttons">
          <button className="btn-primary" onClick={() => navigate('/chat')}>Ask a Legal Question</button>
          <button className="btn-secondary">Explore Pro Features</button>
        </div>
      </section>

      <section className="dark-stats-section">
        <div className="dark-pill">MEET YOUR NEW AI</div>
        <h2>Stop guessing about your rights</h2>
        <p>Generate AI chat that returns exact answers. Visitors can actually reach the law. We<br/>built a highly secure intelligence engine that searches through real legal<br/>libraries and your private documents to give you clarity and confidence.</p>
        
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon"><Clock size={16} /></div>
            <div className="stat-content">
              <div className="stat-label">AVG RESPONSE TIME</div>
              <div className="stat-value">0.5s</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon"><FileText size={16} /></div>
            <div className="stat-content">
              <div className="stat-label">DOCUMENT GENERATION</div>
              <div className="stat-value">Instant</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon"><Zap size={16} /></div>
            <div className="stat-content">
              <div className="stat-label">ESTIMATED COST</div>
              <div className="stat-value">$25-250</div>
            </div>
          </div>
        </div>
      </section>

      <section className="trusted-section">
        <h2>Trusted by Everyday People and Legal<br/>Professionals</h2>
        <p>From individuals drafting DIY prenups to litigators searching complex case files,<br/>our platform scales to your exact requirements.</p>
        
        <div className="features-pill-grid">
          <div className="feature-pill">Fact-Checked Answers</div>
          <div className="feature-pill">Bank-Grade Security</div>
          <div className="feature-pill">Instant PDF Generation</div>
          <div className="feature-pill">LaTeX Formatting</div>
          <div className="feature-pill">Private Databases</div>
          <div className="feature-pill">Real Precedents</div>
          <div className="feature-pill">Zero Latency</div>
          <div className="feature-pill">Deterministic AI</div>
        </div>
      </section>

      <section className="clarity-section">
        <div className="clarity-left">
          <div className="clarity-pill">OUR PLATFORM</div>
          <h2>Clarity and<br/>power, without<br/>the hourly fees</h2>
          <p>Skip the confusing legal jargon and expensive<br/>consultations for basic research. We empower you to<br/>understand your situation, review contracts, and take<br/>definitive legal action.</p>
        </div>
        <div className="clarity-right">
          <div className="clarity-card">
            <Shield size={20} className="card-icon" />
            <h3>Fact-Checked Answers</h3>
            <p>Lexis AI cross-references thousands of legal precedents across specific jurisdictions to tell you exactly where your situation stands today.</p>
          </div>
          <div className="clarity-card">
            <FileText size={20} className="card-icon" />
            <h3>Instant Document Generation</h3>
            <p>Export perfectly formatted PDFs for a contract, business professional, court filing, or NDA instantaneously.</p>
          </div>
          <div className="clarity-card">
            <Lock size={20} className="card-icon" />
            <h3>Total Privacy & Security</h3>
            <p>Your documents are strictly your business. We use SOC-2 compliance so your data is never shared or leaked.</p>
          </div>
          <div className="clarity-card">
            <Zap size={20} className="card-icon" />
            <h3>Zero Time & Money</h3>
            <p>Get clarity on your legal situation in minutes, not weeks. Perfect for both individuals and busy lawyers.</p>
          </div>
        </div>
      </section>

      <section className="common-questions-section">
        <div className="cq-header">
          <h2>Common Questions</h2>
          <button className="faq-btn">FAQ</button>
        </div>
        <div className="cq-grid">
          <div className="cq-card">
            <div className="cq-image img-1"></div>
            <div className="cq-content">
              <h3>For Individuals & Businesses</h3>
              <p>Everything you need to know about everyday law, safely and effectively.</p>
              <div className="cq-features">
                <div className="cq-feature"><Check size={14} /> Plain language answers to complex legal questions</div>
                <div className="cq-feature"><Check size={14} /> Create, edit and format standard contracts</div>
              </div>
              <div className="cq-actions">
                <button className="btn-dark-small">FAQ</button>
                <button className="btn-light-small">Pricing</button>
              </div>
            </div>
          </div>
          <div className="cq-card">
            <div className="cq-image img-2"></div>
            <div className="cq-content">
              <h3>For Legal Professionals</h3>
              <p>Everything you need to know about everyday law, safely and effectively.</p>
              <div className="cq-features">
                <div className="cq-feature"><Check size={14} /> Interrogate private documents securely via our RAG</div>
                <div className="cq-feature"><Check size={14} /> Export to our native LaTeX editor for perfect PDFs</div>
              </div>
              <div className="cq-actions">
                <button className="btn-dark-small">FAQ</button>
                <button className="btn-light-small">Pricing</button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="dual-section">
        <div className="dual-left">
          <div className="dual-pill">BUILT FOR THE PUBLIC</div>
          <h2>Built for the public.<br/>Powerful enough<br/>for professionals.</h2>
          <p>A completely secure environment to take you from your very first<br/>legal question to a finished, beautifully formatted document.</p>
        </div>
        <div className="dual-right">
          <div className="feature-row dark">
            <MessageSquare size={20} />
            <div className="fr-content">
              <h4>AI Legal Assistant</h4>
              <p>Ask questions, analyze risk, explore case outcomes, and draft communications, all within the program.</p>
            </div>
          </div>
          <div className="feature-row dark">
            <Database size={20} />
            <div className="fr-content">
              <h4>Private Legal Database</h4>
              <p>Upload your own libraries, contracts, or case files, and chat with everything securely without data leaving.</p>
            </div>
          </div>
          <div className="feature-row dark">
            <Edit2 size={20} />
            <div className="fr-content">
              <h4>Smart Document Editor</h4>
              <p>Write alongside AI, suggest edits, and use our LaTeX editor to compile perfectly formatted, ready PDFs.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="empower-section">
        <div className="empower-pill">HEAR IT FROM USERS</div>
        <h2>Empowering people<br/>and practitioners</h2>
        <p>See how Lexis Law is changing the way people interact with the legal system.</p>
        
        <div className="testimonials">
          <div className="testimonial-card">
            <div className="t-avatar a1"></div>
            <div className="t-content">
              <p>"I was terrified when my landlord sent me a notice. Lexis Law explained my rights clearly and helped me draft a formal response letter in 5 minutes."</p>
              <div className="t-author">
                <strong>JESSICA T.</strong>
                <span>Small Business Owner</span>
              </div>
            </div>
          </div>
          <div className="testimonial-card">
            <div className="t-avatar a2"></div>
            <div className="t-content">
              <p>"As a solo lawyer, I don't have a team of paralegals. Uploading a 200-page dossier and instantly finding contradictions has saved me countless billable hours."</p>
              <div className="t-author">
                <strong>DAVID M.</strong>
                <span>Independent Attorney</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <footer className="landing-footer">
        <div className="footer-content">
          <div className="footer-logo">LEXIS LAW</div>
          <div className="footer-links">
            <span>Privacy Policy</span>
            <span>Terms of Service</span>
            <span>Security & Compliance</span>
            <span>Regulatory Disclosures</span>
            <span>Contact Support</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
