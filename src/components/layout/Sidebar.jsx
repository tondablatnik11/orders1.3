import { forwardRef } from 'react';
import { Home, Search, Bell, CalendarDays, Truck, Warehouse, AlertTriangle, LogOut } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import Image from 'next/image';const Sidebar = forwardRef(({ activeTab, onTabChange }, ref) => {
const { user, signOut } = useAuth();const menuItems = [
    { id: 'dashboard', label: 'Přehled', icon: Home },
    { id: 'orderSearch', label: 'Hledat zakázku', icon: Search },
    { id: 'announcedLoadings', label: 'Ohlášené nakládky', icon: Bell },
    { id: 'delayedOrders', label: 'Zpožděné zakázky', icon: CalendarDays },
    { id: 'dailySummary', label: 'Denní souhrn', icon: Truck },
    { id: 'warehouseActivities', label: 'Skladové aktivity', icon: Warehouse },
    { id: 'errorMonitor', label: 'Error Monitor', icon: AlertTriangle },
];

const NavLink = ({ item }) =&gt; (
    &lt;li
        onClick={() =&gt; onTabChange(item.id)}
        className={`
            flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-colors
            ${activeTab === item.id 
                ? 'bg-blue-600 text-white shadow-lg' 
                : 'text-slate-400 hover:bg-slate-700 hover:text-white'
            }
        `}
    &gt;
        &lt;item.icon className=&quot;w-5 h-5&quot; /&gt;
        &lt;span className=&quot;font-medium&quot;&gt;{item.label}&lt;/span&gt;
    &lt;/li&gt;
);

return (
    &lt;div ref={ref} className=&quot;fixed lg:static inset-y-0 left-0 z-30 w-64 bg-slate-800 text-white flex flex-col p-4 shadow-2xl&quot;&gt;
        &lt;div className=&quot;flex items-center gap-3 px-2 mb-8&quot;&gt;
            {/* Změna zde: Opravena cesta k logu */}
            &lt;Image src=&quot;/logo.png&quot; alt=&quot;Logo&quot; width={40} height={40} /&gt;
            &lt;span className=&quot;text-xl font-bold&quot;&gt;Orders 1.3&lt;/span&gt;
        &lt;/div&gt;

        &lt;nav className=&quot;flex-1&quot;&gt;
            &lt;ul className=&quot;space-y-2&quot;&gt;
                {menuItems.map(item =&gt; &lt;NavLink key={item.id} item={item} /&gt;)}
            &lt;/ul&gt;
        &lt;/nav&gt;

        &lt;div className=&quot;border-t border-slate-700 pt-4&quot;&gt;
            &lt;div className=&quot;flex items-center gap-3 px-2 py-2.5 rounded-lg&quot;&gt;
                &lt;div className=&quot;w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center font-bold&quot;&gt;
                    {user ? user.email.charAt(0).toUpperCase() : '?'}
                &lt;/div&gt;
                &lt;div className=&quot;flex-1 min-w-0&quot;&gt;
                    &lt;p className=&quot;font-semibold truncate&quot;&gt;{user ? user.email : 'Neznámý uživatel'}&lt;/p&gt;
                &lt;/div&gt;
                &lt;button onClick={signOut} className=&quot;p-2 rounded-md hover:bg-slate-700 transition-colors&quot;&gt;
                    &lt;LogOut className=&quot;w-5 h-5 text-slate-400&quot; /&gt;
                &lt;/button&gt;
            &lt;/div&gt;
        &lt;/div&gt;
    &lt;/div&gt;
);
});Sidebar.displayName = 'Sidebar';
export default Sidebar;<hr>
<h3 id="krok-2-oprava-dashboardlayout-jsx-funkcnost-klikani-">Krok 2: Oprava <code>DashboardLayout.jsx</code> (funkčnost klikání)</h3>
<p>Toto je nejdůležitější oprava. Tento soubor nyní bude spravovat, která záložka je aktivní, a bude správně reagovat na kliknutí v sidebaru.</p>
<pre><code class="language-jsx">'use client';
import React, { useState } from 'react';
import Sidebar from './Sidebar';
import DashboardTab from '../tabs/DashboardTab';
import ErrorMonitorTab from '../tabs/ErrorMonitorTab';
import OrderSearchTab from '../tabs/OrderSearchTab';
import AnnouncedLoadingsTab from '../tabs/AnnouncedLoadingsTab';
import DelayedOrdersTab from '../tabs/DelayedOrdersTab';
import DailySummaryTab from '../tabs/DailySummaryTab';
import WarehouseActivitiesTab from '../tabs/WarehouseActivitiesTab';
// Přidejte importy pro další záložky, pokud existují

const DashboardLayout = () =&gt; {
    // Stav, který drží informaci o aktivní záložce
    const [activeTab, setActiveTab] = useState('dashboard'); 

    // Funkce pro zobrazení správného obsahu podle aktivní záložky
    const renderActiveTab = () =&gt; {
        switch (activeTab) {
            case 'dashboard':
                return &lt;DashboardTab /&gt;;
            case 'errorMonitor':
                return &lt;ErrorMonitorTab /&gt;;
            case 'orderSearch':
                return &lt;OrderSearchTab /&gt;;
            case 'announcedLoadings':
                return &lt;AnnouncedLoadingsTab /&gt;;
            case 'delayedOrders':
                return &lt;DelayedOrdersTab /&gt;;
            case 'dailySummary':
                return &lt;DailySummaryTab /&gt;;
            case 'warehouseActivities':
                return &lt;WarehouseActivitiesTab /&gt;;
            // Přidejte další 'case' pro ostatní záložky
            default:
                return &lt;DashboardTab /&gt;;
        }
    };

    return (
        &lt;div className=&quot;flex h-screen bg-white dark:bg-slate-900&quot;&gt;
            {/* Předáváme aktivní záložku a funkci pro její změnu */}
            &lt;Sidebar activeTab={activeTab} onTabChange={setActiveTab} /&gt;
            &lt;main className=&quot;flex-1 overflow-y-auto&quot;&gt;
                {renderActiveTab()}
            &lt;/main&gt;
        &lt;/div&gt;
    );
};

export default DashboardLayout;

Po nahrazení těchto dvou souborů bude váš sidebar plně funkční a bude správně zobrazovat logo.