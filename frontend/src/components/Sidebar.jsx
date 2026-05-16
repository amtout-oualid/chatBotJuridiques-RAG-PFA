import { MessageSquare, Database, PenTool } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { UserButton } from '@clerk/clerk-react';
import '../styles/app-shell.css';

const Box = 'div';

export default function Sidebar() {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const items = [
    { id: 'chat', label: 'Chat', icon: MessageSquare, path: '/chat' },
    { id: 'database', label: 'Database', icon: Database, path: '/database' },
    { id: 'latex', label: 'LaTeX', icon: PenTool, path: '/editor' },
  ];

  return (
    <Box className="sidebar">
      <button
        type="button"
        className="sidebar-logo sidebar-logo-btn"
        onClick={() => navigate('/chat')}
        title="VELLUM LAW"
      >
        <img src="/vellum-logo.png" alt="VELLUM LAW" className="sidebar-logo-img" />
      </button>
      <Box className="sidebar-nav">
        {items.map(({ id, label, icon: Icon, path }) => (
          <Box
            key={id}
            className={`sidebar-item ${
              pathname === path || pathname.startsWith(`${path}/`) ? 'active' : ''
            }`}
            onClick={() => navigate(path)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && navigate(path)}
          >
            <Icon size={20} strokeWidth={1.5} />
            <span>{label}</span>
          </Box>
        ))}
      </Box>
      <Box className="sidebar-bottom">
        <UserButton afterSignOutUrl="/" />
      </Box>
    </Box>
  );
}
