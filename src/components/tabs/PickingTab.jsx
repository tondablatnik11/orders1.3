'use client';
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { getSupabase } from '@/lib/supabaseClient';
import { useData } from '@/hooks/useData';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import * as XLSX from 'xlsx';
import { Package, Truck, Weight, Users, UploadCloud } from 'lucide-react';

// --- Pomocné komponenty ---
const KpiCard = ({ title, value, unit, icon, color }) => (
    <div className="bg-slate-800 p-5 rounded-lg border border-slate-700 flex items-center">
        <div className={`p-3 rounded-lg mr-4 ${color}`}>{icon}</div>
        <div>
            <h3 className="text-sm font-medium text-slate-400">{title}</h3>
            <p className="mt-1 text-3xl font-semibold text-white">
                {value} <span className="text-lg font-medium text-slate-300">{unit}</span>
            </p>
        </div>
    </div>
);

const ImportSection = ({ onImportSuccess }) => {
    const [status, setStatus] = useState({ type: 'info', message: 'Přetáhněte soubor nebo klikněte pro nahrání.' });
    const supabase = getSupabase();

    const handleFileUpload = useCallback(async (file) => {
        if (!file) return;
        setStatus({ type: 'loading', message: 'Načítám a zpracovávám soubor...' });
        try {
            const data = await file.arrayBuffer();
            const workbook = XLSX.read(data, { type: "buffer" });
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            const jsonData = XLSX.utils.sheet_to_json(worksheet, { raw: false, dateNF: 'yyyy-mm-dd' });

            if (jsonData.length === 0) throw new Error('Soubor je prázdný.');

            const processedData = jsonData.map(row => {
                const weightString = String(row['Weight'] || '0');
                const cleanedWeight = parseFloat(weightString.replace(/,/g, ''));
                const qtyString = String(row['Source actual qty.'] || '0');
                const cleanedQty = parseFloat(qtyString.replace(/,/g, ''));
                const destStorageBin = String(row['Dest.Storage Bin'] || '').trim();
                return {
                    user_name: row['User'],
                    confirmation_date: row['Confirmation date'],
                    confirmation_time: row['Confirmation time'],
                    weight: cleanedWeight,
                    material: row['Material'],
                    material_description: row['Material Description'],
                    storage_unit_type: row['Storage Unit Type'],
                    source_storage_type: row['Source Storage Type'],
                    dest_storage_type: row['Dest. Storage Type'],
                    source_storage_bin: row['Source Storage Bin'],
                    source_actual_qty: cleanedQty,
                    dest_storage_bin: destStorageBin,
                    delivery_no: destStorageBin,
                };
            });

            const { error } = await supabase.from('picking_operations').insert(processedData);
            if (error) throw error;
            setStatus({ type: 'success', message: `Hotovo! Naimportováno ${processedData.length} záznamů.` });
            if (onImportSuccess) onImportSuccess();
        } catch (error) {
            console.error("Detail chyby při importu:", error);
            setStatus({ type: 'error', message: `Nastala chyba: ${error.message}` });
        }
    }, [supabase, onImportSuccess]);

    return (
        <div className="bg-slate-800 rounded-lg border border-slate-700 p-6">
            <div className="flex items-center mb-4">
                <UploadCloud className="w-6 h-6 mr-3 text-sky-400" />
                <h2 className="text-xl font-semibold text-white">Importovat nová data</h2>
            </div>
            <p className="text-sm text-slate-400 mb-4">Nahráním souboru se data přidají do databáze a statistiky se automaticky přepočítají.</p>
            <input
                type="file"
                accept=".xlsx, .xls, .csv"
                onChange={(e) => handleFileUpload(e.target.files[0])}
                disabled={status.type === 'loading'}
                className="block w-full max-w-md text-sm text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-slate-700 file:text-slate-300 hover:file:bg-slate-600 cursor-pointer"
            />
             <div className={`mt-4 text-center p-2 rounded-md text-sm font-medium ${status.type === 'success' ? 'bg-green-900/50 text-green-300' : ''} ${status.type === 'error' ? 'bg-red-900/50 text-red-300' : ''} ${status.type === 'loading' ? 'bg-sky-900/50 text-sky-300 animate-pulse' : ''} ${status.type === 'info' ? 'bg-slate-700/50 text-slate-400' : ''}`}>
                {status.message}
            </div>
        </div>
    );
};


// --- Hlavní komponenta ---
const PickingTab = () => {
    const [pickingData, setPickingData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({ picker: '', zakazka: '', pozice: '' });
    const supabase = getSupabase();
    
    // OPRAVA: Hooky se volají na začátku komponenty
    const { allOrdersData, setSelectedOrderDetails } = useData();

    const fetchData = useCallback(async () => {
        setLoading(true);
        const { data, error } = await supabase.from('picking_dashboard_data').select('*').order('created_at', { ascending: false }).limit(5000);
        if (error) console.error("Chyba při načítání dat o pickování:", error);
        else setPickingData(data || []);
        setLoading(false);
    }, [supabase]);

    useEffect(() => { fetchData(); }, [fetchData]);
    
    const filteredData = useMemo(() => pickingData.filter(row => 
        (row.user_name || '').toLowerCase().includes(filters.picker.toLowerCase()) &&
        (row.delivery_no || '').toLowerCase().includes(filters.zakazka.toLowerCase()) &&
        (row.source_storage_bin || '').toLowerCase().includes(filters.pozice.toLowerCase())
    ), [pickingData, filters]);

    const stats = useMemo(() => {
        const dataToAnalyze = filters.picker || filters.zakazka || filters.pozice ? filteredData : pickingData;
        if (dataToAnalyze.length === 0) return { totalPicks: 0, totalWeight: 0, totalQty: 0, uniquePickers: 0, picksByPicker: [] };
        const totalPicks = dataToAnalyze.length;
        const totalWeight = dataToAnalyze.reduce((acc, row) => acc + (row.weight || 0), 0);
        const totalQty = dataToAnalyze.reduce((acc, row) => acc + (row.source_actual_qty || 0), 0);
        const uniquePickers = new Set(dataToAnalyze.map(row => row.user_name)).size;
        const picksByPicker = dataToAnalyze.reduce((acc, row) => {
            const picker = row.user_name || 'Neznámý';
            if (!acc[picker]) acc[picker] = { name: picker, "Počet operací": 0, "Celkem kusů": 0 };
            acc[picker]["Počet operací"] += 1;
            acc[picker]["Celkem kusů"] += row.source_actual_qty || 0;
            return acc;
        }, {});
        return {
            totalPicks,
            totalWeight: Math.round(totalWeight / 1000).toLocaleString(),
            totalQty: Math.round(totalQty).toLocaleString(),
            uniquePickers,
            picksByPicker: Object.values(picksByPicker).sort((a,b) => b["Počet operací"] - a["Počet operací"]),
        };
    }, [pickingData, filteredData, filters]);

    const handleFilterChange = (filterName, value) => {
        setFilters(prev => ({ ...prev, [filterName]: value }));
    };

    const handleDeliveryClick = (deliveryNo) => {
        // Nyní už jen pracujeme s daty, které jsme získali na začátku
        const orderDetails = allOrdersData.find(order => order['Delivery No'] === deliveryNo);
        const relatedPicking = pickingData.filter(p => p.delivery_no === deliveryNo);

        if (orderDetails) {
            setSelectedOrderDetails({ ...orderDetails, picking_details: relatedPicking });
        } else {
            console.warn(`Detail pro zakázku ${deliveryNo} nebyl nalezen.`);
            setSelectedOrderDetails({ "Delivery No": deliveryNo, picking_details: relatedPicking });
        }
    };

    return (
        <div className="space-y-8">
            <ImportSection onImportSuccess={fetchData} />
            <hr className="border-slate-700"/>
            <div>
                <h1 className="text-3xl font-bold text-white mb-6">KPI Přehled Pickování</h1>
                {loading ? (
                    <div className="text-center p-8 text-slate-400">Načítám KPI data...</div>
                ) : (
                    <div className="space-y-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            <KpiCard title="Celkem operací" value={stats.totalPicks.toLocaleString()} unit="ks" icon={<Package size={24} className="text-sky-400"/>} color="bg-sky-900/50" />
                            <KpiCard title="Vypickováno kusů" value={stats.totalQty} unit="ks" icon={<Truck size={24} className="text-green-400"/>} color="bg-green-900/50"/>
                            <KpiCard title="Celkem zvednuto" value={stats.totalWeight} unit="t" icon={<Weight size={24} className="text-amber-400"/>} color="bg-amber-900/50"/>
                            <KpiCard title="Aktivních pickerů" value={stats.uniquePickers} unit="" icon={<Users size={24} className="text-indigo-400"/>} color="bg-indigo-900/50"/>
                        </div>
                        <div className="bg-slate-800 p-6 rounded-lg border border-slate-700">
                            <h2 className="text-xl font-semibold mb-4 text-white">Produktivita pickerů</h2>
                            <ResponsiveContainer width="100%" height={400}>
                                <BarChart data={stats.picksByPicker} margin={{ top: 5, right: 20, left: 10, bottom: 80 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#475569" />
                                    <XAxis dataKey="name" angle={-45} textAnchor="end" interval={0} tick={{fontSize: 12, fill: '#94a3b8'}} />
                                    <YAxis tick={{fontSize: 12, fill: '#94a3b8'}}/>
                                    <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', color: '#cbd5e1' }} />
                                    <Legend wrapperStyle={{ color: '#cbd5e1' }}/>
                                    <Bar dataKey="Počet operací" fill="#38bdf8" name="Počet operací" />
                                    <Bar dataKey="Celkem kusů" fill="#4ade80" name="Celkem kusů" />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                        <div className="bg-slate-800 rounded-lg border border-slate-700 overflow-hidden">
                            <div className="p-6">
                                <h2 className="text-xl font-semibold text-white">Detailní přehled operací</h2>
                                <p className="text-sm text-slate-400 mt-1">Zobrazeno je posledních 100 záznamů, které odpovídají filtrům.</p>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                                    <input type="text" placeholder="Filtrovat pickera..." value={filters.picker} onChange={(e) => handleFilterChange('picker', e.target.value)} className="p-2 bg-slate-700 border border-slate-600 rounded-md w-full text-white placeholder-slate-400" />
                                    <input type="text" placeholder="Filtrovat zakázku..." value={filters.zakazka} onChange={(e) => handleFilterChange('zakazka', e.target.value)} className="p-2 bg-slate-700 border border-slate-600 rounded-md w-full text-white placeholder-slate-400" />
                                    <input type="text" placeholder="Filtrovat pozici..." value={filters.pozice} onChange={(e) => handleFilterChange('pozice', e.target.value)} className="p-2 bg-slate-700 border border-slate-600 rounded-md w-full text-white placeholder-slate-400" />
                                </div>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-slate-700">
                                    <thead className="bg-slate-700/50">
                                        <tr>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">Picker</th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">Zakázka</th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">Material</th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">Popis materiálu</th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">Datum</th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">Čas</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-slate-800 divide-y divide-slate-700">
                                        {filteredData.slice(0, 100).map((row, index) => (
                                            <tr key={index} className="hover:bg-slate-700/50">
                                                <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-slate-300">{row.user_name}</td>
                                                <td className="px-4 py-4 whitespace-nowrap text-sm text-sky-400 font-semibold hover:underline cursor-pointer" onClick={() => handleDeliveryClick(row.delivery_no)}>{row.delivery_no}</td>
                                                <td className="px-4 py-4 whitespace-nowrap text-sm text-slate-400">{row.material}</td>
                                                <td className="px-4 py-4 whitespace-nowrap text-sm text-slate-400">{row.material_description}</td>
                                                <td className="px-4 py-4 whitespace-nowrap text-sm text-slate-400">{new Date(row.confirmation_date).toLocaleDateString()}</td>
                                                <td className="px-4 py-4 whitespace-nowrap text-sm text-slate-400">{row.confirmation_time}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default PickingTab;