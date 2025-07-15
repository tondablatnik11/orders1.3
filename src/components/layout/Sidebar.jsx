import { forwardRef } from 'react';
import { Home, Search, Bell, CalendarDays, Truck, Warehouse, AlertTriangle, LogOut, MessageSquare, Settings } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import Image from 'next/image';const Sidebar = forwardRef(({ activeTab, onTabChange }, ref) => {
const { user, signOut } = useAuth();// Správné pořadí položek menu
const menuItems = [
    { id: 'dashboard', label: 'Přehled', icon: Home },
    { id: 'orderSearch', label: 'Hledat zakázku', icon: Search },
    { id: 'announcedLoadings', label: 'Ohlášené nakládky', icon: Bell },
    { id: 'delayedOrders', label: 'Zpožděné zakázky', icon: CalendarDays },
    { id: 'dailySummary', label: 'Denní souhrn', icon: Truck },
    { id: 'warehouseActivities', label: 'Skladové aktivity', icon: Warehouse },
    { id: 'errorMonitor', label: 'Error Monitor', icon: AlertTriangle },
];

// Nové funkční položky pro spodní část
const bottomMenuItems = [
    { id: 'chat', label: 'Chat', icon: MessageSquare },
    { id: 'settings', label: 'Nastavení', icon: Settings },
];

const NavLink = ({ item }) =&gt; (
    &lt;li onClick={() =&gt; onTabChange(item.id)} className={`flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-colors ${activeTab === item.id ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-700 hover:text-white'}`}&gt;
        &lt;item.icon className=&quot;w-5 h-5&quot; /&gt;
        &lt;span className=&quot;font-medium&quot;&gt;{item.label}&lt;/span&gt;
    &lt;/li&gt;
);

const userName = user?.user_metadata?.full_name || user?.email || 'Neznámý uživatel';

return (
    &lt;aside ref={ref} className=&quot;fixed lg:static inset-y-0 left-0 z-30 w-64 bg-slate-800 text-white flex flex-col p-4 shadow-2xl&quot;&gt;
        &lt;div className=&quot;flex items-center justify-center h-16 mb-4&quot;&gt;
            &lt;Image src=&quot;/logo.png&quot; alt=&quot;Logo&quot; width={56} height={56} /&gt;
        &lt;/div&gt;

        &lt;nav className=&quot;flex-1&quot;&gt;
            &lt;ul className=&quot;space-y-2&quot;&gt;
                {menuItems.map(item =&gt; &lt;NavLink key={item.id} item={item} /&gt;)}
            &lt;/ul&gt;
        &lt;/nav&gt;

        &lt;div className=&quot;border-t border-slate-700 pt-4 mt-4 space-y-2&quot;&gt;
             {bottomMenuItems.map(item =&gt; &lt;NavLink key={item.id} item={item} /&gt;)}
             &lt;li onClick={signOut} className=&quot;flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-colors text-slate-400 hover:bg-slate-700 hover:text-white&quot;&gt;
                &lt;LogOut className=&quot;w-5 h-5&quot; /&gt;
                &lt;span className=&quot;font-medium&quot;&gt;Odhlásit se&lt;/span&gt;
             &lt;/li&gt;
        &lt;/div&gt;

        &lt;div className=&quot;border-t border-slate-700 pt-4 mt-4&quot;&gt;
            &lt;div className=&quot;flex items-center gap-3 px-2 py-2.5 rounded-lg&quot;&gt;
                &lt;Image 
                    src={user?.user_metadata?.avatar_url || &quot;/profile-avatar.png&quot;} 
                    alt=&quot;Profilový obrázek&quot; 
                    width={40} 
                    height={40}
                    className=&quot;rounded-full&quot;
                /&gt;
                &lt;div className=&quot;flex-1 min-w-0&quot;&gt;
                    &lt;p className=&quot;font-semibold truncate&quot;&gt;{userName}&lt;/p&gt;
                &lt;/div&gt;
            &lt;/div&gt;
        &lt;/div&gt;
    &lt;/aside&gt;
);
});Sidebar.displayName = 'Sidebar';
export default Sidebar;<p>Po nahrazení těchto tří souborů a novém deployi (ideálně bez cache) bude celá aplikace fungovat správně – klikání v sidebaru bude přepínat záložky a grafy v Error Monitoru se budou správně načítat z databáze.</p>