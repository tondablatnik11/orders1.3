'use client';
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { getSupabase } from '@/lib/supabaseClient';
import { useData } from '@/hooks/useData'; // Import pro otevírání detailu objednávky
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import * as XLSX from 'xlsx';
import { Package, Truck, Weight, Users, Search, XCircle } from 'lucide-react';

// --- Pomocné komponenty ---

const KpiCard = ({ title, value, unit, icon, color }) => (
    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center">
        <div className={`p-3 rounded-lg mr-4 ${color}`}>
            {icon}
        </div>
        <div>
            <h3 className="text-sm font-medium text-slate-500">{title}</h3>
            <p className="mt-1 text-3xl font-semibold text-slate-900">
                {value} <span className="text-lg font-medium text-slate-600">{unit}</span>
            </p>
        </div>
    </div>
);

const ImportSection = ({ onImportSuccess }) => {
    // ... (tato komponenta zůstává stejná, jak byla)
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
                    storage_unit_type: row['Storage Unit Type'],
                    source_storage_type: row['Source Storage Type'],
                    dest_storage_type: row['Dest. Storage Type'],
                    material: row['Material'],
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
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <h2 className="text-xl font-semibold mb-2 text-slate-800">Importovat nová data</h2>
            <p className="text-sm text-slate-500 mb-4">Nahráním souboru se data přidají do databáze a statistiky se automaticky přepočítají.</p>
            <input
                type="file"
                accept=".xlsx, .xls, .csv"
                onChange={(e) => handleFileUpload(e.target.files[0])}
                disabled={status.type === 'loading'}
                className="block w-full max-w-md text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-slate-50 file:text-slate-700 hover:file:bg-slate-100 cursor-pointer"
            />
             <div className={`mt-4 text-center p-2 rounded-lg text-sm font-medium ${status.type === 'success' ? 'bg-green-100 text-green-800' : ''} ${status.type === 'error' ? 'bg-red-100 text-red-800' : ''} ${status.type === 'loading' ? 'bg-blue-100 text-blue-800 animate-pulse' : ''} ${status.type === 'info' ? 'bg-slate-100 text-slate-600' : ''}`}>
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
    
    // Získání funkce pro zobrazení detailu objednávky z DataContextu
    const { setSelectedOrderDetails } = useData();

    const fetchData = useCallback(async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('picking_dashboard_data')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(5000);

        if (error) {
            console.error("Chyba při načítání dat o pickování:", error);
        } else {
            setPickingData(data || []);
        }
        setLoading(false);
    }, [supabase]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);
    
    // Aplikování filtrů na zobrazená data
    const filteredData = useMemo(() => {
        return pickingData.filter(row => {
            return (
                (row.user_name || '').toLowerCase().includes(filters.picker.toLowerCase()) &&
                (row.delivery_no || '').toLowerCase().includes(filters.zakazka.toLowerCase()) &&
                (row.source_storage_bin || '').toLowerCase().includes(filters.pozice.toLowerCase())
            );
        });
    }, [pickingData, filters]);

    const stats = useMemo(() => {
        // ... (výpočty zůstávají stejné)
        const dataToAnalyze = filters.picker || filters.zakazka || filters.pozice ? filteredData : pickingData;
        
        if (dataToAnalyze.length === 0) return { totalPicks: 0, totalWeight: 0, totalQty: 0, uniquePickers: 0, picksByPicker: [] };
        const totalPicks = dataToAnalyze.length;
        const totalWeight = dataToAnalyze.reduce((acc, row) => acc + (row.weight || 0), 0);
        const totalQty = dataToAnalyze.reduce((acc, row) => acc + (row.source_actual_qty || 0), 0);
        const uniquePickers = new Set(dataToAnalyze.map(row => row.user_name)).size;
        const picksByPicker = dataToAnalyze.reduce((acc, row) => {
            const picker = row.user_name || 'Neznámý';
            if (!acc[picker]) {
                acc[picker] = { name: picker, "Počet operací": 0, "Celkem kusů": 0 };
            }
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

    // Funkce, která najde kompletní data o objednávce a otevře modální okno
    const handleDeliveryClick = (deliveryNo) => {
        const { allOrdersData } = useData();
        const orderDetails = allOrdersData.find(order => order['Delivery No'] === deliveryNo);
        if (orderDetails) {
            setSelectedOrderDetails(orderDetails);
        } else {
            console.warn(`Detail pro zakázku ${deliveryNo} nebyl nalezen v hlavních datech.`);
            // Zobrazíme alespoň to, co máme
            setSelectedOrderDetails({ "Delivery No": deliveryNo });
        }
    };

    return (
        <div className="space-y-8 bg-slate-50 p-8 rounded-2xl">
            <ImportSection onImportSuccess={fetchData} />
            <hr />
            <div>
                <h1 className="text-3xl font-bold text-slate-800 mb-6">KPI Přehled Pickování</h1>
                {loading ? (
                    <div className="text-center p-8">Načítám KPI data...</div>
                ) : (
                    <div className="space-y-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            <KpiCard title="Celkem operací" value={stats.totalPicks.toLocaleString()} unit="ks" icon={<Package size={24} className="text-blue-600"/>} color="bg-blue-100" />
                            <KpiCard title="Vypickováno kusů" value={stats.totalQty} unit="ks" icon={<Truck size={24} className="text-green-600"/>} color="bg-green-100"/>
                            <KpiCard title="Celkem zvednuto" value={stats.totalWeight} unit="t" icon={<Weight size={24} className="text-amber-600"/>} color="bg-amber-100"/>
                            <KpiCard title="Aktivních pickerů" value={stats.uniquePickers} unit="" icon={<Users size={24} className="text-indigo-600"/>} color="bg-indigo-100"/>
                        </div>
                        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                            <h2 className="text-xl font-semibold mb-4 text-slate-900">Produktivita pickerů</h2>
                            <ResponsiveContainer width="100%" height={400}>
                                <BarChart data={stats.picksByPicker} margin={{ top: 5, right: 20, left: 10, bottom: 80 }}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="name" angle={-45} textAnchor="end" interval={0} tick={{fontSize: 12}} />
                                    <YAxis />
                                    <Tooltip />
                                    <Legend verticalAlign="top" />
                                    <Bar dataKey="Počet operací" fill="#3b82f6" name="Počet operací" />
                                    <Bar dataKey="Celkem kusů" fill="#84cc16" name="Celkem kusů" />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                            <div className="p-6">
                                <h2 className="text-xl font-semibold text-slate-900">Detailní přehled operací</h2>
                                <p className="text-sm text-slate-500 mt-1">Zobrazeno je posledních 100 záznamů, které odpovídají filtrům.</p>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                                    <input type="text" placeholder="Filtrovat pickera..." value={filters.picker} onChange={(e) => handleFilterChange('picker', e.target.value)} className="p-2 border rounded-md" />
                                    <input type="text" placeholder="Filtrovat zakázku..." value={filters.zakazka} onChange={(e) => handleFilterChange('zakazka', e.target.value)} className="p-2 border rounded-md" />
                                    <input type="text" placeholder="Filtrovat pozici..." value={filters.pozice} onChange={(e) => handleFilterChange('pozice', e.target.value)} className="p-2 border rounded-md" />
                                </div>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-slate-200">
                                    <thead className="bg-slate-50">
                                        <tr>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Picker</th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Zakázka</th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Pozice pickování</th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Počet kusů</th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Příjemce</th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Datum</th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Čas</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-slate-200">
                                        {filteredData.slice(0, 100).map((row, index) => (
                                            <tr key={index} className="hover:bg-slate-50">
                                                <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-slate-900">{row.user_name}</td>
                                                <td className="px-4 py-4 whitespace-nowrap text-sm text-blue-600 font-semibold hover:underline cursor-pointer" onClick={() => handleDeliveryClick(row.delivery_no)}>{row.delivery_no}</td>
                                                <td className="px-4 py-4 whitespace-nowrap text-sm text-slate-500">{row.source_storage_bin}</td>
                                                <td className="px-4 py-4 whitespace-nowrap text-sm text-slate-500">{row.source_actual_qty}</td>
                                                <td className="px-4 py-4 whitespace-nowrap text-sm text-slate-500">{row.deliveries?.["Name of ship-to party"] || 'N/A'}</td>
                                                <td className="px-4 py-4 whitespace-nowrap text-sm text-slate-500">{new Date(row.confirmation_date).toLocaleDateString()}</td>
                                                <td className="px-4 py-4 whitespace-nowrap text-sm text-slate-500">{row.confirmation_time}</td>
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