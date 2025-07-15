import { forwardRef } from 'react';
import { Home, Search, Bell, CalendarDays, Truck, Warehouse, AlertTriangle, LogOut, MessageSquare, Settings } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import Image from 'next/image';

const Sidebar = forwardRef(({ activeTab, onTabChange }, ref) => {
    const { user, signOut } = useAuth();

    const menuItems = [
        { id: 'dashboard', label: 'Přehled', icon: Home },
        { id: 'orderSearch', label: 'Hledat zakázku', icon: Search },
        { id: 'announcedLoadings', label: 'Ohlášené nakládky', icon: Bell },
        { id: 'delayedOrders', label: 'Zpožděné zakázky', icon: CalendarDays },
        { id: 'dailySummary', label: 'Denní souhrn', icon: Truck },
        { id: 'warehouseActivities', label: 'Skladové aktivity', icon: Warehouse },
        { id: 'errorMonitor', label: 'Error Monitor', icon: AlertTriangle },
    ];
    
    // Nové položky pro spodní část menu
    const bottomMenuItems = [
        { id: 'chat', label: 'Chat', icon: MessageSquare },
        { id: 'settings', label: 'Nastavení', icon: Settings },
    ];

    const NavLink = ({ item }) => (
        <li onClick={() => onTabChange(item.id)} className={`flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-colors ${activeTab === item.id ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-700 hover:text-white'}`}>
            <item.icon className="w-5 h-5" />
            <span className="font-medium">{item.label}</span>
        </li>
    );

    return (
        <aside ref={ref} className="fixed lg:static inset-y-0 left-0 z-30 w-64 bg-slate-800 text-white flex flex-col p-4 shadow-2xl">
            {/* Změna zde: Odstraněn text "Orders 1.3", ponecháno jen logo */}
            <div className="flex items-center justify-center h-16 mb-4">
                <Image src="/logo.png" alt="Logo" width={48} height={48} />
            </div>

            <nav className="flex-1">
                <ul className="space-y-2">
                    {menuItems.map(item => <NavLink key={item.id} item={item} />)}
                </ul>
            </nav>

            <div className="border-t border-slate-700 pt-4 mt-4 space-y-2">
                 {bottomMenuItems.map(item => <NavLink key={item.id} item={item} />)}
                 {/* Oddělená položka pro odhlášení */}
                 <li onClick={signOut} className="flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-colors text-slate-400 hover:bg-slate-700 hover:text-white">
                    <LogOut className="w-5 h-5" />
                    <span className="font-medium">Odhlásit se</span>
                 </li>
            </div>

            <div className="border-t border-slate-700 pt-4 mt-4">
                <div className="flex items-center gap-3 px-2 py-2.5 rounded-lg">
                    {/* Změna zde: Avatar je nyní obrázek */}
                    <Image 
                        // Nahraďte cestu k profilovému obrázku, až bude k dispozici
                        src={user?.avatar_url || "/placeholder-avatar.png"} 
                        alt="Profilový obrázek" 
                        width={40} 
                        height={40}
                        className="rounded-full"
                    />
                    <div className="flex-1 min-w-0">
                        <p className="font-semibold truncate">{user ? user.email : 'Neznámý uživatel'}</p>
                    </div>
                </div>
            </div>
        </aside>
    );
});

Sidebar.displayName = 'Sidebar';
export default Sidebar;