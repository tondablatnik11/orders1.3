"use client";
import React from 'react';
import { useData } from '@/hooks/useData';
import { useUI } from '@/hooks/useUI';
import { Card, CardContent } from '@/components/ui/Card';
import StatusDistributionChart from '@/components/charts/StatusDistributionChart';
import OrdersOverTimeChart from '@/components/charts/OrdersOverTimeChart';
import { format, startOfDay, addDays, subDays } from 'date-fns';
import { cs } from 'date-fns/locale';
import { ClipboardList, UploadCloud } from 'lucide-react';

const SummaryCard = ({ title, value, colorClass = "text-blue-400" }) => (
    <div className="bg-gray-800 p-4 rounded-xl shadow-lg border border-gray-700 h-full">
        <p className="text-sm text-gray-400">{title}</p>
        <p className={`text-4xl font-bold ${colorClass}`}>{value || 0}</p>
    </div>
);

const DailyOverviewCard = ({ title, stats, t }) => (
    <div className="bg-gray-800 p-4 rounded-xl shadow-lg border border-gray-700 min-w-48">
        <p className="text-gray-400 text-center font-semibold mb-3">{title}</p>
        {stats ? (
            <div className="text-sm space-y-1">
                <p>{t.total}: <strong className="float-right">{stats.total}</strong></p>
                <p>{t.done}: <strong className="text-green-300 float-right">{stats.done}</strong></p>
                <p>{t.remaining}: <strong className="text-yellow-300 float-right">{stats.remaining}</strong></p>
                <p>{t.inProgress}: <strong className="text-orange-300 float-right">{stats.inProgress}</strong></p>
                <p>{t.newOrders}: <strong className="text-purple-300 float-right">{stats.new}</strong></p>
            </div>
        ) : <div className="text-center text-gray-500 text-sm flex items-center justify-center h-24">{t.noDataAvailable}</div>}
    </div>
);

export default function DashboardTab() {
    const { summary, isLoadingData, handleFileUpload } = useData();
    const { t } = useUI();

    const today = startOfDay(new Date());
    const datesForOverview = [
        { date: subDays(today, 2), label: 'Předevčírem' },
        { date: subDays(today, 1), label: t.yesterday },
        { date: today, label: t.today },
        { date: addDays(today, 1), label: 'Zítra' },
        { date: addDays(today, 2), label: format(addDays(today, 2), 'EEEE', { locale: cs }) },
        { date: addDays(today, 3), label: format(addDays(today, 3), 'EEEE', { locale: cs }) },
        { date: addDays(today, 4), label: format(addDays(today, 4), 'EEEE', { locale: cs }) },
        { date: addDays(today, 5), label: format(addDays(today, 5), 'EEEE', { locale: cs }) },
    ];

    if (isLoadingData) {
        return <p className="text-center p-8 text-lg">Načítám data...</p>;
    }

    if (!summary) {
        return (
            <div className="text-center mt-12">
                 <p className="mb-6 text-xl text-gray-400">{t.uploadFilePrompt}</p>
                 <label className="cursor-pointer inline-flex items-center gap-3 bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-lg shadow-lg text-lg">
                    <UploadCloud className="w-6 h-6" />
                    <span>{t.upload}</span>
                    <input type="file" accept=".xlsx, .xls" className="hidden" onChange={(e) => handleFileUpload(e.target.files[0])} />
                </label>
            </div>
        );
    }
    
    const summaryCardsData = [
        { labelKey: 'total', value: summary.total, color: 'text-blue-400' },
        { labelKey: 'done', value: summary.doneTotal, color: 'text-green-400' },
        { labelKey: 'remaining', value: summary.remainingTotal, color: 'text-yellow-400' },
        { labelKey: 'inProgress', value: summary.inProgressTotal, color: 'text-orange-400' },
        { labelKey: 'newOrders', value: summary.newOrdersTotal, color: 'text-purple-400' },
        { labelKey: 'pallets', value: summary.palletsTotal, color: 'text-pink-400' },
        { labelKey: 'carton', value: summary.cartonsTotal, color: 'text-cyan-400' },
    ];

    return (
        <div className="space-y-8">
            {/* Souhrnné karty */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-6">
                {summaryCardsData.map(card => (
                    <SummaryCard key={card.labelKey} title={t[card.labelKey]} value={card.value} colorClass={card.color} />
                ))}
            </div>

            {/* Denní přehledy s horizontálním scrollováním */}
            <div className="mt-8">
                <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
                    <ClipboardList className="w-6 h-6 text-green-400" /> Denní přehled stavu
                </h2>
                <div className="flex space-x-6 overflow-x-auto pb-4">
                    {datesForOverview.map((d) => {
                        const dateStr = format(d.date, 'yyyy-MM-dd');
                        const dailyStats = summary.dailySummaries.find(s => s.date === dateStr);
                        const displayLabel = `${d.label} (${format(d.date, 'dd.MM.')})`;
                        return (
                            <DailyOverviewCard key={dateStr} title={displayLabel} stats={dailyStats} t={t} />
                        );
                    })}
                </div>
            </div>
            
            {/* Hlavní grafy - nyní pod sebou na celou šířku */}
            <div className="space-y-8 mt-8">
                <StatusDistributionChart />
                <OrdersOverTimeChart summary={summary} />
            </div>
        </div>
    );
}