'use client';
import React, { createContext, useState, useContext } from 'react';
import { translations } from '../lib/translations';

export const UIContext = createContext(null);

export const useUI = () => useContext(UIContext);

export const UIProvider = ({ children }) => {
  const [lang, setLang] = useState('cz');
  const [darkMode, setDarkMode] = useState(true);

  const toggleLang = () => {
    setLang(prev => {
      if (prev === 'cz') return 'en';
      if (prev === 'en') return 'de';
      return 'cz'; // z 'de' zpět na 'cz'
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