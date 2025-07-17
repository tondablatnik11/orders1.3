// src/components/layout/Sidebar.jsx
'use client';
import { forwardRef } from 'react';
import { Home, Search, Bell, CalendarDays, Truck, Warehouse, AlertTriangle, LogOut, MessageSquare, Settings } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import Image from 'next/image';

const Sidebar = forwardRef(({ activeTab, onTabChange }, ref) => {
    const { user, userProfile, logout } = useAuth();

    const menuItems = [
        { id: 'dashboard', label: 'Přehled', icon: Home },
        { id: 'delayedOrders', label: 'Zpožděné zakázky', icon: CalendarDays },
        { id: 'orderSearch', label: 'Hledat zakázku', icon: Search },
        { id: 'announcedLoadings', label: 'Ohlášené nakládky', icon: Bell },
        { id: 'dailySummary', label: 'Denní souhrn', icon: Truck },
        { id: 'warehouseActivities', label: 'Skladové aktivity', icon: Warehouse },
        { id: 'errorMonitor', label: 'Error Monitor', icon: AlertTriangle },
    ];
    
    const bottomMenuItems = [
        { id: 'chat', label: 'Chat', icon: MessageSquare },
        { id: 'settings', label: 'Nastavení', icon: Settings },
    ];

    const NavLink = ({ item }) => {
        const isActive = activeTab === item.id;
        return (
            <li>
                <a
                    href="#"
                    onClick={(e) => {
                        e.preventDefault();
                        onTabChange(item.id);
                    }}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg cursor-pointer transition-all duration-200 group relative ${
                        isActive 
                        ? 'bg-blue-600 text-white font-semibold shadow-lg shadow-blue-600/20' 
                        : 'text-slate-400 hover:bg-slate-700 hover:text-white'
                    }`}
                >
                    <span className={`absolute left-0 top-1/2 -translate-y-1/2 h-6 w-1 bg-blue-400 rounded-r-full transition-all duration-300 ${isActive ? 'opacity-100' : 'opacity-0 scale-y-0 group-hover:opacity-50'}`}></span>
                    <item.icon className="w-5 h-5 ml-1" />
                    <span>{item.label}</span>
                </a>
            </li>
        );
    };

    const userName = userProfile?.displayName || user?.email || 'Neznámý uživatel';
    const userRole = userProfile?.isAdmin ? 'Administrátor' : 'Uživatel';
    const avatarUrl = userProfile?.avatar_url || user?.photoURL || '/profile-avatar.png';

    return (
        <aside ref={ref} className="w-64 bg-slate-800 text-slate-200 flex-shrink-0 flex flex-col justify-between p-4 border-r border-slate-700/50">
            <div>
                {/* Horní část - Logo */}
                <div className="flex items-center justify-center h-20 mb-6 px-4">
                    {/* KLÍČOVÁ ZMĚNA: Větší logo bez oříznutí */}
                    <Image src="/logo.png" alt="Firemní Logo" width={180} height={50} style={{ objectFit: 'contain' }} />
                </div>

                {/* Navigace */}
                <nav>
                    <ul className="space-y-2">
                        {menuItems.map(item => <NavLink key={item.id} item={item} />)}
                    </ul>
                </nav>
            </div>

            {/* Spodní část - Nastavení, Chat a Profil */}
            <div>
                <ul className="space-y-2 border-t border-slate-700 pt-4">
                    {bottomMenuItems.map(item => <NavLink key={item.id} item={item} />)}
                    <li>
                        <a href="#" onClick={logout} className="flex items-center gap-3 px-4 py-3 rounded-lg cursor-pointer transition-colors text-slate-400 hover:bg-slate-700 hover:text-white group relative">
                            <span className="absolute left-0 top-1/2 -translate-y-1/2 h-6 w-1 bg-blue-400 rounded-r-full opacity-0 scale-y-0 group-hover:opacity-50 transition-all duration-300"></span>
                            <LogOut className="w-5 h-5 ml-1" />
                            <span className="font-medium">Odhlásit se</span>
                        </a>
                    </li>
                </ul>

                {/* Profil uživatele */}
                <div className="border-t border-slate-700 mt-4 pt-4">
                    <div className="flex items-center gap-3">
                        <Image src={avatarUrl} alt="Profilový obrázek" width={40} height={40} className="rounded-full border-2 border-slate-600" />
                        <div className="flex-1 min-w-0">
                            <p className="font-semibold text-white truncate">{userName}</p>
                            <p className="text-xs text-slate-400">{userRole}</p>
                        </div>
                    </div>
                </div>
            </div>
        </aside>
    );
});

Sidebar.displayName = 'Sidebar';
export default Sidebar;