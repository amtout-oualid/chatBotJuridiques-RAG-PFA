import { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { UserButton } from '@clerk/clerk-react';
import {
  MessageSquare,
  Database,
  FileEdit,
  Scale,
  PanelLeftClose,
  PanelLeftOpen,
} from 'lucide-react';
import './MainLayout.css';

const NAV_ITEMS = [
  { to: '/chat',     icon: MessageSquare, label: 'Chat' },
  { to: '/database', icon: Database,      label: 'Database' },
  { to: '/editor',   icon: FileEdit,      label: 'LaTeX' },
  { to: '/lawyers',  icon: Scale,         label: 'Avocats' },
];

export default function MainLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();

  return (
    <div className={`main-layout ${collapsed ? 'main-layout--collapsed' : ''}`}>
      {/* ── Icon Rail / Sidebar ── */}
      <nav className="nav-rail" id="nav-rail">
        <div className="nav-rail__top">
          <button
            className="nav-rail__brand"
            onClick={() => navigate('/chat')}
            title="Lexis AI"
            id="brand-button"
          >
            <span className="nav-rail__logo">⚖</span>
            {!collapsed && <span className="nav-rail__title">Lexis AI</span>}
          </button>

          <div className="nav-rail__links">
            {NAV_ITEMS.map(({ to, icon: Icon, label }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  `nav-rail__link ${isActive ? 'nav-rail__link--active' : ''}`
                }
                title={label}
                id={`nav-${label.toLowerCase()}`}
              >
                <Icon size={20} />
                {!collapsed && <span>{label}</span>}
              </NavLink>
            ))}
          </div>
        </div>

        <div className="nav-rail__bottom">
          <button
            className="nav-rail__toggle"
            onClick={() => setCollapsed(!collapsed)}
            title={collapsed ? 'Expand' : 'Collapse'}
            id="nav-toggle"
          >
            {collapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
          </button>
          <div className="nav-rail__user">
            <UserButton
              afterSignOutUrl="/"
              appearance={{
                elements: {
                  avatarBox: { width: 32, height: 32 },
                },
              }}
            />
          </div>
        </div>
      </nav>

      {/* ── Main Content ── */}
      <main className="main-content" id="main-content">
        <Outlet />
      </main>
    </div>
  );
}
