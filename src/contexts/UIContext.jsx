'use client';
import React, { createContext, useState, useContext } from 'react';
import { translations } from '../lib/translations'; // Ujistěte se, že cesta k překladům je správná

export const UIContext = createContext(null);

export const useUI = () => {
    const context = useContext(UIContext);
    if (context === undefined) {
        throw new Error('useUI must be used within a UIProvider');
    }
    return context;
};

export const UIProvider = ({ children }) => {
  const [lang, setLang] = useState('cz');
  const [darkMode, setDarkMode] = useState(true);

  // Opravená logika pro přepínání všech tří jazyků
  const toggleLang = () => {
    setLang(prev => {
      if (prev === 'cz') return 'en';
      if (prev === 'en') return 'de';
      return 'cz'; // Z němčiny se vrátí zpět na češtinu
    });
  };

  const toggleTheme = () => setDarkMode(!darkMode);

  const value = {
    t: translations[lang],
    darkMode,
    toggleTheme,
    toggleLang,
    lang,
  };

  return (
    <UIContext.Provider value={value}>
      {children}
    </UIContext.Provider>
  );
};