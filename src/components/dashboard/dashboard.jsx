'use client';

import React, { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from '../../contexts/AuthContext';
import { useData } from '../../contexts/DataContext';

import {
    format, isBefore, startOfDay, differenceInDays, getHours, subDays, startOfMonth, endOfMonth, isAfter, parseISO, addDays,
} from "date-fns";

import {
    BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell, Sector,
} from "recharts";

import {
    FileDown, UploadCloud, BarChart3, TimerReset, ClipboardList, Globe, Sun, Moon, Lock, History, Trash2, Search, PieChart as PieChartIcon, LineChart as LineChartIcon, XCircle,
} from "lucide-react";

import { supabase } from '../../lib/supabaseClient';
import { db as firestoreDb } from '../../lib/firebase';
import { collection, addDoc, query, onSnapshot, orderBy, updateDoc, doc, setDoc, deleteDoc } from 'firebase/firestore';


// =============== POMOCNÉ KOMPONENTY A KONSTANTY ===============
// (Tyto komponenty a konstanty byly součástí vašeho původního souboru)

const translations = {
    cz: {
        title: "Přehled zakázek",
        upload: "Nahrát soubor",
        export: "Export do PDF",
        total: "Zakázky",
        done: "Hotovo",
        remaining: "Zbývá",
        inProgress: "V procesu",
        newOrders: "Nové",
        pallets: "Palety",
        carton: "Karton",
        delayed: "Zpožděné zakázky",
        logout: "Odhlásit se",
        dashboardTab: "Dashboard",
        delayedOrdersTab: "Zpožděné zakázky",
        orderSearchTab: "Vyhledávání zakázek",
        dailySummary: "Denní souhrn",
        announcedLoadingsTab: "Avizované nakládky",
        ticketsTab: "Tickety",
        filters: "Filtry dat",
        dailyOverview: "Denní přehled stavu",
        older: "Starší",
        yesterday: "Včera",
        today: "Dnes",
        future: "Budoucí",
        noDataAvailable: "Žádná data k zobrazení.",
        statusDistribution: "Rozložení statusů",
        orderTypes: "Typy dodávek",
        statuses: "Statusy celkem",
        sentPallets: "Odesláno palet",
        sentCartons: "Odesláno balíků",
        history: "Historie importu",
        selectImport: "Vyberte import",
        // ...přidejte jakékoliv další chybějící překlady z vašeho originálního souboru...
    },
    // ...en a de verze...
};

const CHART_COLORS = ['#FFFFFF', '#EF4444', '#3B82F6', '#F59E0B', '#10B981', '#3498DB', '#9B59B6', '#28A745', '#218838', '#FFC107', '#FF9800', '#FF5722'];

const Card = ({ children, className = "", onClick }) => (
    <div className={`p-4 border border-gray-700 rounded-xl bg-gray-800 shadow-xl ${className} ${onClick ? 'cursor-pointer hover:bg-gray-700 transition-colors' : ''}`} onClick={onClick}>
        {children}
    </div>
);
const CardContent = ({ children, className = "" }) => (
    <div className={`p-4 space-y-1 ${className}`}>{children}</div>
);

// =============== HLAVNÍ KOMPONENTA DASHBOARDU ===============

const Dashboard = () => {
    // --- STAVY A HOOKY ---
    const { currentUser, currentUserProfile, logout } = useAuth();
    const { allOrdersData, importHistory, loading: dataLoading } = useData();
    const [summary, setSummary] = useState(null);
    const [lang, setLang] = useState("cz");
    const [darkMode, setDarkMode] = useState(true);
    const [activeTab, setActiveTab] = useState(0);
    const [filtersCollapsed, setFiltersCollapsed] = useState(true);

    const t = translations[lang] || translations.cz;

    // --- FUNKCE PRO ZPRACOVÁNÍ DAT ---
    const processData = useCallback((data) => {
        if (!data || data.length === 0) return null;

        const now = new Date();
        const today = startOfDay(now);
        let doneTotal = 0, remainingTotal = 0, inProgressTotal = 0, newOrdersTotal = 0, palletsTotal = 0, cartonsTotal = 0;
        const dailySummariesMap = new Map();

        data.forEach(row => {
            const status = Number(row.Status);
            if (isNaN(status)) return;

            // Souhrnné statistiky
            if ([50, 60, 70].includes(status)) doneTotal++;
            if ([10, 31, 35, 40].includes(status)) remainingTotal++;
            if ([31, 35, 40].includes(status)) inProgressTotal++;
            if ([10].includes(status)) newOrdersTotal++;
            if (row["del.type"] === 'P') palletsTotal++;
            if (row["del.type"] === 'K') cartonsTotal++;
            
            // Denní přehledy
            const loadingDateStr = row["Loading Date"];
            if (loadingDateStr) {
                const loadingDate = startOfDay(parseISO(loadingDateStr));
                const formattedDate = format(loadingDate, 'yyyy-MM-dd');

                if (!dailySummariesMap.has(formattedDate)) {
                    dailySummariesMap.set(formattedDate, { date: formattedDate, total: 0, done: 0, remaining: 0, new: 0, inProgress: 0 });
                }
                const day = dailySummariesMap.get(formattedDate);
                day.total++;
                if ([50, 60, 70].includes(status)) day.done++;
                if ([10, 31, 35, 40].includes(status)) day.remaining++;
                if ([10].includes(status)) day.new++;
                if ([31, 35, 40].includes(status)) day.inProgress++;
            }
        });
        
        return {
            total: data.length,
            doneTotal,
            remainingTotal,
            inProgressTotal,
            newOrdersTotal,
            palletsTotal,
            cartonsTotal,
            dailySummaries: Array.from(dailySummariesMap.values()),
            // ... sem přidejte další logiku pro statusCounts, deliveryTypes atd.
        };
    }, []);

    useEffect(() => {
        const processed = processData(allOrdersData);
        setSummary(processed);
    }, [allOrdersData, processData]);

    const handleLogout = async () => {
        try {
            await logout();
        } catch (error) {
            console.error("Logout error:", error);
        }
    };

    if (dataLoading) {
        return <div className="flex items-center justify-center min-h-screen bg-gray-950 text-white">Načítám data...</div>;
    }

    const today = startOfDay(new Date());
    const datesForOverview = [subDays(today, 2), subDays(today, 1), today, addDays(today, 1), addDays(today, 2), addDays(today, 3)];

    // --- JSX ZOBRAZENÍ ---
    return (
        <div className="p-8 space-y-8 min-h-screen">
            <header className="flex justify-between items-center mb-8">
                <h1 className="text-4xl font-bold">{t.title}</h1>
                <div className="flex items-center gap-6">
                    <span className="font-semibold">{currentUserProfile?.displayName || currentUser?.email}</span>
                    <button onClick={() => setLang(lang === 'cz' ? 'en' : 'cz')} className="flex items-center gap-1 bg-gray-800 hover:bg-gray-700 px-3 py-1 rounded-lg shadow text-sm">
                        <Globe className="w-4 h-4" /> {t.langCode}
                    </button>
                    <button onClick={() => setDarkMode(!darkMode)} className="flex items-center gap-1 bg-gray-800 hover:bg-gray-700 px-3 py-1 rounded-lg shadow text-sm">
                        {darkMode ? <Sun className="w-4 h-4 text-yellow-400" /> : <Moon className="w-4 h-4 text-blue-400" />}
                    </button>
                    <button onClick={handleLogout} className="flex items-center gap-1 bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded-lg shadow text-sm">
                        <Lock className="w-5 h-5" /> {t.logout}
                    </button>
                </div>
            </header>

            <div className="flex flex-col md:flex-row justify-center items-center gap-4">
                <label className="cursor-pointer inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg shadow">
                    <UploadCloud className="w-5 h-5 text-white" />
                    <span>{t.upload}</span>
                    <input type="file" className="hidden" />
                </label>
                <button className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg shadow hover:bg-green-700">
                    <FileDown className="w-5 h-5" /> {t.export}
                </button>
            </div>
            
            {importHistory.length > 0 && (
                <div className="bg-gray-800 p-4 rounded-xl shadow-lg max-w-lg mx-auto">
                    <h2 className="text-lg font-semibold text-gray-200 mb-3 flex items-center gap-2"><History className="w-5 h-5" /> {t.history}</h2>
                    <select className="p-2 rounded-md bg-gray-700 border border-gray-600 text-gray-100 w-full">
                        <option>{t.selectImport}</option>
                        {importHistory.map(imp => <option key={imp.id} value={imp.id}>{imp.date_label} - {imp.original_name}</option>)}
                    </select>
                </div>
            )}

            {summary && (
                <div>
                    <div className="flex space-x-1 rounded-xl bg-gray-800 p-1 mb-8 max-w-full mx-auto overflow-x-auto">
                        <button onClick={() => setActiveTab(0)} className={`flex-shrink-0 w-full md:w-auto px-4 py-2.5 text-sm rounded-lg font-medium ${activeTab === 0 ? 'bg-blue-600 text-white shadow' : 'text-blue-100 hover:bg-white/[0.12]'}`}>{t.dashboardTab}</button>
                        <button onClick={() => setActiveTab(1)} className={`flex-shrink-0 w-full md:w-auto px-4 py-2.5 text-sm rounded-lg font-medium ${activeTab === 1 ? 'bg-blue-600 text-white shadow' : 'text-blue-100 hover:bg-white/[0.12]'}`}>{t.delayedOrdersTab}</button>
                    </div>

                    {activeTab === 0 && (
                        <>
                            <Card className="bg-gray-800 p-4 rounded-xl shadow-lg">
                                <h2 className="text-xl font-semibold mb-3 text-gray-200 flex items-center gap-2 cursor-pointer" onClick={() => setFiltersCollapsed(!filtersCollapsed)}>
                                    <Search className="w-5 h-5" /> {t.filters}
                                </h2>
                            </Card>

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
                                <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2"><ClipboardList className="w-6 h-6 text-green-400" /> {t.dailyOverview}</h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
                                    {datesForOverview.map((date, index) => {
                                        const dailyStats = summary.dailySummaries.find(d => d.date === format(date, 'yyyy-MM-dd'));
                                        return (
                                            <Card key={index}>
                                                <CardContent>
                                                    <p className="text-gray-400 text-center font-semibold mb-2">{format(date, 'dd/MM/yyyy')}</p>
                                                    {dailyStats ? (
                                                        <div className="text-sm">
                                                            <p>{t.total}: <strong>{dailyStats.total}</strong></p>
                                                            <p>{t.done}: <strong className="text-green-300">{dailyStats.done}</strong></p>
                                                            <p>{t.remaining}: <strong className="text-yellow-300">{dailyStats.remaining}</strong></p>
                                                        </div>
                                                    ) : <p className="text-center text-gray-400 text-sm">{t.noDataAvailable}</p>}
                                                </CardContent>
                                            </Card>
                                        );
                                    })}
                                </div>
                            </div>
                        </>
                    )}
                </div>
            )}
        </div>
    );
};

export default Dashboard;