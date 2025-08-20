"use client";
import React, { useState } from 'react';
import { OverallOverview } from './OverallOverview';
import { ABCAnalysis } from './ABCAnalysis';
import { BinTypeByRowAnalysis } from './BinTypeByRowAnalysis';

export const WarehouseAnalyticsTab = ({ kpis, isLoading }) => {
    const [activeSubTab, setActiveSubTab] = useState('overview');

    if (isLoading || !kpis) {
        return <div className="p-6 h-full w-full bg-background rounded-lg animate-pulse"></div>;
    }

    const SubTabButton = ({ tabName, label }) => (
        <button 
            onClick={() => setActiveSubTab(tabName)} 
            className={`px-4 py-2 text-sm font-semibold rounded-md transition-colors ${activeSubTab === tabName ? 'bg-primary text-primary-foreground' : 'bg-background text-muted-foreground hover:bg-muted'}`}
        >
            {label}
        </button>
    );

    const renderContent = () => {
        switch(activeSubTab) {
            case 'overview': return <OverallOverview kpis={kpis} />;
            case 'abc': return <ABCAnalysis kpis={kpis} />;
            case 'bin_types_by_row': return <BinTypeByRowAnalysis kpis={kpis} />; // Komponenta pro analýzu řad
            default: return null;
        }
    };

    return (
        <div className="p-6 flex flex-col h-full">
            <div className="flex items-center gap-2 border-b border-border pb-4 mb-4 flex-wrap">
                <SubTabButton tabName="overview" label="Celkový Přehled"/>
                <SubTabButton tabName="abc" label="ABC Analýza Materiálů"/>
                <SubTabButton tabName="bin_types_by_row" label="Analýza Řad"/> 
            </div>
            <div className="overflow-y-auto flex-grow pr-2">
                {renderContent()}
            </div>
        </div>
    );
};