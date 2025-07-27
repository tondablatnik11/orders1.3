'use client';
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { getSupabase } from '@/lib/supabaseClient';
import { useData } from '@/hooks/useData';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, AreaChart, Area } from 'recharts';
import * as XLSX from 'xlsx';
import { UploadCloud, ChevronDown, ChevronUp, ArrowUpDown, UserCheck, Users, X, BarChart2, Warehouse, Component, BarChartHorizontal, GitCompare, Percent, Calendar } from 'lucide-react';
import { format, startOfDay, endOfDay, parseISO, isWithinInterval, startOfWeek, endOfWeek, eachDayOfInterval, getWeek, eachWeekOfInterval, startOfMonth, endOfMonth, eachMonthOfInterval, eachHourOfInterval } from 'date-fns';
import { cs } from 'date-fns/locale';

// --- POMOCNÉ KOMPONENTY ---

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
    
    const excelSerialToDate = (serial) => {
        if (typeof serial !== 'number' || isNaN(serial)) return null;
        const utc_days = Math.floor(serial - 25569);
        const utc_value = utc_days * 86400;
        return new Date(utc_value * 1000);
    };

    const excelSerialToTime = (serial) => {
        if (typeof serial !== 'number' || isNaN(serial)) return serial;
        const total_seconds = Math.round(serial * 86400);
        const hours = String(Math.floor(total_seconds / 3600)).padStart(2, '0');
        const minutes = String(Math.floor((total_seconds % 3600) / 60)).padStart(2, '0');
        const seconds = String(total_seconds % 60).padStart(2, '0');
        return `${hours}:${minutes}:${seconds}`;
    };

    const handleFileUpload = useCallback(async (file) => {
        if (!file) return;
        setStatus({ type: 'loading', message: 'Načítám a zpracovávám soubor...' });
        
        try {
            const data = await file.arrayBuffer();
            const workbook = XLSX.read(data, { type: "buffer" });
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            const dataAsArray = XLSX.utils.sheet_to_json(worksheet, { header: 1, raw: true, defval: '' });

            if (dataAsArray.length < 2) throw new Error('Soubor neobsahuje žádná data nebo záhlaví.');

            const headers = dataAsArray[0];
            const dataRows = dataAsArray.slice(1);

            const userIndex = headers.indexOf('User');
            const dateIndex = headers.indexOf('Confirmation date');
            const timeIndex = headers.lastIndexOf('Confirmation time');
            const weightIndex = headers.indexOf('Weight');
            const materialIndex = headers.indexOf('Material');
            const materialDescIndex = headers.indexOf('Material Description');
            const sourceBinIndex = headers.indexOf('Source Storage Bin');
            const sourceQtyIndex = headers.indexOf('Source actual qty.');
            const deliveryNoIndex = headers.indexOf('Dest.Storage Bin');

            if (userIndex === -1 || deliveryNoIndex === -1 || dateIndex === -1 || timeIndex === -1) {
                throw new Error('V souboru chybí klíčové sloupce: User, Dest.Storage Bin, Confirmation date nebo Confirmation time.');
            }

            const processedData = dataRows.reduce((acc, row) => {
                const userName = row[userIndex];
                const deliveryNo = row[deliveryNoIndex];

                if (userName && deliveryNo) {
                    const dateValue = row[dateIndex];
                    let finalDate = null;
                    if (typeof dateValue === 'string' && dateValue.includes('/')) {
                        const parts = dateValue.split('/');
                        if (parts.length === 3) finalDate = new Date(Date.UTC(parts[2], parts[0] - 1, parts[1]));
                    } else if (typeof dateValue === 'number') {
                        finalDate = excelSerialToDate(dateValue);
                    }
                    const formattedDate = finalDate ? finalDate.toISOString().split('T')[0] : null;

                    const timeValue = row[timeIndex];
                    const formattedTime = excelSerialToTime(timeValue);

                    if (!formattedDate || !formattedTime) {
                        console.warn(`Přeskakuji řádek s neplatným datem/časem:`, row);
                        return acc;
                    }
                    
                    acc.push({
                        user_name: String(userName).trim(),
                        confirmation_date: formattedDate,
                        confirmation_time: formattedTime,
                        weight: parseFloat(String(row[weightIndex] || '0').replace(/,/g, '.')),
                        material: row[materialIndex],
                        material_description: row[materialDescIndex],
                        source_storage_bin: row[sourceBinIndex],
                        source_actual_qty: parseFloat(String(row[sourceQtyIndex] || '0').replace(/,/g, '.')),
                        delivery_no: String(deliveryNo).trim(),
                    });
                }
                return acc;
            }, []);

            if (processedData.length === 0) throw new Error('V souboru nebyly nalezeny žádné platné řádky k importu.');

            const { error } = await supabase.from('picking_operations').upsert(processedData, {
                onConflict: 'confirmation_date, confirmation_time, user_name, delivery_no, source_storage_bin, material',
                ignoreDuplicates: true
            });
            
            if (error) throw error;
            setStatus({ type: 'success', message: `Hotovo! Naimportováno ${processedData.length} platných záznamů.` });
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

const PickerDetailModal = ({ pickerName, data, onClose }) => {
    if (!pickerName) return null;

    const pickerStats = useMemo(() => {
        const pickerData = data.filter(p => p.user_name === pickerName);
        const totalPicks = pickerData.length;
        const totalQty = pickerData.reduce((sum, p) => sum + (p.source_actual_qty || 0), 0);
        const totalWeight = pickerData.reduce((sum, p) => sum + (p.weight || 0), 0);

        const activityByDay = pickerData.reduce((acc, p) => {
            const day = p.confirmation_date;
            if (!acc[day]) acc[day] = 0;
            acc[day]++;
            return acc;
        }, {});

        const activityChartData = Object.entries(activityByDay)
            .map(([date, picks]) => ({ date, picks }))
            .sort((a, b) => new Date(a.date) - new Date(b.date));

        const topMaterials = pickerData.reduce((acc, p) => {
            const material = p.material_description || 'Neznámý';
            if (!acc[material]) acc[material] = { name: material, picks: 0, qty: 0 };
            acc[material].picks++;
            acc[material].qty += p.source_actual_qty || 0;
            return acc;
        }, {});

        const topBins = pickerData.reduce((acc, p) => {
            const bin = p.source_storage_bin || 'Neznámá';
            if (!acc[bin]) acc[bin] = { name: bin, picks: 0 };
            acc[bin].picks++;
            return acc;
        }, {});
        
        return {
            totalPicks, totalQty, totalWeight,
            activityChartData,
            topMaterials: Object.values(topMaterials).sort((a,b) => b.picks - a.picks).slice(0, 5),
            topBins: Object.values(topBins).sort((a,b) => b.picks - a.picks).slice(0, 5)
        };
    }, [pickerName, data]);

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex justify-center items-center" onClick={onClose}>
            <div className="bg-slate-800 border border-slate-700 rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                <div className="p-6 border-b border-slate-700 sticky top-0 bg-slate-800/80 backdrop-blur-sm z-10">
                    <div className="flex justify-between items-center">
                        <h2 className="text-2xl font-bold text-white">Detail pickera: <span className="text-sky-400">{pickerName}</span></h2>
                        <button onClick={onClose} className="text-slate-400 hover:text-white"><X size={28} /></button>
                    </div>
                </div>
                <div className="p-6 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                        <div className="bg-slate-700/50 p-4 rounded-lg"><div className="text-3xl font-bold text-white">{pickerStats.totalPicks.toLocaleString()}</div><div className="text-sm text-slate-400">Celkem operací</div></div>
                        <div className="bg-slate-700/50 p-4 rounded-lg"><div className="text-3xl font-bold text-white">{pickerStats.totalQty.toLocaleString()}</div><div className="text-sm text-slate-400">Celkem kusů</div></div>
                        <div className="bg-slate-700/50 p-4 rounded-lg"><div className="text-3xl font-bold text-white">{pickerStats.totalWeight.toLocaleString('cs-CZ')}</div><div className="text-sm text-slate-400">Celková váha (kg)</div></div>
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold text-white mb-3">Produktivita v čase (operace/den)</h3>
                        <ResponsiveContainer width="100%" height={250}>
                            <BarChart data={pickerStats.activityChartData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#475569" />
                                <XAxis dataKey="date" tickFormatter={(date) => format(parseISO(date), 'dd.MM')} />
                                <YAxis />
                                <Tooltip contentStyle={{ backgroundColor: '#1e2d3b', border: '1px solid #334155' }}/>
                                <Bar dataKey="picks" fill="#38bdf8" name="Počet operací" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <h3 className="text-lg font-semibold text-white mb-3">Top 5 materiálů</h3>
                            <ul className="space-y-2">{pickerStats.topMaterials.map(m => <li key={m.name} className="bg-slate-700/50 p-3 rounded-md flex justify-between items-center text-sm"><span className="font-medium text-slate-300 truncate pr-4">{m.name}</span> <span className="text-sky-400 font-semibold">{m.picks} picků / {m.qty} ks</span></li>)}</ul>
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-white mb-3">Top 5 pozic</h3>
                             <ul className="space-y-2">{pickerStats.topBins.map(b => <li key={b.name} className="bg-slate-700/50 p-3 rounded-md flex justify-between items-center text-sm"><span className="font-medium text-slate-300">{b.name}</span> <span className="text-teal-400 font-semibold">{b.picks} picků</span></li>)}</ul>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const CustomActivityTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
        const activePickers = payload.filter(p => p.value > 0);
        if (activePickers.length === 0) return null;

        return (
            <div className="p-4 bg-slate-900/80 backdrop-blur-sm border border-slate-700 rounded-lg text-sm">
                <p className="font-bold text-slate-300 mb-2">{label}</p>
                <ul className="space-y-1">
                    {activePickers.map(entry => (
                        <li key={entry.dataKey} style={{ color: entry.color }}>
                            <span className="font-semibold">{entry.dataKey}:</span> {entry.value} operací
                        </li>
                    ))}
                </ul>
            </div>
        );
    }
    return null;
};


// --- Hlavní komponenta ---
const PickingTab = () => {
    // Stavy
    const [pickingData, setPickingData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [dateRange, setDateRange] = useState({ from: startOfDay(new Date()), to: endOfDay(new Date()) });
    const [activityChartDate, setActivityChartDate] = useState(new Date());
    const [sortConfig, setSortConfig] = useState({ key: 'user_name', direction: 'asc' });
    const [currentPage, setCurrentPage] = useState(1);
    const [tableFilter, setTableFilter] = useState('');
    const [shiftChartInterval, setShiftChartInterval] = useState('day');
    const [shiftChartDisplay, setShiftChartDisplay] = useState('grouped');
    const [activityChartInterval, setActivityChartInterval] = useState('hour');
    const [warehouseChartType, setWarehouseChartType] = useState('bins');
    const [selectedPicker, setSelectedPicker] = useState(null);

    const ITEMS_PER_PAGE = 15;
    const supabase = getSupabase();
    const { allOrdersData, setSelectedOrderDetails } = useData();

    const fetchData = useCallback(async () => {
        setLoading(true);
        const { data, error } = await supabase.from('picking_dashboard_data').select('*').order('created_at', { ascending: false });
        if (error) {
            console.error("Chyba při načítání dat o pickování:", error);
            setPickingData([]);
        } else {
            const uniquePicks = new Map();
            (data || []).forEach(pick => {
                const key = `${pick.confirmation_date}|${pick.confirmation_time}|${pick.user_name}|${pick.delivery_no}|${pick.source_storage_bin}|${pick.material}`;
                if (!uniquePicks.has(key)) uniquePicks.set(key, pick);
            });
            const finalData = Array.from(uniquePicks.values()).filter(p => p.user_name && p.user_name.startsWith('UIH'));
            setPickingData(finalData);
        }
        setLoading(false);
    }, [supabase]);

    useEffect(() => { fetchData(); }, [fetchData]);

    const filteredDataByDate = useMemo(() => {
        if (!dateRange.from || !dateRange.to) return [];
        return pickingData.filter(op => op.confirmation_date && isWithinInterval(parseISO(op.confirmation_date), { start: startOfDay(dateRange.from), end: endOfDay(dateRange.to) }));
    }, [pickingData, dateRange]);

    
    // --- VÝPOČTY PRO STATISTIKY A GRAFY ---
    
    const stats = useMemo(() => {
        const data = filteredDataByDate;
        if (data.length === 0) return { totalPicks: '0', totalQty: '0', shiftAPicks: 0, shiftAQty: 0, shiftBPicks: 0, shiftBQty: 0, mostActivePicker: 'N/A' };
        
        let shiftAPicks = 0, shiftAQty = 0, shiftBPicks = 0, shiftBQty = 0;
        const picksByUser = data.reduce((acc, op) => {
            acc[op.user_name] = (acc[op.user_name] || 0) + 1;
            if (op.confirmation_time && op.confirmation_date) {
                const hour = parseInt(op.confirmation_time.split(':')[0], 10);
                const weekNumber = getWeek(parseISO(op.confirmation_date), { weekStartsOn: 1 });
                const isEvenWeek = weekNumber % 2 === 0;
                
                if (hour >= 6 && hour < 14) {
                    if (isEvenWeek) { shiftAPicks++; shiftAQty += op.source_actual_qty || 0; }
                    else { shiftBPicks++; shiftBQty += op.source_actual_qty || 0; }
                } else if (hour >= 14 && hour < 22) {
                    if (isEvenWeek) { shiftBPicks++; shiftBQty += op.source_actual_qty || 0; }
                    else { shiftAPicks++; shiftAQty += op.source_actual_qty || 0; }
                }
            }
            return acc;
        }, {});
        
        const mostActivePicker = Object.keys(picksByUser).length > 0 ? Object.keys(picksByUser).reduce((a, b) => picksByUser[a] > picksByUser[b] ? a : b) : 'N/A';
        return {
            totalPicks: data.length.toLocaleString(),
            totalQty: data.reduce((acc, row) => acc + (row.source_actual_qty || 0), 0).toLocaleString(),
            shiftAPicks, shiftAQty, shiftBPicks, shiftBQty,
            mostActivePicker
        };
    }, [filteredDataByDate]);

    const shiftChartData = useMemo(() => {
        const data = filteredDataByDate;
        let interval, formatStr;
        switch(shiftChartInterval) {
            case 'week':
                interval = eachWeekOfInterval({ start: dateRange.from, end: dateRange.to }, { weekStartsOn: 1 });
                formatStr = (date) => `T${getWeek(date, { weekStartsOn: 1 })}`; break;
            case 'month':
                interval = eachMonthOfInterval({ start: dateRange.from, end: dateRange.to });
                formatStr = (date) => format(date, 'LLLL yyyy', { locale: cs }); break;
            default:
                interval = eachDayOfInterval({ start: dateRange.from, end: dateRange.to });
                formatStr = (date) => format(date, 'dd.MM');
        }

        return interval.map(date => {
            const point = { name: formatStr(date), 'Směna A': 0, 'Směna B': 0 };
            const opsInInterval = data.filter(op => {
                 const opDate = parseISO(op.confirmation_date);
                 switch(shiftChartInterval) {
                    case 'week': return getWeek(opDate, { weekStartsOn: 1 }) === getWeek(date, { weekStartsOn: 1 });
                    case 'month': return opDate.getMonth() === date.getMonth() && opDate.getFullYear() === date.getFullYear();
                    default: return format(opDate, 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd');
                 }
            });

            opsInInterval.forEach(op => {
                const hour = parseInt(op.confirmation_time.split(':')[0], 10);
                const weekNumber = getWeek(parseISO(op.confirmation_date), { weekStartsOn: 1 });
                const isEvenWeek = weekNumber % 2 === 0;
                if (hour >= 6 && hour < 14) { if (isEvenWeek) point['Směna A']++; else point['Směna B']++; }
                else if (hour >= 14 && hour < 22) { if (isEvenWeek) point['Směna B']++; else point['Směna A']++; }
            });
            return point;
        });
    }, [filteredDataByDate, dateRange, shiftChartInterval]);

    const activityChartData = useMemo(() => {
        let data, interval, formatStr, isSameInterval;
        
        if (activityChartInterval === 'hour') {
            data = pickingData.filter(op => op.confirmation_date && format(parseISO(op.confirmation_date), 'yyyy-MM-dd') === format(activityChartDate, 'yyyy-MM-dd'));
            interval = eachHourOfInterval({ start: startOfDay(activityChartDate), end: endOfDay(activityChartDate) });
            formatStr = date => format(date, 'HH:00');
            isSameInterval = (opDate, intDate) => opDate.getHours() === intDate.getHours();
        } else {
            data = filteredDataByDate;
            if (activityChartInterval === 'day') {
                interval = eachDayOfInterval({ start: dateRange.from, end: dateRange.to });
                formatStr = date => format(date, 'dd.MM');
                isSameInterval = (opDate, intDate) => format(opDate, 'yyyy-MM-dd') === format(intDate, 'yyyy-MM-dd');
            } else { // week
                interval = eachWeekOfInterval({ start: dateRange.from, end: dateRange.to }, { weekStartsOn: 1 });
                formatStr = date => `T${getWeek(date, { weekStartsOn: 1 })}`;
                isSameInterval = (opDate, intDate) => getWeek(opDate, { weekStartsOn: 1 }) === getWeek(intDate, { weekStartsOn: 1 });
            }
        }
        
        const allPickers = [...new Set(data.map(p => p.user_name).filter(Boolean))];
        
        return interval.map(intDate => {
            const point = { name: formatStr(intDate) };
            allPickers.forEach(p => point[p] = 0);
            const opsInInterval = data.filter(op => isSameInterval(parseISO(`${op.confirmation_date}T${op.confirmation_time}`), intDate));
            opsInInterval.forEach(op => { if(point[op.user_name] !== undefined) point[op.user_name]++; });
            return point;
        });
    }, [pickingData, filteredDataByDate, dateRange, activityChartInterval, activityChartDate]);
    
    const topPickersData = useMemo(() => {
        const pickerCounts = filteredDataByDate.reduce((acc, op) => {
            acc[op.user_name] = (acc[op.user_name] || 0) + 1;
            return acc;
        }, {});
        return Object.entries(pickerCounts)
            .map(([name, picks]) => ({ name, picks }))
            .sort((a,b) => b.picks - a.picks)
            .slice(0, 10);
    }, [filteredDataByDate]);
    
    const warehouseChartData = useMemo(() => {
        const data = filteredDataByDate;
        const key = warehouseChartType === 'bins' ? 'source_storage_bin' : 'material_description';
        const counts = data.reduce((acc, op) => {
            const name = op[key] || 'Neznámý';
            acc[name] = (acc[name] || 0) + 1;
            return acc;
        }, {});
        return Object.entries(counts)
            .map(([name, picks]) => ({ name, picks }))
            .sort((a,b) => b.picks - a.picks)
            .slice(0, 10);
    }, [filteredDataByDate, warehouseChartType]);

    const sortedFilteredData = useMemo(() => {
        let sortableItems = [...filteredDataByDate].filter(row => 
            Object.values(row).some(value => String(value).toLowerCase().includes(tableFilter.toLowerCase()))
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
    }, [filteredDataByDate, tableFilter, sortConfig]);

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

    const handleDeliveryClick = useCallback((deliveryNo) => {
        const orderDetails = allOrdersData.find(order => order['Delivery No'] === deliveryNo);
        const relatedPicking = pickingData.filter(p => p.delivery_no === deliveryNo);
        
        if (orderDetails) {
            setSelectedOrderDetails({ 
                ...orderDetails, 
                picking_details: relatedPicking 
            });
        } else {
            // Fallback, pokud zakázka není v hlavních datech
            setSelectedOrderDetails({ 
                "Delivery No": deliveryNo, 
                picking_details: relatedPicking 
            });
        }
    }, [allOrdersData, pickingData, setSelectedOrderDetails]);
    
    const SortableHeader = ({ label, columnKey }) => (
        <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase cursor-pointer hover:bg-slate-700/50 transition-all" onClick={() => requestSort(columnKey)}>
            <div className="flex items-center group">{label} <ArrowUpDown className={`w-4 h-4 ml-2 transition-opacity ${sortConfig.key === columnKey ? 'opacity-100' : 'opacity-30 group-hover:opacity-70'}`} /></div>
        </th>
    );
    
    // --- RENDER ---
    
    return (
        <div className="space-y-8">
            {selectedPicker && <PickerDetailModal pickerName={selectedPicker} data={pickingData} onClose={() => setSelectedPicker(null)} />}

            <ImportSection onImportSuccess={fetchData} />
            
            <hr className="border-slate-700"/>
            
            <div>
                <h1 className="text-3xl font-bold text-white mb-6">Přehled a Analýza Pickování</h1>
                
                <div className="bg-slate-800 p-4 rounded-lg border border-slate-700 mb-8 flex flex-wrap items-center gap-4">
                    <label className="text-slate-300 font-medium">Období:</label>
                    <input type="date" value={format(dateRange.from, 'yyyy-MM-dd')} onChange={e => setDateRange(prev => ({...prev, from: e.target.valueAsDate || new Date()}))} className="p-2 bg-slate-700 border border-slate-600 rounded-md text-white"/>
                    <label className="text-slate-300 font-medium">do:</label>
                    <input type="date" value={format(dateRange.to, 'yyyy-MM-dd')} onChange={e => setDateRange(prev => ({...prev, to: e.target.valueAsDate || new Date()}))} className="p-2 bg-slate-700 border border-slate-600 rounded-md text-white"/>
                </div>

                {loading ? <div className="text-center p-8 text-slate-400">Načítám data...</div> : (
                    <div className="space-y-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            <KpiCard title="Operací v období" value={stats.totalPicks} unit="picků" subValue={stats.totalQty} subUnit="kusů" icon={<BarChart2 size={24} className="text-sky-300"/>} color="bg-sky-900/50" />
                            <KpiCard title="Směna A" value={stats.shiftAPicks.toLocaleString()} unit="picků" subValue={stats.shiftAQty.toLocaleString()} subUnit="kusů" icon={<Users size={24} className="text-amber-300"/>} color="bg-amber-900/50"/>
                            <KpiCard title="Směna B" value={stats.shiftBPicks.toLocaleString()} unit="picků" subValue={stats.shiftBQty.toLocaleString()} subUnit="kusů" icon={<Users size={24} className="text-indigo-300"/>} color="bg-indigo-900/50"/>
                            <KpiCard title="Nejaktivnější picker" value={stats.mostActivePicker} unit="" icon={<UserCheck size={24} className="text-pink-300"/>} color="bg-pink-900/50"/>
                        </div>

                        <hr className="border-slate-700/50"/>

                        <div className="space-y-8">
                            <div className="bg-slate-800 p-6 rounded-lg border border-slate-700">
                                <div className="flex flex-wrap justify-between items-center gap-4 mb-4">
                                    <h2 className="text-xl font-semibold text-white">Srovnání směn</h2>
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <div className="text-sm text-slate-400 mr-2">Zobrazení:</div>
                                        <button onClick={() => setShiftChartDisplay('grouped')} className={`px-3 py-1 text-sm rounded-md flex items-center gap-2 ${shiftChartDisplay === 'grouped' ? 'bg-sky-600 text-white' : 'bg-slate-700 hover:bg-slate-600 text-slate-300'}`}><BarChartHorizontal size={16}/> Seskupený</button>
                                        <button onClick={() => setShiftChartDisplay('stacked')} className={`px-3 py-1 text-sm rounded-md flex items-center gap-2 ${shiftChartDisplay === 'stacked' ? 'bg-sky-600 text-white' : 'bg-slate-700 hover:bg-slate-600 text-slate-300'}`}><BarChart2 size={16}/> Skládaný</button>
                                        <button onClick={() => setShiftChartDisplay('line')} className={`px-3 py-1 text-sm rounded-md flex items-center gap-2 ${shiftChartDisplay === 'line' ? 'bg-sky-600 text-white' : 'bg-slate-700 hover:bg-slate-600 text-slate-300'}`}><GitCompare size={16}/> Spojnicový</button>
                                        <button onClick={() => setShiftChartDisplay('percent')} className={`px-3 py-1 text-sm rounded-md flex items-center gap-2 ${shiftChartDisplay === 'percent' ? 'bg-sky-600 text-white' : 'bg-slate-700 hover:bg-slate-600 text-slate-300'}`}><Percent size={16}/> Procenta</button>
                                        <div className="w-px h-6 bg-slate-600 mx-2"></div>
                                        <button onClick={() => setShiftChartInterval('day')} className={`px-3 py-1 text-sm rounded-md ${shiftChartInterval === 'day' ? 'bg-sky-600 text-white' : 'bg-slate-700 hover:bg-slate-600 text-slate-300'}`}>Dny</button>
                                        <button onClick={() => setShiftChartInterval('week')} className={`px-3 py-1 text-sm rounded-md ${shiftChartInterval === 'week' ? 'bg-sky-600 text-white' : 'bg-slate-700 hover:bg-slate-600 text-slate-300'}`}>Týdny</button>
                                        <button onClick={() => setShiftChartInterval('month')} className={`px-3 py-1 text-sm rounded-md ${shiftChartInterval === 'month' ? 'bg-sky-600 text-white' : 'bg-slate-700 hover:bg-slate-600 text-slate-300'}`}>Měsíce</button>
                                    </div>
                                </div>
                                <ResponsiveContainer width="100%" height={300}>
                                    {shiftChartDisplay === 'percent' ? (
                                        <AreaChart data={shiftChartData} stackOffset="expand"><CartesianGrid strokeDasharray="3 3" stroke="#475569" /><XAxis dataKey="name" tick={{fontSize: 12, fill: '#94a3b8'}}/><YAxis tickFormatter={(tick) => `${(tick * 100).toFixed(0)}%`} tick={{fontSize: 12, fill: '#94a3b8'}}/><Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155' }} formatter={(value, name, props) => `${(props.payload[name] / (props.payload['Směna A'] + props.payload['Směna B']) * 100).toFixed(1)}%`} /><Legend /><Area type="monotone" dataKey="Směna A" stackId="1" stroke="#f59e0b" fill="#f59e0b" /><Area type="monotone" dataKey="Směna B" stackId="1" stroke="#6366f1" fill="#6366f1" /></AreaChart>
                                    ) : shiftChartDisplay === 'line' ? (
                                         <LineChart data={shiftChartData}><CartesianGrid strokeDasharray="3 3" stroke="#475569" /><XAxis dataKey="name" tick={{fontSize: 12, fill: '#94a3b8'}}/><YAxis tick={{fontSize: 12, fill: '#94a3b8'}} allowDecimals={false}/><Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155' }}/><Legend /><Line type="monotone" dataKey="Směna A" stroke="#f59e0b" strokeWidth={2} /><Line type="monotone" dataKey="Směna B" stroke="#6366f1" strokeWidth={2} /></LineChart>
                                    ) : (
                                        <BarChart data={shiftChartData}><CartesianGrid strokeDasharray="3 3" stroke="#475569" /><XAxis dataKey="name" tick={{fontSize: 12, fill: '#94a3b8'}}/><YAxis tick={{fontSize: 12, fill: '#94a3b8'}} allowDecimals={false}/><Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155' }}/><Legend /><Bar dataKey="Směna A" fill="#f59e0b" stackId={shiftChartDisplay === 'stacked' ? 'a' : undefined} /><Bar dataKey="Směna B" fill="#6366f1" stackId={shiftChartDisplay === 'stacked' ? 'a' : undefined} /></BarChart>
                                    )}
                                </ResponsiveContainer>
                            </div>
                            
                            <div className="bg-slate-800 p-6 rounded-lg border border-slate-700">
                                <div className="flex flex-wrap justify-between items-center gap-4 mb-4">
                                    <h2 className="text-xl font-semibold text-white">Aktivita pickerů v čase</h2>
                                    <div className="flex items-center gap-2 flex-wrap">
                                        {activityChartInterval === 'hour' && (
                                            <div className="flex items-center gap-2 pr-2 border-r border-slate-600">
                                                 <Calendar size={16} className="text-slate-400" />
                                                 <input type="date" value={format(activityChartDate, 'yyyy-MM-dd')} onChange={e => setActivityChartDate(e.target.valueAsDate || new Date())} className="p-1 bg-slate-700 border border-slate-600 rounded-md text-white text-sm"/>
                                            </div>
                                        )}
                                        <button onClick={() => setActivityChartInterval('hour')} className={`px-3 py-1 text-sm rounded-md ${activityChartInterval === 'hour' ? 'bg-sky-600 text-white' : 'bg-slate-700 hover:bg-slate-600 text-slate-300'}`}>Hodiny</button>
                                        <button onClick={() => setActivityChartInterval('day')} className={`px-3 py-1 text-sm rounded-md ${activityChartInterval === 'day' ? 'bg-sky-600 text-white' : 'bg-slate-700 hover:bg-slate-600 text-slate-300'}`}>Dny</button>
                                        <button onClick={() => setActivityChartInterval('week')} className={`px-3 py-1 text-sm rounded-md ${activityChartInterval === 'week' ? 'bg-sky-600 text-white' : 'bg-slate-700 hover:bg-slate-600 text-slate-300'}`}>Týdny</button>
                                    </div>
                                </div>
                                <ResponsiveContainer width="100%" height={300}>
                                    <LineChart data={activityChartData}><CartesianGrid strokeDasharray="3 3" stroke="#475569" /><XAxis dataKey="name" tick={{fontSize: 12, fill: '#94a3b8'}}/><YAxis tick={{fontSize: 12, fill: '#94a3b8'}} allowDecimals={false}/><Tooltip content={<CustomActivityTooltip />} /><Legend />
                                     {[...new Set(filteredDataByDate.map(p => p.user_name))].map((user, i) => (
                                        <Line key={user} type="monotone" dataKey={user} name={user} stroke={['#38bdf8', '#4ade80', '#facc15', '#a78bfa', '#f472b6', '#2dd4bf', '#fb923c'][i % 7]} strokeWidth={2} connectNulls />
                                     ))}
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                <div className="bg-slate-800 p-6 rounded-lg border border-slate-700">
                                    <h2 className="text-xl font-semibold mb-4 text-white">TOP 10 Pickerů</h2>
                                    <ResponsiveContainer width="100%" height={350}>
                                        <BarChart data={topPickersData} layout="vertical" margin={{ left: 30 }}><CartesianGrid strokeDasharray="3 3" stroke="#475569" /><XAxis type="number" tick={{fontSize: 12, fill: '#94a3b8'}} /><YAxis type="category" dataKey="name" width={80} tick={{fontSize: 12, fill: '#94a3b8'}}/><Tooltip contentStyle={{ backgroundColor: '#1e2d3b', border: '1px solid #334155' }}/><Bar dataKey="picks" name="Počet operací" fill="#22c55e" /></BarChart>
                                    </ResponsiveContainer>
                                </div>
                                <div className="bg-slate-800 p-6 rounded-lg border border-slate-700">
                                    <div className="flex justify-between items-center mb-4">
                                        <h2 className="text-xl font-semibold text-white">Analýza skladu</h2>
                                        <div className="flex items-center gap-2">
                                            <button onClick={() => setWarehouseChartType('bins')} className={`px-3 py-1 text-sm rounded-md flex items-center gap-2 ${warehouseChartType === 'bins' ? 'bg-sky-600 text-white' : 'bg-slate-700 hover:bg-slate-600 text-slate-300'}`}><Warehouse size={16}/> Pozice</button>
                                            <button onClick={() => setWarehouseChartType('materials')} className={`px-3 py-1 text-sm rounded-md flex items-center gap-2 ${warehouseChartType === 'materials' ? 'bg-sky-600 text-white' : 'bg-slate-700 hover:bg-slate-600 text-slate-300'}`}><Component size={16}/> Materiály</button>
                                        </div>
                                    </div>
                                    <ResponsiveContainer width="100%" height={350}>
                                        <BarChart data={warehouseChartData} layout="vertical" margin={{ left: 30 }}><CartesianGrid strokeDasharray="3 3" stroke="#475569" /><XAxis type="number" tick={{fontSize: 12, fill: '#94a3b8'}} /><YAxis type="category" dataKey="name" width={120} tick={{fontSize: 12, fill: '#94a3b8'}} tickFormatter={(val) => val.length > 15 ? `${val.slice(0,15)}...` : val} /><Tooltip contentStyle={{ backgroundColor: '#1e2d3b', border: '1px solid #334155' }}/><Bar dataKey="picks" name="Počet operací" fill={warehouseChartType === 'bins' ? '#ec4899' : '#14b8a6'} /></BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        </div>
                        
                        <div className="bg-slate-800 rounded-lg border border-slate-700 overflow-hidden">
                            <div className="p-6">
                                <h2 className="text-xl font-semibold text-white">Detailní přehled operací</h2>
                                <div className="mt-4"><input type="text" placeholder="Hledat v detailech..." value={tableFilter} onChange={(e) => { setTableFilter(e.target.value); setCurrentPage(1); }} className="p-2 bg-slate-700 border border-slate-600 rounded-md w-full md:w-1/3 text-white placeholder-slate-400" /></div>
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
                                        {paginatedData.map((row, index) => (
                                            <tr key={`${row.id}-${index}`} className="hover:bg-slate-700/50">
                                                <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-sky-400 hover:underline cursor-pointer" onClick={() => setSelectedPicker(row.user_name)}>{row.user_name}</td>
                                                <td className="px-4 py-4 whitespace-nowrap text-sm text-slate-300 hover:underline cursor-pointer" onClick={() => handleDeliveryClick(row.delivery_no)}>{row.delivery_no}</td>
                                                <td className="px-4 py-4 whitespace-nowrap text-sm text-slate-400">{row.source_storage_bin}</td>
                                                <td className="px-4 py-4 whitespace-nowrap text-sm text-slate-400">{row.source_actual_qty}</td>
                                                <td className="px-4 py-4 whitespace-nowrap text-sm text-slate-400">{row.weight?.toLocaleString('cs-CZ')}</td>
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