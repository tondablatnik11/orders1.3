"use client";
import React from 'react';
import { useData } from '@/hooks/useData';
import { useUI } from '@/hooks/useUI';
import SummaryCards from '@/components/shared/SummaryCards';
import StatusDistributionChart from '@/components/charts/StatusDistributionChart';
import { UploadCloud } from 'lucide-react';

export default function DashboardTab() {
    // Používáme isLoadingData a centralizovaný handleFileUpload
    const { summary, isLoadingData, handleFileUpload } = useData();
    const { t } = useUI();

    if (isLoadingData) {
        return <p className="text-center p-8">Načítám data...</p>;
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
            <SummaryCards summary={summary} />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <StatusDistributionChart />
                {/* Zde můžete přidat další grafy */}
            </div>
        </div>
    );
}