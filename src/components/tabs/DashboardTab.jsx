"use client";
import React from 'react';
import { useData } from '@/hooks/useData';
import { useUI } from '@/hooks/useUI';
import SummaryCards from '@/components/shared/SummaryCards';
import StatusDistributionChart from '@/components/charts/StatusDistributionChart';
import { UploadCloud } from 'lucide-react';

export default function DashboardTab() {
    const { summary, isLoading, fetchData } = useData();
    const { t } = useUI();

    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        
        // Zde můžete přidat logiku pro nahrání souboru, která po úspěšném nahrání zavolá fetchData()
        // Příklad:
        // const success = await uploadFileToServer(file);
        // if(success) fetchData();
        alert("Funkce nahrávání souboru je zde. Po implementaci zavolejte fetchData().");
    };

    if (isLoading) {
        return <p className="text-center p-8">Načítám data...</p>;
    }

    if (!summary) {
        return (
            <div className="text-center mt-8">
                 <p className="mb-4">{t.uploadFilePrompt}</p>
                 <label className="cursor-pointer inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg shadow">
                    <UploadCloud className="w-5 h-5" />
                    <span>{t.upload}</span>
                    <input type="file" accept=".xlsx, .xls" className="hidden" onChange={handleFileUpload} />
                </label>
            </div>
        );
    }

    return (
        <div className="space-y-10">
            <SummaryCards summary={summary} />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <StatusDistributionChart summary={summary} />
                {/* Až toto bude fungovat, můžeme postupně přidávat další grafy */}
            </div>
        </div>
    );
}