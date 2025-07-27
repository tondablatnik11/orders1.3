"use client";
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useData } from '@/hooks/useData';
import { useUI } from '@/hooks/useUI';
import { format, startOfDay, subDays, parseISO, endOfDay, isValid } from 'date-fns';
import { cs } from 'date-fns/locale';
import { CheckCircle, Clock, Hourglass, Info, AlertTriangle, ClipboardList, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { OrderListModal } from '@/components/modals/OrderListModal';
import OrdersOverTimeChart from '@/components/charts/OrdersOverTimeChart';
import StatusDistributionChart from '@/components/charts/StatusDistributionChart';
import DonutChartCard from '@/components/charts/DonutChartCard';
import D3GeoChart from '../charts/D3GeoChart';
import { countryCodeMap } from '@/lib/dataProcessor';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LabelList } from 'recharts';

// --- Vylepšené pomocné komponenty ---

const SummaryCard = ({ title, value, icon: Icon, color, change }) => {
    const isPositive = change > 0;
    const isNegative = change < 0;
    const ChangeIcon = isPositive ? TrendingUp : isNegative ? TrendingDown : Minus;
    const changeColor = isPositive ? 'text-green-400' : isNegative ? 'text-red-400' : 'text-slate-500';

    return (
        <div className="bg-slate-800 rounded-xl border border-slate-700 p-4 transition-all hover:border-slate-600 hover:shadow-lg">
            <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                    <Icon className={`w-6 h-6 text-${color}-400`} />
                    <p className="text-slate-400 text-sm">{title}</p>
                </div>
                {change !== undefined && (
                    <div className={`flex items-center text-xs font-bold ${changeColor}`}>
                        <ChangeIcon className="w-4 h-4" />
                        <span>{Math.abs(change)}</span>
                    </div>
                )}
            </div>
            <p className="text-3xl font-bold text-white mt-2">{value.toLocaleString()}</p>
        </div>
    );
};

const FeaturedKPICard = ({ title, value, icon: Icon, onClick, change }) => {
    const isPositive = change > 0;
    const isNegative = change < 0;
    const ChangeIcon = isPositive ? TrendingUp : isNegative ? TrendingDown : Minus;
    const changeColor = isPositive ? 'text-red-400' : isNegative ? 'text-green-400' : 'text-slate-500'; // Inverzní logika pro zpoždění

    return (
        <div onClick={onClick} className="bg-red-900/50 rounded-xl border border-red-700 p-4 cursor-pointer transition-all hover:border-red-600 hover:shadow-lg">
             <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                    <Icon className="w-6 h-6 text-red-400" />
                    <p className="text-red-300 text-sm">{title}</p>
                </div>
                {change !== undefined && (
                    <div className={`flex items-center text-xs font-bold ${changeColor}`}>
                        <ChangeIcon className="w-4 h-4" />
                        <span>{Math.abs(change)}</span>
                    </div>
                )}
            </div>
            <p className="text-3xl font-bold text-white mt-2">{value.toLocaleString()}</p>
        </div>
    );
};

const ChartContainer = ({ title, children, data }) => (
    <div className="bg-slate-800 p-6 rounded-lg border border-slate-700 flex flex-col h-full">
        <h2 className="text-xl font-semibold text-white mb-4">{title}</h2>
        <div className="flex-grow">
            {data && data.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                    {children}
                </ResponsiveContainer>
            ) : (
                <div className="flex items-center justify-center h-full text-slate-500">
                    <Info size={18} className="mr-2"/>
                    <span>Nedostatek dat pro zobrazení</span>
                </div>
            )}
        </div>
    </div>
);


const SummaryCardSkeleton = () => <div className="bg-slate-800 rounded-xl border border-slate-700 p-4 h-[92px] animate-pulse"></div>;

export default function DashboardTab({ setActiveTab }) {
    const { summary, previousSummary, allOrdersData, setSelectedOrderDetails, isLoadingData, pickingData } = useData();
    const { t } = useUI();
    const [modalState, setModalState] = useState({ isOpen: false, title: '', orders: [] });
    
    const getChange = (currentValue, previousValue) => {
        if (previousSummary === null || currentValue === undefined || previousValue === undefined) return undefined;
        return currentValue - previousValue;
    };
    
    const handleOrderClick = (deliveryNo) => {
        const orderDetails = allOrdersData.find(order => String(order['Delivery No']) === String(deliveryNo));
        const relatedPicking = (pickingData || []).filter(p => String(p.delivery_no) === String(deliveryNo));
        
        if (orderDetails) {
            setSelectedOrderDetails({ ...orderDetails, picking_details: relatedPicking });
        } else {
            console.error(`Objednávka ${deliveryNo} nebyla nalezena.`);
        }
    };

    if (isLoadingData || !summary) {
        return (
            <div className="space-y-8">
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                    {Array.from({length: 5}).map((_, i) => <SummaryCardSkeleton key={i} />)}
                </div>
            </div>
        );
    }

    const today = startOfDay(new Date());
    const datesForOverview = Array.from({ length: 7 }).map((_, i) => subDays(today, i)).reverse();

    const handleStatClick = (date, statusFilter, title) => {
        const filteredOrders = allOrdersData.filter(order => {
            const loadingDate = order["Loading Date"] ? parseISO(order["Loading Date"]) : null;
            if (!loadingDate || !isValid(loadingDate) || format(loadingDate, 'yyyy-MM-dd') !== format(date, 'yyyy-MM-dd')) return false;
            if (statusFilter === 'all') return true;
            return statusFilter.includes(Number(order.Status));
        });
        setModalState({ isOpen: true, title: `${title} - ${format(date, 'dd.MM.yyyy')}`, orders: filteredOrders });
    };
    
    const handleBarClick = (data) => {
        if (!data || !data.activePayload || !data.activePayload.length) return;
        const clickedBar = data.activePayload[0];
        const statusKey = clickedBar.dataKey;
        const dateLabel = data.activeLabel;
        const dateObj = summary.dailySummaries.find(d => {
            const parsedDate = parseISO(d.date);
            return isValid(parsedDate) && format(parsedDate, 'dd/MM') === dateLabel;
        });
        if (!dateObj) return;
        const dateStr = dateObj.date;
        const filteredOrders = allOrdersData.filter(order => {
            const loadingDate = order["Loading Date"] ? parseISO(order["Loading Date"]) : null;
            if (!loadingDate || !isValid(loadingDate) || format(loadingDate, 'yyyy-MM-dd') !== dateStr) return false;
             const status = statusKey.replace('status', '');
             return String(order.Status) === status;
        });
        const statusName = clickedBar.name || statusKey;
        setModalState({ isOpen: true, title: `${statusName} - ${format(parseISO(dateStr), 'dd.MM.yyyy')}`, orders: filteredOrders });
    };
    
    const handleCountryClick = (countryCode3) => {
        if (!allOrdersData) return;
        const countryCodeMapReversed = Object.fromEntries(Object.entries(countryCodeMap).map(([k,v])=>[v,k]));
        const countryCode2 = countryCodeMapReversed[countryCode3];
        const filteredOrders = allOrdersData.filter(o => o["Country ship-to prty"] === countryCode2);
        setModalState({ isOpen: true, title: `${t.orderListFor} ${countryCode3}`, orders: filteredOrders });
    };

    const summaryCardsData = [
        { labelKey: 'total', value: summary.total, change: getChange(summary.total, previousSummary?.total), icon: Info, color: 'blue' },
        { labelKey: 'done', value: summary.doneTotal, change: getChange(summary.doneTotal, previousSummary?.doneTotal), icon: CheckCircle, color: 'green' },
        { labelKey: 'remaining', value: summary.remainingTotal, change: getChange(summary.remainingTotal, previousSummary?.remainingTotal), icon: Clock, color: 'yellow' },
        { labelKey: 'inProgress', value: summary.inProgressTotal, change: getChange(summary.inProgressTotal, previousSummary?.inProgressTotal), icon: Hourglass, color: 'orange' },
    ];

    return (
        <div className="space-y-8">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                {summaryCardsData.map(card => (
                    <SummaryCard key={card.labelKey} title={t[card.labelKey]} value={card.value} icon={card.icon} color={card.color} change={card.change} />
                ))}
                <FeaturedKPICard 
                    title={t.delayed} 
                    value={summary.delayed} 
                    icon={AlertTriangle} 
                    onClick={() => setActiveTab('delayedOrders')}
                    change={getChange(summary.delayed, previousSummary?.delayed)}
                />
            </div>
            
            <div className="bg-slate-800 rounded-lg border border-slate-700">
                <div className="p-4 border-b border-slate-700">
                    <h2 className="text-xl font-bold flex items-center gap-2 text-slate-200">
                        <ClipboardList className="w-6 h-6 text-green-400" /> Denní přehled stavu (posledních 7 dní)
                    </h2>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="text-xs text-slate-400 uppercase bg-slate-800/50">
                            <tr>
                                <th scope="col" className="px-6 py-3">Datum</th>
                                <th scope="col" className="px-6 py-3 text-center">Celkem</th>
                                <th scope="col" className="px-6 py-3 text-center">Hotovo</th>
                                <th scope="col" className="px-6 py-3 text-center">Zbývá</th>
                                <th scope="col" className="px-6 py-3 text-center">V procesu</th>
                                <th scope="col" className="px-6 py-3 text-center">Nové</th>
                            </tr>
                        </thead>
                        <tbody>
                            {datesForOverview.map(d => {
                                const dateStr = format(d, 'yyyy-MM-dd');
                                const isToday = dateStr === format(today, 'yyyy-MM-dd');
                                const dailyStats = summary.dailySummaries.find(s => s.date === dateStr);
                                
                                return (
                                    <tr key={dateStr} className={`border-b border-slate-700 ${isToday ? 'bg-sky-900/40' : 'hover:bg-slate-700/50'}`}>
                                        <th scope="row" className="px-6 py-4 font-medium text-white whitespace-nowrap">
                                            {format(d, 'EEEE dd.MM.', { locale: cs })}
                                        </th>
                                        <td className="px-6 py-4 text-center cursor-pointer hover:underline" onClick={() => handleStatClick(d, 'all', 'Všechny zakázky')}>{dailyStats?.total || 0}</td>
                                        <td className="px-6 py-4 text-center text-green-400 cursor-pointer hover:underline" onClick={() => handleStatClick(d, [50, 60, 70, 80, 90], 'Hotové zakázky')}>{dailyStats?.done || 0}</td>
                                        <td className="px-6 py-4 text-center text-yellow-400">{dailyStats?.remaining || 0}</td>
                                        <td className="px-6 py-4 text-center text-orange-400 cursor-pointer hover:underline" onClick={() => handleStatClick(d, [31, 35, 40], 'Zakázky v procesu')}>{dailyStats?.inProgress || 0}</td>
                                        <td className="px-6 py-4 text-center text-blue-400 cursor-pointer hover:underline" onClick={() => handleStatClick(d, [10], 'Nové zakázky')}>{dailyStats?.new || 0}</td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <StatusDistributionChart onBarClick={handleBarClick} />
                <OrdersOverTimeChart summary={summary} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                 <div className="lg:col-span-8">
                     <D3GeoChart data={summary?.ordersByCountry || []} onCountryClick={handleCountryClick} />
                 </div>
                 <div className="lg:col-span-4 space-y-6">
                    <ChartContainer title="Nejčastější dopravci" data={summary?.ordersByForwardingAgent}>
                        <BarChart data={summary.ordersByForwardingAgent} layout="vertical" margin={{right: 30}}>
                            <XAxis type="number" hide />
                            <YAxis type="category" dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} width={80} />
                            <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155' }} cursor={{fill: '#334155'}} />
                            <Bar dataKey="Počet zakázek" fill="#8884d8" barSize={20}>
                                <LabelList dataKey="Počet zakázek" position="right" style={{ fill: '#a3a3a3', fontSize: 12 }} />
                            </Bar>
                        </BarChart>
                    </ChartContainer>
                     <DonutChartCard title="Typy objednávek" data={summary?.orderTypesOEM} />
                     <DonutChartCard title="Podíl typů dodávek" data={summary?.deliveryTypes} />
                 </div>
            </div>
            
            <OrderListModal 
                isOpen={modalState.isOpen}
                onClose={() => setModalState({ isOpen: false, title: '', orders: [] })}
                title={modalState.title}
                orders={modalState.orders}
                onSelectOrder={(order) => handleOrderClick(order['Delivery No'])}
                t={t}
            />
        </div>
    );
}