'use client';
import { forwardRef } from 'react';
import { ChevronsLeft, ChevronsRight, Home, Search, Bell, CalendarDays, Truck, Warehouse, AlertTriangle, LogOut, MessageSquare, Settings, Ticket, PackageCheck, Printer } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import Image from 'next/image';

const Sidebar = forwardRef(({ activeTab, onTabChange, isOpen, isCollapsed, setCollapsed }, ref) => {
    const { user, userProfile, logout } = useAuth();

    const menuItems = [
        { id: 'dashboard', label: 'Přehled', icon: Home },
        { id: 'delayedOrders', label: 'Zpožděné zakázky', icon: CalendarDays },
        { id: 'orderSearch', label: 'Hledat zakázku', icon: Search },
        { id: 'announcedLoadings', label: 'Ohlášené nakládky', icon: Bell },
        { id: 'picking', label: 'Pickování', icon: PackageCheck },
        { id: 'faultyLabels', label: 'Chybné etikety', icon: Printer },
        { id: 'errorMonitor', label: 'Error Monitor', icon: AlertTriangle },
        { id: 'tickets', label: 'Tickety', icon: Ticket },
    ];
    
    const bottomMenuItems = [
        { id: 'settings', label: 'Nastavení', icon: Settings },
    ];

    const NavLink = ({ item }) => {
        const isActive = activeTab === item.id;
        return (
            <li>
                <a
                    href="#"
                    onClick={(e) => { e.preventDefault(); onTabChange(item.id); }}
                    title={item.label}
                    className={`flex items-center gap-4 px-4 py-3 rounded-lg cursor-pointer transition-all duration-200 group relative ${
                        isActive 
                        ? 'bg-sky-500/20 text-sky-300 font-semibold' 
                        : 'text-slate-400 hover:bg-slate-700/50 hover:text-white'
                    }`}
                >
                    <item.icon className="w-6 h-6 flex-shrink-0" />
                    <span className={`transition-opacity duration-200 ${isCollapsed ? 'opacity-0' : 'opacity-100'}`}>{item.label}</span>
                </a>
            </li>
        );
    };

    const userName = userProfile?.displayName || user?.email || 'Uživatel';
    const avatarUrl = userProfile?.avatar_url || user?.photoURL || '/profile-avatar.png';

    return (
        <aside 
            ref={ref} 
            className={`fixed inset-y-0 left-0 z-40 bg-slate-900/60 backdrop-blur-xl text-slate-200 flex flex-col justify-between border-r border-slate-700/50 transition-all duration-300 ease-in-out lg:static ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'} ${isCollapsed ? 'w-24 p-3' : 'w-64 p-4'}`}
        >
            <div>
                <div className={`flex items-center h-20 mb-6 transition-all duration-300 ${isCollapsed ? 'justify-center' : 'justify-between'}`}>
                    <Image src="/logo-icon.png" alt="Logo" width={40} height={40} className={`${isCollapsed ? 'block' : 'hidden'}`} />
                    <Image src="/logo.png" alt="Firemní Logo" width={150} height={40} style={{ objectFit: 'contain' }} className={`${isCollapsed ? 'hidden' : 'block'}`} />
                    <button onClick={() => setCollapsed(!isCollapsed)} className="hidden lg:block p-2 rounded-full hover:bg-slate-700/50 text-slate-400">
                        {isCollapsed ? <ChevronsRight /> : <ChevronsLeft />}
                    </button>
                </div>
                <nav>
                    <ul className="space-y-2">
                        {menuItems.map(item => <NavLink key={item.id} item={item} />)}
                    </ul>
                </nav>
            </div>
            <div className={`transition-all duration-300 ${isCollapsed ? 'space-y-2' : 'space-y-4'}`}>
                <ul className="space-y-2 border-t border-slate-700/50 pt-4">
                    {bottomMenuItems.map(item => <NavLink key={item.id} item={item} />)}
                    <li>
                        <a href="#" onClick={logout} title="Odhlásit se" className="flex items-center gap-4 px-4 py-3 rounded-lg cursor-pointer transition-colors text-slate-400 hover:bg-slate-700/50 hover:text-white group relative">
                            <LogOut className="w-6 h-6 flex-shrink-0" />
                            <span className={`font-medium transition-opacity duration-200 ${isCollapsed ? 'opacity-0' : 'opacity-100'}`}>Odhlásit se</span>
                        </a>
                    </li>
                </ul>
                <div className="border-t border-slate-700/50 pt-4">
                    <div className="flex items-center gap-3">
                        <Image src={avatarUrl} alt="Profilový obrázek" width={40} height={40} className="rounded-full border-2 border-slate-600 flex-shrink-0" />
                        <div className={`flex-1 min-w-0 transition-opacity duration-200 ${isCollapsed ? 'opacity-0' : 'opacity-100'}`}>
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