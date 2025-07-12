"use client";
import React from 'react';
import { useData } from '@/hooks/useData';
import { useUI } from '@/hooks/useUI';
import { exportToPDF } from '@/lib/exportUtils';
import DataFilters from '@/components/shared/DataFilters';
import SummaryCards from '@/components/shared/SummaryCards';
import StatusDistributionChart from '@/components/charts/StatusDistributionChart';
import OrdersOverTimeChart from '@/components/charts/OrdersOverTimeChart';
import InProgressChart from '@/components/charts/InProgressChart';
import ShipmentsChart from '@/components/charts/ShipmentsChart';
import ShiftComparisonChart from '@/components/charts/ShiftComparisonChart';
import OrderTypesChart from '@/components/charts/OrderTypesChart';
import { UploadCloud, FileDown } from 'lucide-react';

export default function DashboardTab() {
    // Získáváme data z DataContextu
    const { summary, isLoadingData, handleFileUpload } = useData();
    const { t } = useUI();

    // Zobrazení načítacího stavu
    if (isLoadingData) {
        return <p className="text-center p-8">Načítám data...</p>;
    }

    // Zobrazení výzvy, pokud nejsou k dispozici žádná data
    if (!summary) {
        return (
            <div className="text-center mt-8">
                 <p className="mb-4">{t.uploadFilePrompt}</p>
                 <label className="cursor-pointer inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg shadow">
                    <UploadCloud className="w-5 h-5" />
                    <span>{t.upload}</span>
                    <input type="file" accept=".xlsx, .xls" className="hidden" onChange={(e) => handleFileUpload(e.target.files[0])} />
                </label>
            </div>
        );
    }

    // Plné zobrazení dashboardu, pokud jsou data k dispozici
    return (
        <div className="space-y-10">
            <div className="flex flex-col md:flex-row justify-center items-center gap-4">
                <label className="cursor-pointer inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg shadow">
                    <UploadCloud className="w-5 h-5" />
                    <span>{t.upload}</span>
                    <input type="file" accept=".xlsx, .xls" className="hidden" onChange={(e) => handleFileUpload(e.target.files[0])} />
                </label>
                <button onClick={() => exportToPDF('report-section')} className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg shadow hover:bg-green-700">
                    <FileDown className="w-5 h-5" /> {t.export}
                </button>
            </div>

            <div id="report-section" className="space-y-10">
                <DataFilters />
                
                {/* Předání 'summary' dat do komponent */}
                <SummaryCards summary={summary} />
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Komponenty pro grafy již nepotřebují 'summary' jako prop, protože si ho vezmou z useData() */}
                    <StatusDistributionChart />
                    <OrdersOverTimeChart />
                    <InProgressChart />
                    <ShipmentsChart />
                    <ShiftComparisonChart />
                    <OrderTypesChart />
                </div>
            </div>
        </div>
    );
}