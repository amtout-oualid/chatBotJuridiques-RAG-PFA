import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import ChatPage from './pages/ChatPage';
import DatabasePage from './pages/DatabasePage';
import LatexEditorPage from './pages/LatexEditorPage';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/chat" element={<ChatPage />} />
        <Route path="/database" element={<DatabasePage />} />
        <Route path="/latex" element={<LatexEditorPage />} />
      </Routes>
    </Router>
  );
}

export default App;
