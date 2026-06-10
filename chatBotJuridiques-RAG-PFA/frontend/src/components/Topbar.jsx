import { useNavigate } from 'react-router-dom';
import '../styles/app-shell.css';

const Box = 'div';

export default function Topbar() {
  const navigate = useNavigate();

  return (
    <Box className="topbar">
      <Box className="topbar-left topbar-brand-block">
        <img src="/vellum-logo.png" alt="" className="topbar-brand-logo" />
        <span className="brand-name">VELLUM LAW</span>
      </Box>
      <Box className="topbar-right">
        <button type="button" className="btn-dark" onClick={() => navigate('/editor')}>
          NEW DOCUMENT
        </button>
      </Box>
    </Box>
  );
}
