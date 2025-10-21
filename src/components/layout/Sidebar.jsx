'useclient';
import { forwardRef, useState } from 'react';
import {
    ChevronsLeft, ChevronsRight, Home, Search, Bell, Warehouse, AlertTriangle,
    LogOut, Settings, Ticket, PackageCheck, Printer, Zap, PlayCircle,
    ChevronDown, CalendarDays, Archive, PieChart,
    PackageSearch // <-- TENTO IMPORT CHYBĚL
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import Image from 'next/image';

const Sidebar = forwardRef(({ activeTab, onTabChange, isOpen, isCollapsed, setCollapsed }, ref) => {
    const { user, userProfile, logout } = useAuth();
    const [openGroup, setOpenGroup] = useState('operativa');

    const menuItems = [
        { id: 'dashboard', label: 'Přehled', icon: Home },
        {
          id: 'zakazky',
          label: 'Zakázky',
          icon: Archive,
          subItems: [
            { id: 'delayedOrders', label: 'Zpožděné zakázky', icon: CalendarDays },
            { id: 'orderSearch', label: 'Hledat zakázku', icon: Search },
          ]
        },
        {
          id: 'operativa',
          label: 'Operativa',
          icon: Zap,
          subItems: [
            { id: 'processing', label: 'K zpracování', icon: PlayCircle },
            { id: 'announcedLoadings', label: 'Ohlášené nakládky', icon: Bell },
            { id: 'faultyLabels', label: 'Chybné etikety', icon: Printer },
            { id: 'tickets', label: 'Tickety', icon: Ticket },
          ]
        },
        { id: 'picking', label: 'Pickování', icon: PackageCheck },
        { id: 'errorMonitor', label: 'Error Monitor', icon: AlertTriangle },
        { id: 'warehouseOverview', label: 'Přehled Skladu', icon: Warehouse },
        { id: 'freeBins', label: 'Volné Pozice', icon: PackageSearch }, // <-- Zde se ikona používá
        { id: 'customerAnalysis', label: 'Analýza Zákazníků', icon: PieChart },
    ];

    const bottomMenuItems = [
        { id: 'settings', label: 'Nastavení', icon: Settings },
    ];

    // --- Zbytek komponenty (NavItem, NavGroup, return ...) zůstává beze změny ---
    const NavItem = ({ item, isSubItem = false }) => {
        const isActive = activeTab === item.id;
        return (
            <a
                href="#"
                onClick={(e) => { e.preventDefault(); onTabChange(item.id); }}
                title={isCollapsed ? item.label : ''}
                className={`flex items-center gap-4 rounded-lg cursor-pointer transition-all duration-200 group relative ${isSubItem ? 'py-2.5 pr-4 pl-14' : 'px-4 py-3'} ${
                    isActive
                    ? 'bg-sky-500/20 text-sky-300 font-semibold'
                    : 'text-slate-400 hover:bg-slate-700/50 hover:text-white'
                }`}
            >
                {item.icon && <item.icon className="w-6 h-6 flex-shrink-0" />}
                <span className={`transition-opacity duration-200 whitespace-nowrap ${isCollapsed ? 'opacity-0 absolute left-full ml-4' : 'opacity-100'}`}>{item.label}</span>
            </a>
        );
    };

    const NavGroup = ({ item }) => {
        const isGroupActive = item.subItems.some(sub => sub.id === activeTab);
        const isOpen = openGroup === item.id;

        return (
            <div>
                <button
                    onClick={() => setOpenGroup(isOpen ? null : item.id)}
                    className={`w-full flex items-center justify-between gap-4 px-4 py-3 rounded-lg cursor-pointer transition-all duration-200 group relative ${
                        isGroupActive ? 'text-white' : 'text-slate-400 hover:bg-slate-700/50 hover:text-white'
                    }`}
                >
                    <div className="flex items-center gap-4">
                        <item.icon className="w-6 h-6 flex-shrink-0" />
                        <span className={`transition-opacity duration-200 whitespace-nowrap ${isCollapsed ? 'opacity-0' : 'opacity-100'}`}>{item.label}</span>
                    </div>
                    {!isCollapsed && <ChevronDown className={`w-5 h-5 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />}
                </button>
                <div className={`overflow-hidden transition-all duration-300 ease-in-out ${isOpen && !isCollapsed ? 'max-h-96 mt-1' : 'max-h-0'}`}>
                    <ul className="space-y-1">
                        {item.subItems.map(subItem => <li key={subItem.id}><NavItem item={subItem} isSubItem={true} /></li>)}
                    </ul>
                </div>
            </div>
        );
    };

    const userName = userProfile?.displayName || user?.email || 'Uživatel';
    const avatarUrl = userProfile?.avatar_url || user?.photoURL || '/profile-avatar.png'; // Zajistí fallback obrázek

    return (
        <aside
            ref={ref}
            className={`fixed inset-y-0 left-0 z-40 bg-slate-900/60 backdrop-blur-xl text-slate-200 flex flex-col justify-between border-r border-slate-700/50 transition-all duration-300 ease-in-out lg:static lg:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'} ${isCollapsed ? 'w-24 p-3' : 'w-64 p-4'}`}
        >
            <div>
                <div className={`flex items-center h-20 mb-6 transition-all duration-300 ${isCollapsed ? 'justify-center' : 'justify-between'}`}>
                    {!isCollapsed && <Image src="/logo.png" alt="Firemní Logo" width={150} height={40} style={{ objectFit: 'contain' }} />}
                    {isCollapsed && <Image src="/logo-icon.png" alt="Logo Ikonka" width={40} height={40} />}
                    <button onClick={() => setCollapsed(!isCollapsed)} className="hidden lg:block p-2 rounded-full hover:bg-slate-700/50 text-slate-400 absolute -right-4 top-20 bg-slate-800 border border-slate-700">
                        {isCollapsed ? <ChevronsRight size={16} /> : <ChevronsLeft size={16} />}
                    </button>
                </div>
                <nav>
                    <ul className="space-y-2">
                        {menuItems.map(item => (
                            <li key={item.id}>
                                {item.subItems ? <NavGroup item={item} /> : <NavItem item={item} />}
                            </li>
                        ))}
                    </ul>
                </nav>
            </div>
            <div className={`transition-all duration-300 ${isCollapsed ? 'space-y-2' : 'space-y-4'}`}>
                <ul className="space-y-2 border-t border-slate-700/50 pt-4">
                    {bottomMenuItems.map(item => <li key={item.id}><NavItem item={item} /></li>)}
                    <li>
                        <a href="#" onClick={logout} title="Odhlásit se" className="flex items-center gap-4 px-4 py-3 rounded-lg cursor-pointer transition-colors text-slate-400 hover:bg-slate-700/50 hover:text-white group relative">
                            <LogOut className="w-6 h-6 flex-shrink-0" />
                            <span className={`font-medium transition-opacity duration-200 whitespace-nowrap ${isCollapsed ? 'opacity-0 absolute left-full ml-4' : 'opacity-100'}`}>Odhlásit se</span>
                        </a>
                    </li>
                </ul>
                <div className="border-t border-slate-700/50 pt-4">
                    <div className="flex items-center gap-3">
                         <Image src={avatarUrl} alt="Profilový obrázek" width={40} height={40} className="rounded-full border-2 border-slate-600 flex-shrink-0" onError={(e) => { e.target.onerror = null; e.target.src='/profile-avatar.png'; }} /> {/* Fallback pro případ chyby načtení obrázku */}
                        <div className={`flex-1 min-w-0 transition-opacity duration-200 whitespace-nowrap ${isCollapsed ? 'opacity-0' : 'opacity-100'}`}>
                            <p className="font-semibold text-white truncate">{userName}</p>
                        </div>
                    </div>
                </div>
            </div>
        </aside>
    );
});

Sidebar.displayName = 'Sidebar';
export default Sidebar;