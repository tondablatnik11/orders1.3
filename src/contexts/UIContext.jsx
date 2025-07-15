'use client';
import React, { createContext, useState, useContext } from 'react';
import { translations } from '../lib/translations';

export const UIContext = createContext(null);
export const useUI = () => useContext(UIContext);

export const UIProvider = ({ children }) => {
  const [lang, setLang] = useState('cz');
  const [darkMode, setDarkMode] = useState(true);
  const [activeTab, setActiveTab] = useState(0); // <-- PŘIDÁNO

  const toggleLang = () => {
    setLang(prev => {
      if (prev === 'cz') return 'en';
      if (prev === 'en') return 'de';
      return 'cz';
    });
  };

  const value = {
    t: translations[lang],
    darkMode,
    toggleLang,
    lang,
    activeTab,      // <-- PŘIDÁNO
    setActiveTab,   // <-- PŘIDÁNO
  };

  return (
    <UIContext.Provider value={value}>
      {children}
    </UIContext.Provider>
  );
};