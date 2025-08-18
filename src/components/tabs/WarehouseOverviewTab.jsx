"use client";
import React, { useState, useEffect, Suspense, useCallback, useRef } from 'react';
import { Upload, View, PieChart } from 'lucide-react';
import { Toaster, toast } from 'react-hot-toast';
import { processWarehouseData, parseStockFile, parseBinMasterFile } from '../../lib/warehouseProcessor';
import { getSupabase } from '@/lib/supabaseClient';

import { Warehouse3DViewTab } from './warehouse/Warehouse3DViewTab';
import { WarehouseAnalyticsTab } from './warehouse/WarehouseAnalyticsTab';

// Pomocná funkce pro transformaci názvů sloupců
const toSnakeCase = (str) => {
    if (!str) return '';
    return str.replace(/[."/]/g, '').replace(/\s+/g, ' ').trim().replace(/ /g, '_').toLowerCase();
};

const transformAndFilterData = (data, allowedColumns) => {
    if (!Array.isArray(data)) return [];
    
    const uniqueData = Array.from(new Map(data.map(item => [item['Storage Bin'], item])).values());

    return uniqueData.map(row => {
        const newRow = {};
        for (const key in row) {
            const snakeKey = toSnakeCase(key);
            if (allowedColumns.includes(snakeKey)) {
                newRow[snakeKey] = row[key];
            }
        }
        return newRow;
    });
};

const WarehouseOverviewTab = () => {
    const [warehouseLayout, setWarehouseLayout] = useState(null);
    const [processedData, setProcessedData] = useState({ grid: new Map(), dimensions: null, labels: [], kpis: null });
    const [loading, setLoading] = useState(true);
    const [loadingMessage, setLoadingMessage] = useState("Inicializace...");
    const [activeTab, setActiveTab] = useState('analytics');
    const fileInputRef = useRef(null);
    const supabase = getSupabase();

    const fetchAndProcessData = useCallback(async () => {
        if (!warehouseLayout) return;
        setLoading(true);
        try {
            setLoadingMessage('Načítám data z databáze...');
            const ninetyDaysAgo = new Date(new Date().setDate(new Date().getDate() - 90)).toISOString().split('T')[0];

            const [masterRes, stockRes, pickingRes] = await Promise.all([
                supabase.from('warehouse_bins_master').select('*'),
                supabase.from('warehouse_stock').select('*'),
                supabase.from('picking_dashboard_data').select('*').gte('confirmation_date', ninetyDaysAgo)
            ]);

            if (masterRes.error) throw new Error(`Chyba master dat: ${masterRes.error.message}`);
            if (stockRes.error) throw new Error(`Chyba stavu zásob: ${stockRes.error.message}`);
            if (pickingRes.error) throw new Error(`Chyba picking dat: ${pickingRes.error.message}`);

            setLoadingMessage('Zpracovávám data a počítám KPI...');
            const result = processWarehouseData(warehouseLayout, stockRes.data, pickingRes.data, masterRes.data);
            setProcessedData(result);
            toast.success('Dashboard je aktuální!');
        } catch (error) {
            toast.error(`Chyba při načítání dat: ${error.message}`);
        } finally {
            setLoading(false);
        }
    }, [warehouseLayout, supabase]);

    useEffect(() => {
        const loadLayout = async () => {
            try {
                const response = await fetch('/data/warehouse-layout.json');
                setWarehouseLayout(await response.json());
            } catch (error) { toast.error('Kritická chyba: Nepodařilo se načíst layout skladu.'); }
        };
        loadLayout();
    }, []);

    useEffect(() => {
        if (warehouseLayout) {
            fetchAndProcessData();
        }
    }, [warehouseLayout, fetchAndProcessData]);

    const handleFileUpload = async (file, type) => {
        const toastId = toast.loading(`Zpracovávám a ukládám ${type.toUpperCase()}...`);
        try {
            let jsonData = type === 'lx03' ? await parseBinMasterFile(file) : await parseStockFile(file);
            let tableName, allowedColumns, uniqueKey;

            if (type === 'lx03') {
                tableName = 'warehouse_bins_master';
                allowedColumns = ['storage_type', 'storage_bin', 'picking_area', 'storage_bin_type', 'zone', 'bin_section', 'maximum_weight', 'unit_of_weight', 'x_coordinate', 'y_coordinate', 'z_coordinate'];
                uniqueKey = 'storage_bin';
            } else {
                tableName = 'warehouse_stock';
                allowedColumns = ['storage_bin', 'material', 'plant', 'available_stock', 'base_unit_of_measure', 'stock_category', 'special_stock', 'durat', 'storage_unit', 'storage_type', 'storage_section', 'gr_date'];
            }
            
            const transformedData = transformAndFilterData(jsonData, allowedColumns);

            if(type === 'lx03'){
                const { error } = await supabase.from(tableName).upsert(transformedData, { onConflict: uniqueKey });
                if (error) throw error;
            } else {
                const { error: deleteError } = await supabase.from(tableName).delete().neq('id', -1);
                if (deleteError) throw deleteError;
                const { error: insertError } = await supabase.from(tableName).insert(transformedData);
                if (insertError) throw insertError;
            }
            
            toast.success('Data úspěšně uložena! Aktualizuji přehled...', { id: toastId });
            await fetchAndProcessData();
        } catch (error) {
            toast.error(`Chyba: ${error.message}`, { id: toastId });
        }
    };
    
    const onFileSelect = (type) => {
        const input = fileInputRef.current;
        input.onchange = (e) => {
            if (e.target.files[0]) handleFileUpload(e.target.files[0], type);
            e.target.value = null;
        };
        input.click();
    };

    if (loading) return <div className="flex justify-center items-center h-full">{loadingMessage}</div>;
    
    return (
        <>
            <Toaster position="bottom-right" />
            <div className="h-full w-full flex flex-col gap-4">
                 <div className="bg-card rounded-xl shadow-lg p-4 flex flex-col md:flex-row items-center gap-4 border border-border">
                    <div className="flex-grow">
                        <h2 className="text-xl font-bold text-foreground">Warehouse Intelligence Dashboard</h2>
                        <p className="text-sm text-muted-foreground">Data jsou automaticky načtena z databáze.</p>
                    </div>
                     <div className="flex flex-col sm:flex-row gap-2">
                         <input type="file" ref={fileInputRef} accept=".xlsx, .xls, .csv" className="hidden"/>
                         <button onClick={() => onFileSelect('lx03')} className="btn-secondary">Aktualizovat Master Data (LX03)</button>
                         <button onClick={() => onFileSelect('lt10')} className="btn-primary">Nahrát Denní Report (LT10)</button>
                     </div>
                     <div className="flex bg-background rounded-lg p-1 border border-border">
                         <button onClick={() => setActiveTab('analytics')} className={`px-4 py-1.5 text-sm rounded-md ${activeTab === 'analytics' ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'}`}><PieChart size={16} className="inline mr-2"/>Analytika</button>
                         <button onClick={() => setActiveTab('3d_view')} className={`px-4 py-1.5 text-sm rounded-md ${activeTab === '3d_view' ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'}`}><View size={16} className="inline mr-2"/>3D Pohled</button>
                     </div>
                </div>

                <div className="flex-grow w-full h-full rounded-lg overflow-hidden relative min-h-0 bg-card border border-border shadow-lg">
                    <Suspense fallback={<div className="flex justify-center items-center h-full">Načítám...</div>}>
                        {activeTab === 'analytics' && <WarehouseAnalyticsTab kpis={processedData.kpis} isLoading={loading || !processedData.kpis} />}
                        {activeTab === '3d_view' && <Warehouse3DViewTab gridData={processedData.grid} dimensions={processedData.dimensions} labels={processedData.labels} />}
                    </Suspense>
                </div>
            </div>
        </>
    );
};
export default WarehouseOverviewTab;