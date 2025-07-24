'use client';
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { getSupabase } from '@/lib/supabaseClient';
import { useData } from '@/hooks/useData';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area } from 'recharts';
import * as XLSX from 'xlsx';
import { Package, Truck, Weight, Users, UploadCloud, ChevronDown, ChevronUp, ArrowUpDown, Clock, UserCheck, Sunrise, Sunset } from 'lucide-react';
import { format, startOfDay, endOfDay, eachHourOfInterval, parseISO, isWithinInterval, differenceInDays, eachDayOfInterval, eachWeekOfInterval, eachMonthOfInterval, getWeek, getMonth } from 'date-fns';
import { cs } from 'date-fns/locale';

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
                const weightString = String(row['Weight'] || '0').replace(/,/g, '');
                const qtyString = String(row['Source actual qty.'] || '0').replace(/,/g, '');
                return {
                    user_name: row['User'],
                    confirmation_date: row['Confirmation date'],
                    confirmation_time: row['Confirmation time'],
                    weight: parseFloat(weightString),
                    material: row['Material'],
                    material_description: row['Material Description'],
                    source_storage_bin: row['Source Storage Bin'],
                    source_actual_qty: parseFloat(qtyString),
                    delivery_no: String(row['Dest.Storage Bin'] || '').trim(),
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
                <div className="flex items-center"><UploadCloud className="w-5 h-5 mr-3 text-sky-400" /><h2 className="text-lg font-semibold text-white">Importovat nová data</h2></div>
                {isOpen ? <ChevronUp className="text-slate-400" /> : <ChevronDown className="text-slate-400" />}
            </button>
            {isOpen && (
                <div className="p-6 border-t border-slate-700">
                    <input type="file" accept=".xlsx, .xls, .csv" onChange={(e) => handleFileUpload(e.target.files[0])} disabled={status.type === 'loading'} className="block w-full max-w-md text-sm text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-slate-700 file:text-slate-300 hover:file:bg-slate-600 cursor-pointer"/>
                    <div className={`mt-4 text-center p-2 rounded-md text-sm font-medium ${status.type === 'success' ? 'bg-green-900/50 text-green-300' : ''} ${status.type === 'error' ? 'bg-red-900/50 text-red-300' : ''} ${status.type === 'loading' ? 'bg-sky-900/50 text-sky-300 animate-pulse' : ''} ${status.type === 'info' ? 'bg-slate-700/50 text-slate-400' : ''}`}>{status.message}</div>
                </div>
            )}
        </div>
    );
};

// --- Hlavní komponenta ---
const PickingTab = () => {
    const [pickingData, setPickingData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [sortConfig, setSortConfig] = useState({ key: 'created_at', direction: 'desc' });
    const [dateRange, setDateRange] = useState({ from: startOfDay(new Date()), to: endOfDay(new Date()) });
    const [activityDate, setActivityDate] = useState(new Date());
    const [selectedUsers, setSelectedUsers] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [filters, setFilters] = useState({ global: '' });
    const ITEMS_PER_PAGE = 15;

    const supabase = getSupabase();
    const { allOrdersData, setSelectedOrderDetails } = useData();

    const fetchData = useCallback(async () => {
        setLoading(true);
        const { data, error } = await supabase.from('picking_dashboard_data').select('*').order('created_at', { ascending: false });
        if (error) console.error("Chyba při načítání dat o pickování:", error);
        else setPickingData(data || []);
        setLoading(false);
    }, [supabase]);

    useEffect(() => { fetchData(); }, [fetchData]);

    const filteredDataByDate = useMemo(() => {
        if (!dateRange.from || !dateRange.to) return [];
        return pickingData.filter(op => op.confirmation_date && isWithinInterval(parseISO(op.confirmation_date), { start: startOfDay(dateRange.from), end: endOfDay(dateRange.to) }));
    }, [pickingData, dateRange]);

    const sortedFilteredData = useMemo(() => {
        let sortableItems = [...filteredDataByDate].filter(row => 
            Object.values(row).some(value => 
                String(value).toLowerCase().includes(filters.global.toLowerCase())
            )
        );
        if (sortConfig.key !== null) {
            sortableItems.sort((a, b) => {
                const valA = a[sortConfig.key];
                const valB = b[sortConfig.key];
                if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
                if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
                return 0;
            });
        }
        return sortableItems;
    }, [filteredDataByDate, filters, sortConfig]);
    
    const paginatedData = useMemo(() => {
        const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
        return sortedFilteredData.slice(startIndex, startIndex + ITEMS_PER_PAGE);
    }, [sortedFilteredData, currentPage]);
    
    const totalPages = Math.ceil(sortedFilteredData.length / ITEMS_PER_PAGE);

    const stats = useMemo(() => {
        const data = filteredDataByDate;
        if (data.length === 0) return { totalPicks: '0', morningShiftPicks: '0', afternoonShiftPicks: '0', mostActivePicker: 'N/A', mostProductiveHour: 'N/A' };
        
        let morningShiftPicks = 0, afternoonShiftPicks = 0;
        const picksByHour = {};
        const picksByUser = {};

        data.forEach(op => {
            if (op.confirmation_time) {
                const hour = parseInt(op.confirmation_time.split(':')[0], 10);
                if (hour >= 6 && hour < 14) morningShiftPicks++;
                else if (hour >= 14 && hour < 22) afternoonShiftPicks++;
                picksByHour[hour] = (picksByHour[hour] || 0) + 1;
            }
            picksByUser[op.user_name] = (picksByUser[op.user_name] || 0) + 1;
        });
        
        const mostProductiveHour = Object.keys(picksByHour).length > 0 ? Object.keys(picksByHour).reduce((a, b) => picksByHour[a] > picksByHour[b] ? a : b) : null;
        const mostActivePicker = Object.keys(picksByUser).length > 0 ? Object.keys(picksByUser).reduce((a, b) => picksByUser[a] > picksByUser[b] ? a : b) : 'N/A';

        return {
            totalPicks: data.length.toLocaleString(),
            morningShiftPicks: morningShiftPicks.toLocaleString(),
            afternoonShiftPicks: afternoonShiftPicks.toLocaleString(),
            mostProductiveHour: mostProductiveHour ? `${mostProductiveHour.padStart(2, '0')}:00` : 'N/A',
            mostActivePicker
        };
    }, [filteredDataByDate]);

    const productivityChartData = useMemo(() => {
        const data = filteredDataByDate;
        const diffDays = differenceInDays(dateRange.to, dateRange.from);
        let interval, formatString, getIntervalKey;

        if (diffDays <= 14) {
            interval = eachDayOfInterval({ start: dateRange.from, end: dateRange.to });
            formatString = 'dd.MM';
            getIntervalKey = (date) => format(date, 'yyyy-MM-dd');
        } else if (diffDays <= 90) {
            interval = eachWeekOfInterval({ start: dateRange.from, end: dateRange.to }, { weekStartsOn: 1 });
            formatString = "'T'ww";
            getIntervalKey = (date) => `${getWeek(date, { weekStartsOn: 1, locale: cs })}-${date.getFullYear()}`;
        } else {
            interval = eachMonthOfInterval({ start: dateRange.from, end: dateRange.to });
            formatString = 'MMMM yyyy';
            getIntervalKey = (date) => `${getMonth(date) + 1}-${date.getFullYear()}`;
        }

        const pickers = [...new Set(data.map(p => p.user_name).filter(Boolean))];
        const chartData = interval.map(date => {
            const key = getIntervalKey(date);
            const formattedDate = format(date, formatString, { locale: cs });
            let periodData = { name: formattedDate };
            pickers.forEach(picker => { periodData[picker] = 0; });
            data.forEach(op => {
                if(op.confirmation_date) {
                    const opDate = parseISO(op.confirmation_date);
                    if (getIntervalKey(opDate) === key) {
                        periodData[op.user_name] = (periodData[op.user_name] || 0) + 1;
                    }
                }
            });
            return periodData;
        });
        return { data: chartData, pickers };
    }, [filteredDataByDate, dateRange]);
    
    const activityByHourChartData = useMemo(() => {
        const start = startOfDay(activityDate);
        const end = endOfDay(activityDate);
        const relevantOps = pickingData.filter(op => {
            if (!op.confirmation_date) return false;
            const opDate = parseISO(op.confirmation_date);
            return isWithinInterval(opDate, { start, end }) && (selectedUsers.length === 0 || selectedUsers.includes(op.user_name));
        });
        const hours = eachHourOfInterval({ start, end });
        return hours.map(hour => {
            const hourString = format(hour, 'HH:00');
            const opsInHour = relevantOps.filter(op => op.confirmation_time && op.confirmation_time.startsWith(hourString.substring(0, 2)));
            let dataPoint = { name: hourString, "Celkem operací": opsInHour.length };
            return dataPoint;
        });
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
        if (orderDetails) setSelectedOrderDetails({ ...orderDetails, picking_details: relatedPicking });
        else setSelectedOrderDetails({ "Delivery No": deliveryNo, picking_details: relatedPicking });
    };
    
    const SortableHeader = ({ label, columnKey }) => (
        <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase cursor-pointer hover:bg-slate-700" onClick={() => requestSort(columnKey)}>
            <div className="flex items-center">{label}{sortConfig.key === columnKey ? <ArrowUpDown className="w-4 h-4 ml-2" /> : <ArrowUpDown className="w-4 h-4 ml-2 opacity-30" />}</div>
        </th>
    );

    return (
        <div className="space-y-8">
            <ImportSection onImportSuccess={fetchData} />
            <hr className="border-slate-700"/>
            <div>
                <h1 className="text-3xl font-bold text-white mb-6">KPI Přehled Pickování</h1>
                <div className="bg-slate-800 p-4 rounded-lg border border-slate-700 mb-6 flex flex-wrap items-center gap-4">
                    <label className="text-slate-300 font-medium">Zobrazit období od:</label>
                    <input type="date" value={format(dateRange.from, 'yyyy-MM-dd')} onChange={e => setDateRange(prev => ({...prev, from: e.target.valueAsDate || new Date()}))} className="p-2 bg-slate-700 border border-slate-600 rounded-md text-white"/>
                    <label className="text-slate-300 font-medium">do:</label>
                    <input type="date" value={format(dateRange.to, 'yyyy-MM-dd')} onChange={e => setDateRange(prev => ({...prev, to: e.target.valueAsDate || new Date()}))} className="p-2 bg-slate-700 border border-slate-600 rounded-md text-white"/>
                </div>
                {loading ? <div className="text-center p-8 text-slate-400">Načítám KPI data...</div> : (
                    <div className="space-y-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
                            <KpiCard title="Operací v období" value={stats.totalPicks} unit="ks" icon={<Package size={24} className="text-sky-400"/>} color="bg-sky-900/50" />
                            <KpiCard title="Ranní směna (6-14h)" value={stats.morningShiftPicks} unit="ks" icon={<Sunrise size={24} className="text-amber-400"/>} color="bg-amber-900/50"/>
                            <KpiCard title="Odpolední směna (14-22h)" value={stats.afternoonShiftPicks} unit="ks" icon={<Sunset size={24} className="text-indigo-400"/>} color="bg-indigo-900/50"/>
                            <KpiCard title="Nejproduktivnější hodina" value={stats.mostProductiveHour} unit="" icon={<Clock size={24} className="text-green-400"/>} color="bg-green-900/50"/>
                            <KpiCard title="Nejaktivnější picker" value={stats.mostActivePicker} unit="" icon={<UserCheck size={24} className="text-pink-400"/>} color="bg-pink-900/50"/>
                        </div>
                        
                        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
                            <div className="lg:col-span-3 bg-slate-800 p-6 rounded-lg border border-slate-700">
                                <h2 className="text-xl font-semibold mb-4 text-white">Produktivita pickerů (dle období)</h2>
                                <ResponsiveContainer width="100%" height={400}>
                                    <BarChart data={productivityChartData.data}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#475569" />
                                        <XAxis dataKey="name" tick={{fontSize: 12, fill: '#94a3b8'}}/>
                                        <YAxis tick={{fontSize: 12, fill: '#94a3b8'}}/>
                                        <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155' }} cursor={{fill: 'rgba(148, 163, 184, 0.1)'}}/>
                                        <Legend />
                                        {productivityChartData.pickers.map((picker, i) => (
                                            <Bar key={picker} dataKey={picker} name={picker} stackId="a" fill={['#38bdf8', '#4ade80', '#facc15', '#a78bfa', '#f472b6', '#2dd4bf'][i % 6]} />
                                        ))}
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                            <div className="lg:col-span-2 bg-slate-800 p-6 rounded-lg border border-slate-700">
                                <h2 className="text-xl font-semibold mb-4 text-white">HodinovÁ aktivita (konkrétní den)</h2>
                                <div className="flex flex-wrap items-center gap-4 mb-4">
                                    <input type="date" value={format(activityDate, 'yyyy-MM-dd')} onChange={e => setActivityDate(e.target.valueAsDate || new Date())} className="p-2 bg-slate-700 border border-slate-600 rounded-md text-white"/>
                                </div>
                                <ResponsiveContainer width="100%" height={400}>
                                    <AreaChart data={activityByHourChartData}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#475569" />
                                        <XAxis dataKey="name" tick={{fontSize: 12, fill: '#94a3b8'}}/>
                                        <YAxis tick={{fontSize: 12, fill: '#94a3b8'}}/>
                                        <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155' }}/>
                                        <Area type="monotone" dataKey="Celkem operací" stroke="#38bdf8" fill="#38bdf8" fillOpacity={0.2} />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        <div className="bg-slate-800 rounded-lg border border-slate-700 overflow-hidden">
                            <div className="p-6">
                                <h2 className="text-xl font-semibold text-white">Detailní přehled operací</h2>
                                <div className="mt-4"><input type="text" placeholder="Hledat..." value={filters.global} onChange={(e) => { setFilters({global: e.target.value}); setCurrentPage(1); }} className="p-2 bg-slate-700 border border-slate-600 rounded-md w-full md:w-1/3 text-white placeholder-slate-400" /></div>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-slate-700">
                                    <thead className="bg-slate-700/50"><tr>
                                        <SortableHeader label="Picker" columnKey="user_name" />
                                        <SortableHeader label="Zakázka" columnKey="delivery_no" />
                                        <SortableHeader label="Pozice" columnKey="source_storage_bin" />
                                        <SortableHeader label="Množství" columnKey="source_actual_qty" />
                                        <SortableHeader label="Váha (kg)" columnKey="weight" />
                                        <SortableHeader label="Datum" columnKey="confirmation_date" />
                                        <SortableHeader label="Čas" columnKey="confirmation_time" />
                                    </tr></thead>
                                    <tbody className="bg-slate-800 divide-y divide-slate-700">
                                        {paginatedData.map((row) => (
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
                            <div className="p-4 flex justify-between items-center text-sm text-slate-400">
                                <div>Strana {currentPage} z {totalPages}</div>
                                <div className="flex gap-2">
                                    <button onClick={() => setCurrentPage(p => Math.max(1, p-1))} disabled={currentPage === 1} className="p-2 bg-slate-700 rounded disabled:opacity-50 hover:bg-slate-600">Předchozí</button>
                                    <button onClick={() => setCurrentPage(p => Math.min(totalPages, p+1))} disabled={currentPage === totalPages} className="p-2 bg-slate-700 rounded disabled:opacity-50 hover:bg-slate-600">Další</button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default PickingTab;