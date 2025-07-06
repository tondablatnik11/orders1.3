'use client';

import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from '../../contexts/AuthContext';
import { useData } from '../../contexts/DataContext';

import {
    format, isBefore, startOfDay, differenceInDays, getHours, subDays, startOfMonth, endOfMonth, isAfter, parseISO, addDays,
} from "date-fns";

import {
    BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend,
} from "recharts";

import {
    FileDown, UploadCloud, Lock, History, Globe, Sun, Moon, Search, ClipboardList,
} from "lucide-react";

import { getSupabase } from '../../lib/supabaseClient';

// Pomocné komponenty
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
    // Data z kontextů
    const { currentUserProfile, logout } = useAuth();
    const { allOrdersData, importHistory, loading: dataLoading, refetchData } = useData();

    // UI Stavy
    const [summary, setSummary] = useState(null);
    const [lang, setLang] = useState("cz");
    const [activeTab, setActiveTab] = useState(0);
    const [filtersCollapsed, setFiltersCollapsed] = useState(true);

    const translations = {
        cz: {
            title: "Přehled zakázek", upload: "Nahrát soubor", export: "Export do PDF",
            total: "Zakázky", done: "Hotovo", remaining: "Zbývá", inProgress: "V procesu",
            newOrders: "Nové", pallets: "Palety", carton: "Kartony", logout: "Odhlásit se",
            dashboardTab: "Dashboard", delayedOrdersTab: "Zpožděné zakázky",
            orderSearchTab: "Vyhledávání zakázek", dailySummary: "Denní souhrn",
            announcedLoadingsTab: "Avizované nakládky", ticketsTab: "Tickety",
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
            total: data.length, doneTotal: 0, remainingTotal: 0, inProgressTotal: 0, newOrdersTotal: 0,
            palletsTotal: 0, cartonsTotal: 0, statusCounts: {}, dailySummaries: new Map(),
        };

        const today = startOfDay(new Date());

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

            const loadingDateStr = row["Loading Date"];
            if (loadingDateStr) {
                const loadingDate = startOfDay(parseISO(loadingDateStr));
                const formattedDate = format(loadingDate, 'yyyy-MM-dd');
                if (!summaryData.dailySummaries.has(formattedDate)) {
                    summaryData.dailySummaries.set(formattedDate, { date: formattedDate, total: 0, done: 0, remaining: 0, new: 0, inProgress: 0 });
                }
                const day = summaryData.dailySummaries.get(formattedDate);
                day.total++;
                if ([50, 60, 70].includes(status)) day.done++;
                if ([10, 31, 35, 40].includes(status)) day.remaining++;
                if ([10].includes(status)) day.new++;
                if ([31, 35, 40].includes(status)) day.inProgress++;
            }
        });
        
        summaryData.dailySummaries = Array.from(summaryData.dailySummaries.values());
        return summaryData;
    }, []);

    useEffect(() => {
        setSummary(processData(allOrdersData));
    }, [allOrdersData, processData]);

    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (typeof XLSX === 'undefined') {
             alert("Knihovna pro zpracování souborů se načítá, zkuste to prosím za chvíli znovu.");
             return;
        }

        const reader = new FileReader();
        reader.onload = async (evt) => {
            try {
                const bstr = evt.target.result;
                const wb = XLSX.read(bstr, { type: 'binary' });
                const wsname = wb.SheetNames[0];
                const ws = wb.Sheets[wsname];
                const data = XLSX.utils.sheet_to_json(ws);
                
                if (data.length > 0) {
                    const supabase = getSupabase();
                    const transformedData = data.map(row => ({
                        ...row,
                        "Delivery No": row["Delivery No"] || row["Delivery"],
                        "Loading Date": new Date((row["Loading Date"] - 25569) * 86400 * 1000).toISOString(),
                    }));

                    const { error } = await supabase.from('deliveries').upsert(transformedData, { onConflict: 'Delivery No' });

                    if (error) throw error;

                    alert('Data byla úspěšně nahrána!');
                    refetchData(); // Znovu načteme data z databáze
                }
            } catch (error) {
                 console.error('Error during file upload:', error);
                 alert('Chyba při nahrávání dat. Zkontrolujte formát souboru a konzoli pro více detailů.');
            }
        };
        reader.readAsBinaryString(file);
    };

    if (dataLoading) {
        return <div className="flex items-center justify-center min-h-screen bg-gray-950 text-white">Načítám data...</div>;
    }

    const today = startOfDay(new Date());
    const datesForOverview = [subDays(today, 2), subDays(today, 1), today, addDays(today, 1), addDays(today, 2), addDays(today, 3)];

    return (
        <div className="p-8 space-y-8 min-h-screen bg-gray-950 text-gray-100">
            <header className="flex justify-between items-center mb-8">
                <h1 className="text-4xl font-bold">{t.title}</h1>
                <div className="flex items-center gap-6">
                    <span className="font-semibold">{currentUserProfile?.displayName}</span>
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
            
            {importHistory.length > 0 && (
                <div className="bg-gray-800 p-4 rounded-xl shadow-lg max-w-lg mx-auto">
                    <h2 className="text-lg font-semibold text-gray-200 mb-3 flex items-center gap-2"><History className="w-5 h-5" /> {t.history}</h2>
                    <select className="p-2 rounded-md bg-gray-700 border border-gray-600 text-gray-100 w-full">
                        <option>{t.selectImport}</option>
                        {importHistory.map(imp => <option key={imp.id} value={imp.id}>{format(parseISO(imp.created_at), 'dd/MM/yyyy HH:mm')} - {imp.original_name}</option>)}
                    </select>
                </div>
            )}
            
            <div className="flex space-x-1 rounded-xl bg-gray-800 p-1 mb-8 max-w-full mx-auto overflow-x-auto">
                <button onClick={() => setActiveTab(0)} className={`flex-shrink-0 w-full md:w-auto px-4 py-2.5 text-sm rounded-lg font-medium ${activeTab === 0 ? 'bg-blue-600 text-white shadow' : 'text-blue-100 hover:bg-white/[0.12]'}`}>{t.dashboardTab}</button>
                <button onClick={() => setActiveTab(1)} className={`flex-shrink-0 w-full md:w-auto px-4 py-2.5 text-sm rounded-lg font-medium ${activeTab === 1 ? 'bg-blue-600 text-white shadow' : 'text-blue-100 hover:bg-white/[0.12]'}`}>{t.delayedOrdersTab}</button>
            </div>

            {!summary ? (
                <p className="text-center text-gray-400 mt-8">{t.noDataAvailable}</p>
            ) : (
                <div>
                    {activeTab === 0 && (
                        <>
                            <Card className="bg-gray-800 p-4 rounded-xl shadow-lg">
                                <h2 className="text-xl font-semibold mb-3 text-gray-200 flex items-center gap-2 cursor-pointer" onClick={() => setFiltersCollapsed(!filtersCollapsed)}>
                                    <Search className="w-5 h-5" /> {t.filters}
                                </h2>
                            </Card>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-6 mt-6">
                                <Card><CardContent><p className="text-gray-400">{t.total}</p><p className="text-3xl font-bold text-blue-400">{summary.total}</p></CardContent></Card>
                                <Card><CardContent><p className="text-gray-400">{t.done}</p><p className="text-3xl font-bold text-green-400">{summary.doneTotal}</p></CardContent></Card>
                                <Card><CardContent><p className="text-gray-400">{t.remaining}</p><p className="text-3xl font-bold text-yellow-400">{summary.remainingTotal}</p></CardContent></Card>
                                <Card><CardContent><p className="text-gray-400">{t.inProgress}</p><p className="text-3xl font-bold text-orange-400">{summary.inProgressTotal}</p></CardContent></Card>
                                <Card><CardContent><p className="text-gray-400">{t.newOrders}</p><p className="text-3xl font-bold text-purple-400">{summary.newOrdersTotal}</p></CardContent></Card>
                                <Card><CardContent><p className="text-gray-400">{t.pallets}</p><p className="text-3xl font-bold text-pink-400">{summary.palletsTotal}</p></CardContent></Card>
                                <Card><CardContent><p className="text-gray-400">{t.carton}</p><p className="text-3xl font-bold text-cyan-400">{summary.cartonsTotal}</p></CardContent></Card>
                            </div>

                            <div className="mt-8">
                                <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2"><ClipboardList className="w-6 h-6 text-green-400" /> {t.dailyOverview}</h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
                                    {datesForOverview.map((date) => {
                                        const dateStr = format(date, 'yyyy-MM-dd');
                                        const dailyStats = summary.dailySummaries.find(d => d.date === dateStr);
                                        return (
                                            <Card key={dateStr}>
                                                <CardContent>
                                                    <p className="text-gray-400 text-center font-semibold mb-2">{format(date, 'dd/MM/yyyy')}</p>
                                                    {dailyStats ? (
                                                        <div className="text-sm">
                                                            <p>{t.total}: <strong>{dailyStats.total}</strong></p>
                                                            <p>{t.done}: <strong className="text-green-300">{dailyStats.done}</strong></p>
                                                            <p>{t.remaining}: <strong className="text-yellow-300">{dailyStats.remaining}</strong></p>
                                                            <p>{t.inProgress}: <strong className="text-orange-300">{dailyStats.inProgress}</strong></p>
                                                            <p>{t.newOrders}: <strong className="text-purple-300">{dailyStats.new}</strong></p>
                                                        </div>
                                                    ) : <p className="text-center text-gray-400 text-sm">{t.noDataAvailable}</p>}
                                                </CardContent>
                                            </Card>
                                        );
                                    })}
                                </div>
                            </div>
                             <div className="mt-8">
                                <h2 className="text-2xl font-semibold mb-4">{t.statusDistribution}</h2>
                                <Card>
                                    <ResponsiveContainer width="100%" height={300}>
                                        <BarChart data={Object.entries(summary.statusCounts).map(([name, value]) => ({ name: `Status ${name}`, value }))}>
                                            <XAxis dataKey="name" stroke="#888888" />
                                            <YAxis stroke="#888888" />
                                            <Tooltip contentStyle={{ backgroundColor: '#333', border: 'none' }} />
                                            <Bar dataKey="value" fill="#8884d8" />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </Card>
                            </div>
                        </>
                    )}
                </div>
            )}
        </div>
    );
};

export default Dashboard;