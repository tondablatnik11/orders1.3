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

    const NavLink = ({ item }) => (
        <li 
            onClick={() => onTabChange(item.id)} 
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-all duration-300 transform hover:-translate-y-px 
                       ${activeTab === item.id 
                         ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' 
                         : 'text-slate-400 hover:bg-slate-700 hover:text-white'}`}
        >
            <item.icon className="w-5 h-5" />
            <span className="font-medium">{item.label}</span>
        </li>
    );

    const userName = userProfile?.displayName || user?.email || 'Neznámý uživatel';
    const avatarUrl = userProfile?.avatar_url || user?.photoURL || '/profile-avatar.png';

    return (
        <aside ref={ref} className="fixed lg:static inset-y-0 left-0 z-30 w-64 bg-slate-800 text-white flex flex-col p-4 shadow-2xl">
            <div className="flex items-center justify-center h-24 mb-4">
                <Image src="/logo.png" alt="Logo" width={80} height={80} />
            </div>

            <nav className="flex-1">
                <ul className="space-y-2">
                    {menuItems.map(item => <NavLink key={item.id} item={item} />)}
                </ul>
            </nav>

            <div className="border-t border-slate-700 pt-4 mt-4 space-y-2">
                 {bottomMenuItems.map(item => <NavLink key={item.id} item={item} />)}
                 <li onClick={logout} className="flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-colors text-slate-400 hover:bg-slate-700 hover:text-white transition-all duration-300 transform hover:-translate-y-px">
                    <LogOut className="w-5 h-5" />
                    <span className="font-medium">Odhlásit se</span>
                 </li>
            </div>

            <div className="border-t border-slate-700 pt-4 mt-4">
                <div className="flex items-center gap-3 px-2 py-2.5 rounded-lg">
                    <Image src={avatarUrl} alt="Profilový obrázek" width={40} height={40} className="rounded-full" />
                    <div className="flex-1 min-w-0">
                        <p className="font-semibold truncate">{userName}</p>
                    </div>
                </div>
            </div>
        </aside>
    );
});

Sidebar.displayName = 'Sidebar';
export default Sidebar;