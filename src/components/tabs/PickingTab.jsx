'use client';
// ZDE BYLA CHYBA: Opravený import Reactu a všech potřebných hooků
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { getSupabase } from '@/lib/supabaseClient';
import { useData } from '@/hooks/useData';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';
import * as XLSX from 'xlsx';
import { Package, Truck, Weight, Users, UploadCloud, ChevronDown, ChevronUp, ArrowUpDown } from 'lucide-react';
// Ujistěte se, že máte nainstalovanou knihovnu 'date-fns': npm install date-fns
import { format, startOfDay, endOfDay, eachHourOfInterval, parseISO } from 'date-fns';

// --- Vylepšené pomocné komponenty ---

const KpiCard = ({ title, value, unit, icon, color }) => (
    <div className="bg-slate-800 p-5 rounded-lg border border-slate-700 flex items-center">
        <div className={`p-3 rounded-lg mr-4 ${color}`}>{icon}</div>
        <div>
            <h3 className="text-sm font-medium text-slate-400">{title}</h3>
            <p className="mt-1 text-2xl font-semibold text-white">
                {value} <span className="text-base font-medium text-slate-300">{unit}</span>
            </p>
        </div>
    </div>
);

const ImportSection = ({ onImportSuccess }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [status, setStatus] = useState({ type: 'info', message: 'Připraven k importu.' });
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
        <div className="bg-slate-800 rounded-lg border border-slate-700">
            <button onClick={() => setIsOpen(!isOpen)} className="w-full flex justify-between items-center p-4 hover:bg-slate-700/50 transition-colors">
                <div className="flex items-center">
                    <UploadCloud className="w-5 h-5 mr-3 text-sky-400" />
                    <h2 className="text-lg font-semibold text-white">Importovat nová data</h2>
                </div>
                {isOpen ? <ChevronUp className="text-slate-400" /> : <ChevronDown className="text-slate-400" />}
            </button>
            {isOpen && (
                <div className="p-6 border-t border-slate-700">
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
            )}
        </div>
    );
};

// --- Hlavní komponenta ---
const PickingTab = () => {
    const [pickingData, setPickingData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({ global: '' });
    const [sortConfig, setSortConfig] = useState({ key: 'created_at', direction: 'desc' });
    const [activityDate, setActivityDate] = useState(new Date());
    const [selectedUsers, setSelectedUsers] = useState([]);
    
    const supabase = getSupabase();
    const { allOrdersData, setSelectedOrderDetails } = useData();

    const fetchData = useCallback(async () => {
        setLoading(true);
        const { data, error } = await supabase.from('picking_dashboard_data').select('*').order('created_at', { ascending: false }).limit(10000);
        if (error) console.error("Chyba při načítání dat o pickování:", error);
        else setPickingData(data || []);
        setLoading(false);
    }, [supabase]);

    useEffect(() => { fetchData(); }, [fetchData]);

    const sortedFilteredData = useMemo(() => {
        let sortableItems = [...pickingData].filter(row => 
            Object.values(row).some(value => 
                String(value).toLowerCase().includes(filters.global.toLowerCase())
            )
        );
        if (sortConfig.key !== null) {
            sortableItems.sort((a, b) => {
                if (a[sortConfig.key] < b[sortConfig.key]) return sortConfig.direction === 'asc' ? -1 : 1;
                if (a[sortConfig.key] > b[sortConfig.key]) return sortConfig.direction === 'asc' ? 1 : -1;
                return 0;
            });
        }
        return sortableItems;
    }, [pickingData, filters, sortConfig]);

    const stats = useMemo(() => {
        if (pickingData.length === 0) return { totalPicks: 0, totalWeight: 0, totalQty: 0, uniquePickers: 0, avgPicksPerPicker: 0, avgWeightPerPick: 0, picksByPicker: [] };
        const totalPicks = pickingData.length;
        const totalWeight = pickingData.reduce((acc, row) => acc + (row.weight || 0), 0);
        const totalQty = pickingData.reduce((acc, row) => acc + (row.source_actual_qty || 0), 0);
        const uniquePickers = new Set(pickingData.map(row => row.user_name)).size;
        const picksByPicker = pickingData.reduce((acc, row) => {
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
            avgPicksPerPicker: uniquePickers > 0 ? (totalPicks / uniquePickers).toFixed(1) : 0,
            avgWeightPerPick: totalPicks > 0 ? (totalWeight / totalPicks).toFixed(2) : 0,
            picksByPicker: Object.values(picksByPicker).sort((a,b) => b["Počet operací"] - a["Počet operací"]),
        };
    }, [pickingData]);

    const activityByHour = useMemo(() => {
        const start = startOfDay(activityDate);
        const end = endOfDay(activityDate);
        
        const relevantOps = pickingData.filter(op => {
            const opDate = op.confirmation_date ? parseISO(op.confirmation_date) : null;
            if (!opDate) return false;
            const isSameDay = opDate.getTime() >= start.getTime() && opDate.getTime() <= end.getTime();
            const isUserSelected = selectedUsers.length === 0 || selectedUsers.includes(op.user_name);
            return isSameDay && isUserSelected;
        });

        const hours = eachHourOfInterval({ start, end });
        const data = hours.map(hour => {
            const hourString = format(hour, 'HH:00');
            const operationsInHour = relevantOps.filter(op => op.confirmation_time && op.confirmation_time.startsWith(hourString.substring(0, 2)));
            let userCounts = { name: hourString };
            operationsInHour.forEach(op => {
                userCounts[op.user_name] = (userCounts[op.user_name] || 0) + 1;
            });
            return userCounts;
        });
        return data;
    }, [pickingData, activityDate, selectedUsers]);

    const allPickers = useMemo(() => [...new Set(pickingData.map(p => p.user_name).filter(Boolean))].sort(), [pickingData]);

    const requestSort = (key) => {
        let direction = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') direction = 'desc';
        setSortConfig({ key, direction });
    };

    const handleDeliveryClick = (deliveryNo) => {
        const orderDetails = allOrdersData.find(order => order['Delivery No'] === deliveryNo);
        const relatedPicking = pickingData.filter(p => p.delivery_no === deliveryNo);
        if (orderDetails) {
            setSelectedOrderDetails({ ...orderDetails, picking_details: relatedPicking });
        } else {
            console.warn(`Detail pro zakázku ${deliveryNo} nebyl nalezen.`);
            setSelectedOrderDetails({ "Delivery No": deliveryNo, picking_details: relatedPicking });
        }
    };

    const SortableHeader = ({ label, columnKey }) => (
        <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase cursor-pointer hover:bg-slate-700" onClick={() => requestSort(columnKey)}>
            <div className="flex items-center">
                {label}
                {sortConfig.key === columnKey && <ArrowUpDown className="w-4 h-4 ml-2" />}
            </div>
        </th>
    );

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
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
                            <KpiCard title="Celkem operací" value={stats.totalPicks.toLocaleString()} unit="ks" icon={<Package size={24} className="text-sky-400"/>} color="bg-sky-900/50" />
                            <KpiCard title="Vypickováno kusů" value={stats.totalQty} unit="ks" icon={<Truck size={24} className="text-green-400"/>} color="bg-green-900/50"/>
                            <KpiCard title="Celkem zvednuto" value={stats.totalWeight} unit="t" icon={<Weight size={24} className="text-amber-400"/>} color="bg-amber-900/50"/>
                            <KpiCard title="Aktivních pickerů" value={stats.uniquePickers} unit="" icon={<Users size={24} className="text-indigo-400"/>} color="bg-indigo-900/50"/>
                            <KpiCard title="Prům. operací / picker" value={stats.avgPicksPerPicker} unit="" icon={<Users size={24} className="text-pink-400"/>} color="bg-pink-900/50"/>
                            <KpiCard title="Prům. váha / operaci" value={stats.avgWeightPerPick} unit="kg" icon={<Weight size={24} className="text-teal-400"/>} color="bg-teal-900/50"/>
                        </div>
                        
                        <div className="bg-slate-800 p-6 rounded-lg border border-slate-700">
                            <h2 className="text-xl font-semibold mb-4 text-white">Aktivita pickerů v čase</h2>
                            <div className="flex flex-wrap items-center gap-4 mb-4">
                                <input type="date" value={format(activityDate, 'yyyy-MM-dd')} onChange={e => setActivityDate(e.target.valueAsDate || new Date())} className="p-2 bg-slate-700 border border-slate-600 rounded-md text-white"/>
                                <select multiple value={selectedUsers} onChange={e => setSelectedUsers(Array.from(e.target.selectedOptions, option => option.value))} className="p-2 bg-slate-700 border border-slate-600 rounded-md text-white h-24 w-48">
                                    {allPickers.map(p => <option key={p} value={p}>{p}</option>)}
                                </select>
                                <button onClick={() => setSelectedUsers([])} className="p-2 bg-slate-600 rounded-md text-white self-start">Vybrat všechny</button>
                            </div>
                            <ResponsiveContainer width="100%" height={400}>
                                <LineChart data={activityByHour}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#475569" />
                                    <XAxis dataKey="name" tick={{fontSize: 12, fill: '#94a3b8'}}/>
                                    <YAxis tick={{fontSize: 12, fill: '#94a3b8'}}/>
                                    <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155' }}/>
                                    <Legend />
                                    { (selectedUsers.length > 0 ? selectedUsers : allPickers).map((user, i) => <Line key={user} type="monotone" dataKey={user} name={user} stroke={['#38bdf8', '#4ade80', '#facc15', '#a78bfa', '#f472b6', '#2dd4bf'][i % 6]} strokeWidth={2} />)}
                                </LineChart>
                            </ResponsiveContainer>
                        </div>

                        <div className="bg-slate-800 rounded-lg border border-slate-700 overflow-hidden">
                            <div className="p-6">
                                <h2 className="text-xl font-semibold text-white">Detailní přehled operací</h2>
                                <div className="mt-4">
                                    <input type="text" placeholder="Hledat ve všech sloupcích..." value={filters.global} onChange={(e) => setFilters({global: e.target.value})} className="p-2 bg-slate-700 border border-slate-600 rounded-md w-full md:w-1/3 text-white placeholder-slate-400" />
                                </div>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-slate-700">
                                    <thead className="bg-slate-700/50">
                                        <tr>
                                            <SortableHeader label="Picker" columnKey="user_name" />
                                            <SortableHeader label="Zakázka" columnKey="delivery_no" />
                                            <SortableHeader label="Pozice" columnKey="source_storage_bin" />
                                            <SortableHeader label="Množství" columnKey="source_actual_qty" />
                                            <SortableHeader label="Váha (kg)" columnKey="weight" />
                                            <SortableHeader label="Datum" columnKey="confirmation_date" />
                                            <SortableHeader label="Čas" columnKey="confirmation_time" />
                                        </tr>
                                    </thead>
                                    <tbody className="bg-slate-800 divide-y divide-slate-700">
                                        {sortedFilteredData.slice(0, 100).map((row) => (
                                            <tr key={row.id} className="hover:bg-slate-700/50">
                                                <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-slate-300">{row.user_name}</td>
                                                <td className="px-4 py-4 whitespace-nowrap text-sm text-sky-400 font-semibold hover:underline cursor-pointer" onClick={() => handleDeliveryClick(row.delivery_no)}>{row.delivery_no}</td>
                                                <td className="px-4 py-4 whitespace-nowrap text-sm text-slate-400">{row.source_storage_bin}</td>
                                                <td className="px-4 py-4 whitespace-nowrap text-sm text-slate-400">{row.source_actual_qty}</td>
                                                <td className="px-4 py-4 whitespace-nowrap text-sm text-slate-400">{row.weight}</td>
                                                <td className="px-4 py-4 whitespace-nowrap text-sm text-slate-400">{row.confirmation_date ? format(parseISO(row.confirmation_date), 'dd.MM.yyyy') : ''}</td>
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