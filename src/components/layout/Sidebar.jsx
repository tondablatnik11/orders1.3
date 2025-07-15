import React from 'react';
import { Home, Clock, Search, Truck, Ticket, Settings, MessageSquare, ListChecks, ShieldAlert } from 'lucide-react'; // Přidána ikona ShieldAlert

// Pomocná komponenta pro jednu položku v menu
const NavItem = ({ icon, children, isActive, onClick }) => {
  return (
    <li
      className={`
        flex items-center p-3 my-1 rounded-lg cursor-pointer transition-colors
        ${isActive
          ? 'bg-blue-600 text-white shadow-lg'
          : 'text-gray-300 hover:bg-gray-700 hover:text-white'
        }
      `}
      onClick={onClick}
    >
      {icon}
      <span className="ml-4 font-medium">{children}</span>
    </li>
  );
};

// Hlavní komponenta postranního menu
const Sidebar = ({ activeTab, setActiveTab }) => {
  return (
    <aside className="w-64 bg-gray-900 text-white flex-shrink-0 p-4 flex flex-col">
      <div className="text-2xl font-bold mb-8 text-center">
        Hellmann-Connect
      </div>
      <nav>
        <ul>
          <NavItem icon={<Home />} isActive={activeTab === 0} onClick={() => setActiveTab(0)}>Přehled</NavItem>
          <NavItem icon={<Clock />} isActive={activeTab === 1} onClick={() => setActiveTab(1)}>Zpožděné</NavItem>
          <NavItem icon={<Search />} isActive={activeTab === 2} onClick={() => setActiveTab(2)}>Vyhledávání</NavItem>
          <NavItem icon={<Truck />} isActive={activeTab === 3} onClick={() => setActiveTab(3)}>Ohlášené</NavItem>
          <NavItem icon={<Ticket />} isActive={activeTab === 4} onClick={() => setActiveTab(4)}>Tickety</NavItem>
          <NavItem icon={<ListChecks />} isActive={activeTab === 7} onClick={() => setActiveTab(7)}>Skladové činnosti</NavItem>
          
          {/* === ZDE JE PŘIDÁNA NOVÁ POLOŽKA === */}
          <NavItem icon={<ShieldAlert />} isActive={activeTab === 8} onClick={() => setActiveTab(8)}>Error Monitor</NavItem>
        </ul>
      </nav>
      
      <div className="mt-auto">
        <ul>
          <NavItem icon={<MessageSquare />} isActive={activeTab === 6} onClick={() => setActiveTab(6)}>Chat</NavItem>
          <NavItem icon={<Settings />} isActive={activeTab === 5} onClick={() => setActiveTab(5)}>Nastavení</NavItem>
        </ul>
      </div>
    </aside>
  );
};

export default Sidebar;