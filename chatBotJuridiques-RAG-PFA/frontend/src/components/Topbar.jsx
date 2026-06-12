import { useNavigate } from 'react-router-dom';
import '../styles/app-shell.css';

const Box = 'div';

export default function Topbar({ actionText = 'NEW DOCUMENT', onAction }) {
  const navigate = useNavigate();

  const handleClick = () => {
    if (onAction) {
      onAction();
    } else {
      navigate('/editor');
    }
  };

  return (
    <Box className="topbar">
      <Box className="topbar-left topbar-brand-block">
        <img src="/vellum-logo.png" alt="" className="topbar-brand-logo" />
        <span className="brand-name">VELLUM LAW</span>
      </Box>
      <Box className="topbar-right">
        <button type="button" className="btn-dark" onClick={handleClick}>
          {actionText}
        </button>
      </Box>
    </Box>
  );
}
