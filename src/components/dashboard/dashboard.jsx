'use client';

import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from '../../contexts/AuthContext';
import { useData } from '../../contexts/DataContext';

import { format, isBefore, startOfDay, differenceInDays, parseISO, addDays, subDays } from "date-fns";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { FileDown, UploadCloud, Lock, History, Search, ClipboardList } from "lucide-react";
import { getSupabase } from '../../lib/supabaseClient';

const Card = ({ children, className = "" }) => (
    <div className={`p-4 border border-gray-700 rounded-xl bg-gray-800 shadow-xl ${className}`}>
        <div className={`p-4 space-y-1`}>{children}</div>
    </div>
);

const Dashboard = () => {
    const { currentUserProfile, logout } = useAuth();
    const { allOrdersData, importHistory, loading: dataLoading, refetchData } = useData();
    const [summary, setSummary] = useState(null);
    const [activeTab, setActiveTab] = useState(0);

    const translations = {
        cz: {
            title: "Přehled zakázek", upload: "Nahrát soubor", export: "Export do PDF",
            total: "Zakázky", done: "Hotovo", remaining: "Zbývá", inProgress: "V procesu",
            newOrders: "Nové", pallets: "Palety", carton: "Kartony", logout: "Odhlásit se",
            dashboardTab: "Dashboard", delayedOrdersTab: "Zpožděné zakázky",
            filters: "Filtry dat", dailyOverview: "Denní přehled stavu", older: "Starší",
            yesterday: "Včera", today: "Dnes", future: "Budoucí", noDataAvailable: "Žádná data k zobrazení.",
            statusDistribution: "Rozložení statusů", history: "Historie importu", selectImport: "Vyberte import",
        },
    };
    const t = translations.cz;

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

            if (row["Loading Date"]) {
                try {
                    const formattedDate = format(startOfDay(parseISO(row["Loading Date"])), 'yyyy-MM-dd');
                    if (!summaryData.dailySummaries.has(formattedDate)) {
                        summaryData.dailySummaries.set(formattedDate, { date: formattedDate, total: 0, done: 0, remaining: 0, new: 0, inProgress: 0 });
                    }
                    const day = summaryData.dailySummaries.get(formattedDate);
                    day.total++;
                    if ([50, 60, 70].includes(status)) day.done++;
                    if ([10, 31, 35, 40].includes(status)) day.remaining++;
                    if ([10].includes(status)) day.new++;
                    if ([31, 35, 40].includes(status)) day.inProgress++;
                } catch (e) { console.error("Invalid date format for row:", row); }
            }
        });
        
        summaryData.dailySummaries = Array.from(summaryData.dailySummaries.values());
        return summaryData;
    }, []);

    useEffect(() => {
        if (typeof window.XLSX === 'undefined') {
            const script = document.createElement('script');
            script.src = "https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js";
            document.head.appendChild(script);
        }
    }, []);
    
    useEffect(() => {
        setSummary(processData(allOrdersData));
    }, [allOrdersData, processData]);

    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file || typeof XLSX === 'undefined') return;

        const reader = new FileReader();
        reader.onload = async (evt) => {
            try {
                const bstr = evt.target.result;
                const wb = XLSX.read(bstr, { type: 'binary' });
                const wsname = wb.SheetNames[0];
                const ws = wb.Sheets[wsname];
                const jsonData = XLSX.utils.sheet_to_json(ws);
                
                const transformedData = jsonData.map(row => ({
                    "Delivery No": String(row["Delivery No"] || row["Delivery"]),
                    "Status": Number(row["Status"]),
                    "del.type": row["del.type"],
                    "Loading Date": new Date((row["Loading Date"] - 25569) * 86400 * 1000).toISOString(),
                }));

                const supabase = getSupabase();
                const { error } = await supabase.from('deliveries').upsert(transformedData, { onConflict: 'Delivery No' });
                if (error) throw error;
                
                alert('Data byla úspěšně nahrána!');
                refetchData();
            } catch (error) {
                console.error('File upload error:', error);
                alert('Chyba při nahrávání dat.');
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
            </div>
            
            <div className="flex space-x-1 rounded-xl bg-gray-800 p-1 mb-8 max-w-full mx-auto overflow-x-auto">
                <button onClick={() => setActiveTab(0)} className={`flex-shrink-0 w-full md:w-auto px-4 py-2.5 text-sm rounded-lg font-medium ${activeTab === 0 ? 'bg-blue-600 text-white shadow' : 'text-blue-100 hover:bg-white/[0.12]'}`}>{t.dashboardTab}</button>
                {/* Zde si můžete přidat další tlačítka pro ostatní záložky */}
            </div>

            {!summary ? (
                <p className="text-center text-gray-400 mt-8">{t.noDataAvailable}</p>
            ) : (
                <div id="report-section">
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
                                    <YAxis stroke="#888888" allowDecimals={false} />
                                    <Tooltip contentStyle={{ backgroundColor: '#333', border: 'none' }} cursor={{ fill: 'rgba(107, 114, 128, 0.2)' }} />
                                    <Bar dataKey="value" fill="#8884d8" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </Card>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Dashboard;