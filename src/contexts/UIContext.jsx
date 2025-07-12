'use client';
import React, { createContext, useState, useContext } from 'react';
import { translations } from '../lib/translations';

export const UIContext = createContext(null);

export const useUI = () => useContext(UIContext);

export const UIProvider = ({ children }) => {
  const [lang, setLang] = useState('cz');
  const [darkMode, setDarkMode] = useState(true);

  const toggleLang = () => {
    setLang(prev => (prev === 'cz' ? 'en' : prev === 'en' ? 'de' : 'cz'));
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