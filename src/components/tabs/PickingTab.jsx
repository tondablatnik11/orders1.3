'use client';
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { getSupabase } from '@/lib/supabaseClient';
import { useData } from '@/hooks/useData';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area, ComposedChart, Line } from 'recharts';
import * as XLSX from 'xlsx';
import { Package, Truck, Weight, Users, UploadCloud, ChevronDown, ChevronUp, ArrowUpDown, Clock, UserCheck, Sunrise, Sunset } from 'lucide-react';
import { format, startOfDay, endOfDay, eachHourOfInterval, parseISO, isWithinInterval, differenceInDays, eachDayOfInterval, eachWeekOfInterval, eachMonthOfInterval, getWeek, getMonth, startOfWeek, endOfWeek } from 'date-fns';
import { cs } from 'date-fns/locale';

// --- Vylepšené pomocné komponenty ---
const KpiCard = ({ title, value, unit, icon, color, subValue, subUnit }) => (
    <div className="bg-slate-800 p-5 rounded-lg border border-slate-700 flex">
        <div className={`p-3 rounded-lg mr-4 self-start ${color}`}>{icon}</div>
        <div className="flex flex-col">
            <h3 className="text-sm font-medium text-slate-400">{title}</h3>
            <p className="mt-1 text-2xl font-semibold text-white">
                {value} <span className="text-base font-medium text-slate-300">{unit}</span>
            </p>
            {subValue && (
                <p className="text-sm font-medium text-slate-400 mt-1">
                    {subValue} <span className="text-xs">{subUnit}</span>
                </p>
            )}
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
            const processedData = jsonData.map(row => ({
                user_name: row['User'],
                confirmation_date: row['Confirmation date'],
                confirmation_time: row['Confirmation time'],
                weight: parseFloat(String(row['Weight'] || '0').replace(/,/g, '')),
                material: row['Material'],
                material_description: row['Material Description'],
                source_storage_bin: row['Source Storage Bin'],
                source_actual_qty: parseFloat(String(row['Source actual qty.'] || '0').replace(/,/g, '')),
                delivery_no: String(row['Dest.Storage Bin'] || '').trim(),
            }));
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
    const [sortConfig, setSortConfig] = useState({ key: 'totalPicks', direction: 'desc' });
    const [dateRange, setDateRange] = useState({ from: startOfDay(new Date()), to: endOfDay(new Date()) });
    const [activityDate, setActivityDate] = useState(new Date());
    const [activityView, setActivityView] = useState('daily');
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

    const stats = useMemo(() => {
        const data = filteredDataByDate;
        if (data.length === 0) return { totalPicks: '0', totalQty: '0', morningShiftPicks: 0, morningShiftQty: 0, afternoonShiftPicks: 0, afternoonShiftQty: 0, mostActivePicker: 'N/A' };
        
        let morningShiftPicks = 0, morningShiftQty = 0, afternoonShiftPicks = 0, afternoonShiftQty = 0;
        const picksByUser = data.reduce((acc, op) => {
            acc[op.user_name] = (acc[op.user_name] || 0) + 1;
            if (op.confirmation_time) {
                const hour = parseInt(op.confirmation_time.split(':')[0], 10);
                if (hour >= 6 && hour < 14) {
                    morningShiftPicks++;
                    morningShiftQty += op.source_actual_qty || 0;
                } else if (hour >= 14 && hour < 22) {
                    afternoonShiftPicks++;
                    afternoonShiftQty += op.source_actual_qty || 0;
                }
            }
            return acc;
        }, {});
        
        const mostActivePicker = Object.keys(picksByUser).length > 0 ? Object.keys(picksByUser).reduce((a, b) => picksByUser[a] > picksByUser[b] ? a : b) : 'N/A';
        return {
            totalPicks: data.length.toLocaleString(),
            totalQty: data.reduce((acc, row) => acc + (row.source_actual_qty || 0), 0).toLocaleString(),
            morningShiftPicks,
            morningShiftQty,
            afternoonShiftPicks,
            afternoonShiftQty,
            mostActivePicker
        };
    }, [filteredDataByDate]);

    const productivityChartData = useMemo(() => {
        const dataByPicker = filteredDataByDate.reduce((acc, row) => {
            const picker = row.user_name || 'Neznámý';
            if (!acc[picker]) acc[picker] = { name: picker, picks: 0, qty: 0 };
            acc[picker].picks += 1;
            acc[picker].qty += row.source_actual_qty || 0;
            return acc;
        }, {});
        return Object.values(dataByPicker).map(p => ({
            ...p,
            avgQtyPerPick: p.picks > 0 ? parseFloat((p.qty / p.picks).toFixed(2)) : 0
        })).sort((a,b) => b.picks - a.picks);
    }, [filteredDataByDate]);
    
    const allPickers = useMemo(() => [...new Set(pickingData.map(p => p.user_name).filter(Boolean))].sort(), [pickingData]);

    const activityChartData = useMemo(() => {
        const start = activityView === 'daily' ? startOfDay(activityDate) : startOfWeek(activityDate, { weekStartsOn: 1 });
        const end = activityView === 'daily' ? endOfDay(activityDate) : endOfWeek(activityDate, { weekStartsOn: 1 });
        const interval = activityView === 'daily' ? eachHourOfInterval({ start, end }) : eachDayOfInterval({ start, end });
        const formatString = activityView === 'daily' ? 'HH:00' : 'dd.MM';

        const relevantOps = pickingData.filter(op => op.confirmation_date && isWithinInterval(parseISO(op.confirmation_date), { start, end }));

        return interval.map(date => {
            let dataPoint = { name: format(date, formatString, { locale: cs }) };
            const opsInInterval = relevantOps.filter(op => {
                const opDate = parseISO(op.confirmation_date);
                if (activityView === 'daily') {
                    return op.confirmation_time && op.confirmation_time.startsWith(format(date, 'HH'));
                }
                return format(opDate, 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd');
            });
            
            allPickers.forEach(picker => dataPoint[picker] = 0);
            opsInInterval.forEach(op => dataPoint[op.user_name] = (dataPoint[op.user_name] || 0) + 1);
            
            return dataPoint;
        });
    }, [pickingData, activityDate, activityView, allPickers]);
    
    const activityChartSummary = useMemo(() => {
        const start = activityView === 'daily' ? startOfDay(activityDate) : startOfWeek(activityDate, { weekStartsOn: 1 });
        const end = activityView === 'daily' ? endOfDay(activityDate) : endOfWeek(activityDate, { weekStartsOn: 1 });
        const data = pickingData.filter(op => 
            op.confirmation_date && 
            isWithinInterval(parseISO(op.confirmation_date), { start, end }) &&
            (selectedUsers.length === 0 || selectedUsers.includes(op.user_name))
        );
        let morningPicks = 0, morningQty = 0, afternoonPicks = 0, afternoonQty = 0;
        data.forEach(op => {
            if (op.confirmation_time) {
                const hour = parseInt(op.confirmation_time.split(':')[0], 10);
                if (hour >= 6 && hour < 14) { morningPicks++; morningQty += op.source_actual_qty || 0; }
                else if (hour >= 14 && hour < 22) { afternoonPicks++; afternoonQty += op.source_actual_qty || 0; }
            }
        });
        return { morningPicks, morningQty, afternoonPicks, afternoonQty, totalPicks: data.length, totalQty: data.reduce((acc, op) => acc + (op.source_actual_qty || 0), 0) };
    }, [pickingData, activityDate, activityView, selectedUsers]);

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
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            <KpiCard title="Operací v období" value={stats.totalPicks} unit="picků" subValue={stats.totalQty} subUnit="kusů" icon={<Package size={24} className="text-sky-400"/>} color="bg-sky-900/50" />
                            <KpiCard title="Ranní směna (6-14h)" value={stats.morningShiftPicks.toLocaleString()} unit="picků" subValue={stats.morningShiftQty.toLocaleString()} subUnit="kusů" icon={<Sunrise size={24} className="text-amber-400"/>} color="bg-amber-900/50"/>
                            <KpiCard title="Odpolední směna (14-22h)" value={stats.afternoonShiftPicks.toLocaleString()} unit="picků" subValue={stats.afternoonShiftQty.toLocaleString()} subUnit="kusů" icon={<Sunset size={24} className="text-indigo-400"/>} color="bg-indigo-900/50"/>
                            <KpiCard title="Nejaktivnější picker" value={stats.mostActivePicker} unit="" icon={<UserCheck size={24} className="text-pink-400"/>} color="bg-pink-900/50"/>
                        </div>
                        
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            <div className="bg-slate-800 p-6 rounded-lg border border-slate-700">
                                <h2 className="text-xl font-semibold mb-4 text-white">Produktivita pickerů (dle období)</h2>
                                <ResponsiveContainer width="100%" height={400}>
                                    <ComposedChart data={productivityChartData} margin={{ top: 5, right: 20, left: -10, bottom: 80 }}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#475569" />
                                        <XAxis dataKey="name" angle={-45} textAnchor="end" interval={0} tick={{fontSize: 12, fill: '#94a3b8'}} />
                                        <YAxis yAxisId="left" stroke="#38bdf8" tick={{fontSize: 12, fill: '#94a3b8'}}/>
                                        <YAxis yAxisId="right" orientation="right" stroke="#a78bfa" tick={{fontSize: 12, fill: '#94a3b8'}}/>
                                        <Tooltip contentStyle={{ backgroundColor: '#1e2d3b', border: '1px solid #334155' }}/>
                                        <Legend />
                                        <Bar yAxisId="left" dataKey="picks" fill="#38bdf8" name="Počet operací" />
                                        <Line yAxisId="right" type="monotone" dataKey="avgQtyPerPick" stroke="#a78bfa" name="Prům. ks/operaci" strokeWidth={2}/>
                                    </ComposedChart>
                                </ResponsiveContainer>
                            </div>
                            <div className="bg-slate-800 p-6 rounded-lg border border-slate-700">
                                <h2 className="text-xl font-semibold mb-4 text-white">Aktivita v čase</h2>
                                <div className="flex flex-wrap items-center gap-4 mb-4">
                                    <select value={activityView} onChange={e => setActivityView(e.target.value)} className="p-2 bg-slate-700 border border-slate-600 rounded-md text-white">
                                        <option value="daily">Denní přehled</option>
                                        <option value="weekly">Týdenní přehled</option>
                                    </select>
                                    <input type="date" value={format(activityDate, 'yyyy-MM-dd')} onChange={e => setActivityDate(e.target.valueAsDate || new Date())} className="p-2 bg-slate-700 border border-slate-600 rounded-md text-white"/>
                                    <select multiple value={selectedUsers} onChange={e => setSelectedUsers(Array.from(e.target.selectedOptions, option => option.value))} className="p-2 bg-slate-700 border border-slate-600 rounded-md text-white h-24 w-48">
                                        {allPickers.map(p => <option key={p} value={p}>{p}</option>)}
                                    </select>
                                    <button onClick={() => setSelectedUsers([])} className="p-2 bg-slate-600 rounded-md text-white self-start">Všichni</button>
                                </div>
                                <div className="text-xs text-slate-400 mb-2 p-2 bg-slate-700/50 rounded">
                                    Souhrn pro {selectedUsers.length > 0 ? selectedUsers.join(', ') : 'všechny'}: 
                                    <b> Celkem:</b> {activityChartSummary.totalPicks} picků / {activityChartSummary.totalQty} ks.
                                    <b> Ranní:</b> {activityChartSummary.morningPicks} picků / {activityChartSummary.morningQty} ks.
                                    <b> Odpolední:</b> {activityChartSummary.afternoonPicks} picků / {activityChartSummary.afternoonQty} ks.
                                </div>
                                <ResponsiveContainer width="100%" height={350}>
                                    <LineChart data={activityChartData}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#475569" />
                                        <XAxis dataKey="name" tick={{fontSize: 12, fill: '#94a3b8'}}/>
                                        <YAxis tick={{fontSize: 12, fill: '#94a3b8'}}/>
                                        <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155' }}/>
                                        <Legend />
                                        { (selectedUsers.length > 0 ? selectedUsers : allPickers).slice(0, 5).map((user, i) => <Line key={user} type="monotone" dataKey={user} name={user} stroke={['#38bdf8', '#4ade80', '#facc15', '#a78bfa', '#f472b6'][i % 5]} strokeWidth={2} />)}
                                    </LineChart>
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