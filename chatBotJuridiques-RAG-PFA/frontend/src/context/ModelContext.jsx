import React, { createContext, useContext, useState, useEffect } from 'react';

const ModelContext = createContext(undefined);

export function ModelProvider({ children }) {
  // Try to load from localStorage first, default to 'gemini'
  const [selectedModel, setSelectedModel] = useState(() => {
    return localStorage.getItem('lexis_ai_model') || 'gemini';
  });

  // Persist choice
  useEffect(() => {
    localStorage.setItem('lexis_ai_model', selectedModel);
  }, [selectedModel]);

  return (
    <ModelContext.Provider value={{ selectedModel, setSelectedModel }}>
      {children}
    </ModelContext.Provider>
  );
}

export function useModel() {
  const context = useContext(ModelContext);
  if (context === undefined) {
    throw new Error('useModel must be used within a ModelProvider');
  }
  return context;
}
