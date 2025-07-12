"use client";
import React from 'react';
import { useData } from '@/hooks/useData';
import { useUI } from '@/hooks/useUI';
import DataFilters from '@/components/shared/DataFilters';
import SummaryCards from '@/components/shared/SummaryCards';
import StatusDistributionChart from '@/components/charts/StatusDistributionChart';
import OrdersOverTimeChart from '@/components/charts/OrdersOverTimeChart';
import InProgressChart from '@/components/charts/InProgressChart';
import ShipmentsChart from '@/components/charts/ShipmentsChart';
import ShiftComparisonChart from '@/components/charts/ShiftComparisonChart';
import OrderTypesChart from '@/components/charts/OrderTypesChart';
import { UploadCloud } from 'lucide-react';

export default function DashboardTab() {
    const { summary, isLoadingData, handleFileUpload } = useData();
    const { t } = useUI();

    if (isLoadingData) {
        return <div className="text-center p-8">Načítám data...</div>;
    }

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

    return (
        <div className="space-y-10">
             <div className="flex flex-col md:flex-row justify-center items-center gap-4">
                <label className="cursor-pointer inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg shadow">
                    <UploadCloud className="w-5 h-5" />
                    <span>{t.upload}</span>
                    <input type="file" accept=".xlsx, .xls" className="hidden" onChange={(e) => handleFileUpload(e.target.files[0])} />
                </label>
            </div>

            <div id="report-section" className="space-y-10">
                <DataFilters />
                <SummaryCards summary={summary} />
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <StatusDistributionChart summary={summary} />
                    <OrdersOverTimeChart summary={summary} />
                    <InProgressChart summary={summary} />
                    <ShipmentsChart summary={summary} />
                    <ShiftComparisonChart summary={summary} />
                    <OrderTypesChart summary={summary} />
                </div>
            </div>
        </div>
    );
}