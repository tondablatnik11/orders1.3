'use client';

import React, { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from '../../contexts/AuthContext';
import { useData } from '../../contexts/DataContext';

import {
    format, isBefore, startOfDay, differenceInDays, getHours, subDays, startOfMonth, endOfMonth, isAfter, parseISO, addDays,
} from "date-fns";

import {
    BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend,
} from "recharts";

import {
    FileDown, UploadCloud, BarChart3, Lock, History, Globe, Sun, Moon, Search, ClipboardList,
} from "lucide-react";

import { getSupabase } from '../../lib/supabaseClient';

// Pomocná komponenta pro karty
const Card = ({ children, className = "" }) => (
    <div className={`p-4 border border-gray-700 rounded-xl bg-gray-800 shadow-xl ${className}`}>
        {children}
    </div>
);
const CardContent = ({ children, className = "" }) => (
    <div className={`p-4 space-y-1 ${className}`}>{children}</div>
);

// Hlavní komponenta
const Dashboard = () => {
    // Data a autentizace z kontextů
    const { currentUser, currentUserProfile, logout } = useAuth();
    const { allOrdersData, importHistory, loading: dataLoading, refetchData } = useData();

    // UI stavy
    const [summary, setSummary] = useState(null);
    const [lang, setLang] = useState("cz");
    const [activeTab, setActiveTab] = useState(0);
    const [filtersCollapsed, setFiltersCollapsed] = useState(true);

    const translations = {
        cz: {
            title: "Přehled zakázek", upload: "Nahrát soubor", export: "Export do PDF",
            total: "Zakázky", done: "Hotovo", remaining: "Zbývá", inProgress: "V procesu",
            newOrders: "Nové", pallets: "Palety", carton: "Karton", logout: "Odhlásit se",
            dashboardTab: "Dashboard", delayedOrdersTab: "Zpožděné zakázky",
            filters: "Filtry dat", dailyOverview: "Denní přehled stavu", older: "Starší",
            yesterday: "Včera", today: "Dnes", future: "Budoucí", noDataAvailable: "Žádná data k zobrazení.",
            statusDistribution: "Rozložení statusů", history: "Historie importu", selectImport: "Vyberte import",
        },
    };
    const t = translations[lang] || translations.cz;
    
    // Funkce pro zpracování dat
    const processData = useCallback((data) => {
        if (!data || data.length === 0) return null;
        
        const summaryData = {
            total: data.length, doneTotal: 0, remainingTotal: 0, inProgressTotal: 0, newOrdersTotal: 0, palletsTotal: 0, cartonsTotal: 0,
            statusCounts: {}, dailySummaries: new Map(),
        };

        data.forEach(row => {
            const status = Number(row.Status);
            if (isNaN(status)) return;
            
            if ([50, 60, 70].includes(status)) summaryData.doneTotal++;
            if ([10, 31, 35, 40].includes(status)) summaryData.remainingTotal++;
            if ([31, 35, 40].includes(status)) summaryData.inProgressTotal++;
            if ([10].includes(status)) summaryData.newOrdersTotal++;
            if (row["del.type"] === 'P') summaryData.palletsTotal++;
            if (row["del.type"] === 'K') summaryData.cartonsTotal++;

            summaryData.statusCounts[status] = (summaryData.statusCounts[status] || 0) + 1;
        });
        
        return summaryData;
    }, []);

    useEffect(() => {
        setSummary(processData(allOrdersData));
    }, [allOrdersData, processData]);

    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Načtení knihovny pro XLSX, pokud ještě není načtena
        if (typeof XLSX === 'undefined') {
            const script = document.createElement('script');
            script.src = "https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js";
            document.head.appendChild(script);
            await new Promise(resolve => script.onload = resolve);
        }

        const reader = new FileReader();
        reader.onload = async (evt) => {
            const bstr = evt.target.result;
            const wb = XLSX.read(bstr, { type: 'binary' });
            const wsname = wb.SheetNames[0];
            const ws = wb.Sheets[wsname];
            const data = XLSX.utils.sheet_to_json(ws);
            
            if (data.length > 0) {
                const supabase = getSupabase();
                const transformedData = data.map(row => ({
                    ...row,
                    "Loading Date": new Date((row["Loading Date"] - 25569) * 86400 * 1000).toISOString(),
                }));

                const { error } = await supabase.from('deliveries').upsert(transformedData, { onConflict: 'Delivery No' });
                if (error) {
                    console.error('Error upserting data:', error);
                    alert('Chyba při nahrávání dat.');
                } else {
                    alert('Data byla úspěšně nahrána!');
                    refetchData(); // Znovu načteme data z databáze
                }
            }
        };
        reader.readAsBinaryString(file);
    };

    if (dataLoading) {
        return <div className="flex items-center justify-center min-h-screen bg-gray-950 text-white">Načítám data...</div>;
    }

    return (
        <div className="p-8 space-y-8 min-h-screen bg-gray-950 text-gray-100">
            <header className="flex justify-between items-center mb-8">
                <h1 className="text-4xl font-bold">{t.title}</h1>
                <div className="flex items-center gap-6">
                    <span className="font-semibold">{currentUserProfile?.displayName || currentUser?.email}</span>
                    <button onClick={logout} className="flex items-center gap-1 bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded-lg shadow text-sm">
                        <Lock className="w-5 h-5" /> {t.logout}
                    </button>
                </div>
            </header>

            <div className="flex flex-col md:flex-row justify-center items-center gap-4">
                <label className="cursor-pointer inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg shadow">
                    <UploadCloud className="w-5 h-5 text-white" />
                    <span>{t.upload}</span>
                    <input type="file" accept=".xlsx, .xls" onChange={handleFileUpload} className="hidden" />
                </label>
                <button className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg shadow hover:bg-green-700">
                    <FileDown className="w-5 h-5" /> {t.export}
                </button>
            </div>

            {summary ? (
                <div>
                    <div className="flex space-x-1 rounded-xl bg-gray-800 p-1 mb-8 max-w-full mx-auto overflow-x-auto">
                        <button onClick={() => setActiveTab(0)} className={`flex-shrink-0 w-full md:w-auto px-4 py-2.5 text-sm rounded-lg font-medium ${activeTab === 0 ? 'bg-blue-600 text-white shadow' : 'text-blue-100 hover:bg-white/[0.12]'}`}>{t.dashboardTab}</button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-6 mt-6">
                        <Card><CardContent><p>{t.total}</p><p className="text-3xl font-bold text-blue-400">{summary.total}</p></CardContent></Card>
                        <Card><CardContent><p>{t.done}</p><p className="text-3xl font-bold text-green-400">{summary.doneTotal}</p></CardContent></Card>
                        <Card><CardContent><p>{t.remaining}</p><p className="text-3xl font-bold text-yellow-400">{summary.remainingTotal}</p></CardContent></Card>
                        <Card><CardContent><p>{t.inProgress}</p><p className="text-3xl font-bold text-orange-400">{summary.inProgressTotal}</p></CardContent></Card>
                        <Card><CardContent><p>{t.newOrders}</p><p className="text-3xl font-bold text-purple-400">{summary.newOrdersTotal}</p></CardContent></Card>
                        <Card><CardContent><p>{t.pallets}</p><p className="text-3xl font-bold text-pink-400">{summary.palletsTotal}</p></CardContent></Card>
                        <Card><CardContent><p>{t.carton}</p><p className="text-3xl font-bold text-cyan-400">{summary.cartonsTotal}</p></CardContent></Card>
                    </div>

                    <div className="mt-8">
                        <h2 className="text-2xl font-semibold mb-4">{t.statusDistribution}</h2>
                        <Card>
                            <ResponsiveContainer width="100%" height={300}>
                                <BarChart data={Object.entries(summary.statusCounts).map(([name, value]) => ({ name: `Status ${name}`, value }))}>
                                    <XAxis dataKey="name" stroke="#888888" />
                                    <YAxis stroke="#888888" />
                                    <Tooltip contentStyle={{ backgroundColor: '#333', border: 'none' }} />
                                    <Legend />
                                    <Bar dataKey="value" fill="#8884d8" />
                                </BarChart>
                            </ResponsiveContainer>
                        </Card>
                    </div>
                </div>
            ) : (
                <p className="text-center text-gray-400 mt-8">{t.noDataAvailable}</p>
            )}
        </div>
    );
};

export default Dashboard;