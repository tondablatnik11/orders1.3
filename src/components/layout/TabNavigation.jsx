import React from 'react';
import { Button } from '@/components/ui/button';

// Komponenta pro jedno tlačítko v navigaci
const TabButton = ({ name, activeTab, onClick, children }) => {
  const isActive = name === activeTab;
  return (
    <Button
      variant={isActive ? 'default' : 'ghost'}
      onClick={() => onClick(name)}
      className="transition-all duration-200"
    >
      {children}
    </Button>
  );
};

// Hlavní navigační komponenta
const TabNavigation = ({ activeTab, setActiveTab }) => {
  return (
    <div className="px-4 py-2 border-b">
      <nav className="flex items-center space-x-2 sm:space-x-4">
        <TabButton name="dashboard" activeTab={activeTab} onClick={setActiveTab}>
          Přehled
        </TabButton>
        <TabButton name="tickets" activeTab={activeTab} onClick={setActiveTab}>
          Tickety
        </TabButton>
        <TabButton name="search" activeTab={activeTab} onClick={setActiveTab}>
          Vyhledávání
        </TabButton>
        <TabButton name="error-monitor" activeTab={activeTab} onClick={setActiveTab}>
          Error Monitor
        </TabButton>
      </nav>
    </div>
  );
};

export default TabNavigation;