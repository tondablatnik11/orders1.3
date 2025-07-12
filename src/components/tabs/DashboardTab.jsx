"use client";
import React from 'react';
import { useData } from '@/hooks/useData';
import SummaryCards from '@/components/shared/SummaryCards';
import StatusDistributionChart from '@/components/charts/StatusDistributionChart';

export default function DashboardTab() {
    const { summary } = useData();

    // SummaryCards a grafy již kontrolují, zda summary existuje
    return (
        <div className="space-y-10">
            <SummaryCards summary={summary} />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <StatusDistributionChart summary={summary} />
                {/* Zde postupně přidáme další grafy */}
            </div>
        </div>
    );
}