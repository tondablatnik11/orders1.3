'use client';
import React, { useState } from 'react';
import { getSupabase } from '@/lib/supabaseClient';
import * as XLSX from 'xlsx';

const PickingTab = () => {
    const [status, setStatus] = useState({ 
        type: 'info', 
        message: 'Prosím, nahrajte XLSX soubor pro zahájení importu.' 
    });
    
    const supabase = getSupabase();
    
    const handleFileUpload = async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        setStatus({ type: 'loading', message: 'Načítám a zpracovávám soubor...' });

        try {
            const data = await file.arrayBuffer();
            const workbook = XLSX.read(data, { type: "buffer" });
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            const jsonData = XLSX.utils.sheet_to_json(worksheet, { raw: false, dateNF: 'yyyy-mm-dd' });

            if (jsonData.length === 0) {
                throw new Error('Soubor je prázdný nebo má neplatný formát.');
            }

            const processedData = jsonData.map(row => ({
                user_name: row['User'],
                confirmation_date: row['Confirmation date'],
                confirmation_time: row['Confirmation time'],
                weight: row['Weight'],
                storage_unit_type: row['Storage Unit Type'],
                source_storage_type: row['Source Storage Type'],
                dest_storage_type: row['Dest. Storage Type'],
                material: row['Material']
            }));

            setStatus({ type: 'loading', message: `Nalezeno ${processedData.length} záznamů. Ukládám do databáze...` });
            
            const { error: insertError } = await supabase
                .from('picking_operations')
                .insert(processedData);

            if (insertError) {
                throw insertError;
            }

            setStatus({ type: 'success', message: `Hotovo! Úspěšně naimportováno ${processedData.length} záznamů.` });

        } catch (error) {
            console.error("Detail chyby při importu:", error);
            setStatus({ type: 'error', message: `Nastala chyba: ${error.message}` });
        }
    };

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-slate-800">Import Picking Dat</h1>
            
            <div className="bg-white rounded-lg shadow p-4 md:p-6">
                <h2 className="text-xl font-semibold mb-2 text-gray-800">Importovat Pickery z XLSX</h2>
                <p className="text-sm text-gray-500 mb-4">
                    Nahráním souboru se data zpracují a uloží přímo do databáze.
                </p>
                <input
                    type="file"
                    accept=".xlsx, .xls, .csv"
                    onChange={handleFileUpload}
                    disabled={status.type === 'loading'}
                    className="block w-full max-w-md text-sm text-gray-500
                        file:mr-4 file:py-2 file:px-4
                        file:rounded-full file:border-0
                        file:text-sm file:font-semibold
                        file:bg-blue-50 file:text-blue-700
                        hover:file:bg-blue-100 cursor-pointer disabled:opacity-50"
                />
            </div>

            <div className={`text-center p-3 rounded-lg text-sm font-medium
                ${status.type === 'success' ? 'bg-green-100 text-green-800' : ''}
                ${status.type === 'error' ? 'bg-red-100 text-red-800' : ''}
                ${status.type === 'loading' ? 'bg-blue-100 text-blue-800 animate-pulse' : ''}
                ${status.type === 'info' ? 'bg-slate-100 text-slate-600' : ''}
            `}>
                {status.message}
            </div>
        </div>
    );
};

export default PickingTab;