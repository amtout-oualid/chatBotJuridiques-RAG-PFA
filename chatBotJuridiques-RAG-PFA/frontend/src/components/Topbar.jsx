import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronDown } from 'lucide-react';
import { useModel } from '../context/ModelContext';
import '../styles/app-shell.css';

const Box = 'div';

export default function Topbar({ actionText = 'NEW DOCUMENT', onAction }) {
  const navigate = useNavigate();
  const { selectedModel, setSelectedModel } = useModel();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const handleClick = () => {
    if (onAction) {
      onAction();
    } else {
      navigate('/editor');
    }
  };

  const modelLabels = {
    gemini: 'Gemini 2.5 Flash',
    gpt: 'GPT-4o',
  };

  return (
    <Box className="topbar">
      <Box className="topbar-left topbar-brand-block" style={{ position: 'relative' }}>
        <img src="/vellum-logo.png" alt="" className="topbar-brand-logo" />
        <div 
          className="brand-name model-selector" 
          onClick={() => setDropdownOpen(!dropdownOpen)}
          style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', userSelect: 'none' }}
        >
          {modelLabels[selectedModel] || 'Select Model'}
          <ChevronDown size={16} />
        </div>
        
        {dropdownOpen && (
          <div className="model-dropdown-menu" style={{
            position: 'absolute',
            top: '100%',
            left: '44px',
            marginTop: '8px',
            background: '#1a1a1a',
            border: '1px solid #333',
            borderRadius: '6px',
            padding: '4px',
            zIndex: 100,
            display: 'flex',
            flexDirection: 'column',
            minWidth: '150px'
          }}>
            <button 
              style={{
                background: selectedModel === 'gemini' ? '#333' : 'transparent',
                border: 'none', color: '#fff', padding: '8px 12px', textAlign: 'left', borderRadius: '4px', cursor: 'pointer'
              }}
              onClick={() => { setSelectedModel('gemini'); setDropdownOpen(false); }}
            >
              Gemini 2.5 Flash
            </button>
            <button 
              style={{
                background: selectedModel === 'gpt' ? '#333' : 'transparent',
                border: 'none', color: '#fff', padding: '8px 12px', textAlign: 'left', borderRadius: '4px', cursor: 'pointer'
              }}
              onClick={() => { setSelectedModel('gpt'); setDropdownOpen(false); }}
            >
              GPT-4o
            </button>
          </div>
        )}
      </Box>
      <Box className="topbar-right">
        <button type="button" className="btn-dark" onClick={handleClick}>
          {actionText}
        </button>
      </Box>
    </Box>
  );
}
