import { forwardRef } from 'react';
import { Home, Search, Bell, CalendarDays, Truck, Warehouse, AlertTriangle, LogOut } from 'lucide-react';
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

    const NavLink = ({ item }) => (
        <li
            onClick={() => onTabChange(item.id)}
            className={`
                flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-colors
                ${activeTab === item.id 
                    ? 'bg-blue-600 text-white shadow-lg' 
                    : 'text-slate-400 hover:bg-slate-700 hover:text-white'
                }
            `}
        >
            <item.icon className="w-5 h-5" />
            <span className="font-medium">{item.label}</span>
        </li>
    );

    return (
        <div ref={ref} className="fixed lg:static inset-y-0 left-0 z-30 w-64 bg-slate-800 text-white flex flex-col p-4 shadow-2xl">
            <div className="flex items-center gap-3 px-2 mb-8">
                <Image src="/logo.svg" alt="Logo" width={40} height={40} />
                <span className="text-xl font-bold">Orders 1.3</span>
            </div>

            <nav className="flex-1">
                <ul className="space-y-2">
                    {menuItems.map(item => <NavLink key={item.id} item={item} />)}
                </ul>
            </nav>

            <div className="border-t border-slate-700 pt-4">
                <div className="flex items-center gap-3 px-2 py-2.5 rounded-lg">
                    <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center font-bold">
                        {user ? user.email.charAt(0).toUpperCase() : '?'}
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="font-semibold truncate">{user ? user.email : 'Neznámý uživatel'}</p>
                    </div>
                    <button onClick={signOut} className="p-2 rounded-md hover:bg-slate-700 transition-colors">
                        <LogOut className="w-5 h-5 text-slate-400" />
                    </button>
                </div>
            </div>
        </div>
    );
});

Sidebar.displayName = 'Sidebar';
export default Sidebar;