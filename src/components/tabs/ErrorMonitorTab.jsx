'use client';
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { getSupabase } from '@/lib/supabaseClient'; // <-- Vráceno na getSupabase
import * as XLSX from 'xlsx';

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const getTopN = (data, key, n = 10) => {
    if (!data) return [];
    const counts = data.reduce((acc, item) => {
        const value = item[key] || 'N/A';
        acc[value] = (acc[value] || 0) + 1;
        return acc;
    }, {});
    return Object.entries(counts).sort(([, a], [, b]) => b - a).slice(0, n).map(([name, value]) => ({ name, value }));
};

const ErrorMonitorTab = () => {
    const [errorData, setErrorData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [uploadMessage, setUploadMessage] = useState('');

    const fetchErrors = useCallback(async () => {
        setLoading(true);
        const supabase = getSupabase(); // <-- Zpět na volání funkce
        const { data, error } = await supabase.from('errors').select('*').order('timestamp', { ascending: false });
        if (error) {
            console.error('Chyba při načítání dat ze Supabase:', error);
            setUploadMessage(`Chyba při načítání: ${error.message}`);
        } else {
            setErrorData(data || []);
        }
        setLoading(false);
    }, []);

    useEffect(() => {
        fetchErrors();
    }, [fetchErrors]);

    const handleFileImport = async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        setUploading(true);
        setUploadMessage('');
        try {
            const supabase = getSupabase(); // <-- Zpět na volání funkce
            setUploadMessage('Krok 1/5: Čtu soubor...');
            await sleep(500);
            const fileData = await file.arrayBuffer();

            setUploadMessage('Krok 2/5: Zpracovávám XLSX data...');
            await sleep(500);
            const workbook = XLSX.read(fileData, { type: 'array' });
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            const jsonData = XLSX.utils.sheet_to_json(worksheet);

            setUploadMessage(`Krok 3/5: Nalezeno ${jsonData.length} řádků. Validuji data...`);
            await sleep(500);
            let invalidRows = 0;
            const processedData = jsonData.map((row, index) => {
                const dateStr = row['Created On'];
                const timeStr = row['Time'];
                if (!dateStr || !timeStr) {
                    invalidRows++; return null;
                }
                const dateParts = dateStr.split('/');
                if (dateParts.length !== 3) {
                    invalidRows++; return null;
                }
                const month = parseInt(dateParts[0], 10) - 1;
                const day = parseInt(dateParts[1], 10);
                const year = parseInt(dateParts[2], 10);
                const timeParts = timeStr.split(':');
                const hours = parseInt(timeParts[0], 10);
                const minutes = parseInt(timeParts[1], 10);
                const seconds = parseInt(timeParts[2], 10);
                const date = new Date(year, month, day, hours, minutes, seconds);

                if (isNaN(date.getTime())) {
                    invalidRows++; return null;
                }

                const text1 = row['Text']?.trim() || '';
                const text2 = row['Text.1']?.trim() || '';
                return {
                    timestamp: date.toISOString(),
                    description: `${text1} ${text2}`.trim() || 'N/A',
                    material: row['Material'] || 'N/A',
                    error_location: row['Storage Bin'] || 'N/A',
                    order_reference: String(row['Dest.Storage Bin']) || 'N/A',
                    user: row['Created By'] || 'N/A',
                    target_qty: row['Source target qty'] || 0,
                    actual_qty: row['Source actual qty.'] || 0,
                    diff_qty: row['Source bin differ.'] || 0,
                };
            }).filter(Boolean);

            if (processedData.length === 0) {
                throw new Error("V souboru nebyla nalezena žádná platná data k importu.");
            }
            setUploadMessage(`Krok 4/5: Nahrávám ${processedData.length} platných záznamů...`);
            await sleep(500);
            const CHUNK_SIZE = 100;
            for (let i = 0; i < processedData.length; i += CHUNK_SIZE) {
                const chunk = processedData.slice(i, i + CHUNK_SIZE);
                const { error } = await supabase.from('errors').insert(chunk);
                if (error) {
                    throw new Error(`Chyba databáze při nahrávání: ${error.message}`);
                }
            }
            setUploadMessage('Krok 5/5: Import dokončen! Aktualizuji zobrazení...');
            await sleep(500);
            await fetchErrors();
            setUploadMessage('Hotovo!');

        } catch (error) {
            console.error('Import selhal:', error);
            setUploadMessage(`CHYBA: ${error.message}`);
        } finally {
            setUploading(false);
            setTimeout(() => setUploadMessage(''), 10000);
        }
    };
    
    // Zbytek kódu je beze změny
    const kpis = useMemo(() => {
        if (!errorData || errorData.length === 0) return { total: 0, mostCommon: 'N/A' };
        const descriptions = getTopN(errorData, 'description', 1);
        return { total: errorData.length, mostCommon: descriptions.length > 0 ? descriptions[0].name : 'N/A' };
    }, [errorData]);
    
    const chartData = useMemo(() => ({
        byDescription: getTopN(errorData, 'description'),
    }), [errorData]);

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader><CardTitle>Importovat chyby z XLSX</CardTitle></CardHeader>
                <CardContent>
                    <div className="flex flex-col space-y-4">
                        <p className="text-sm text-gray-400">Vyberte .xlsx soubor. Data budou zkontrolována a uložena do databáze.</p>
                        <div className="flex items-center space-x-4">
                            <label htmlFor="file-upload" className={`inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2 cursor-pointer ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}>
                                {uploading ? 'Pracuji...' : 'Vybrat soubor'}
                            </label>
                            <input id="file-upload" type="file" accept=".xlsx, .xls" className="hidden" onChange={handleFileImport} disabled={uploading} />
                            {uploadMessage && <p className={`text-md font-semibold ${uploadMessage.startsWith('CHYBA') ? 'text-red-500' : 'text-gray-300'}`}>{uploadMessage}</p>}
                        </div>
                    </div>
                </CardContent>
            </Card>

            {loading && <p className="text-center text-gray-300">Načítám data z databáze...</p>}
            
            {!loading && errorData && (
                 <div className="flex flex-col gap-6">
                    <Card>
                        <CardHeader><CardTitle>Detailní přehled chyb</CardTitle></CardHeader>
                        <CardContent>
                            <div className="overflow-x-auto max-h-[500px]">
                                <table className="w-full text-sm text-left text-gray-400">
                                    <thead className="text-xs text-gray-400 uppercase bg-gray-700 sticky top-0">
                                        <tr>
                                            <th scope="col" className="px-4 py-3">Čas</th>
                                            <th scope="col" className="px-4 py-3">Popis chyby</th>
                                            <th scope="col" className="px-4 py-3">Materiál</th>
                                            <th scope="col" className="px-4 py-3">Pozice</th>
                                            <th scope="col" className="px-4 py-3">Uživatel</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-700">
                                        {errorData.map((error) => (
                                            <tr key={error.id} className="hover:bg-gray-800">
                                                <td className="px-4 py-2 whitespace-nowrap">{new Date(error.timestamp).toLocaleString('cs-CZ')}</td>
                                                <td className="px-4 py-2 font-medium text-white">{error.description}</td>
                                                <td className="px-4 py-2">{error.material}</td>
                                                <td className="px-4 py-2">{error.error_location}</td>
                                                <td className="px-4 py-2">{error.user}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>

                    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                        <Card className="lg:col-span-1">
                            <CardHeader><CardTitle>Celkový počet chyb</CardTitle></CardHeader>
                            <CardContent><p className="text-4xl font-bold">{kpis.total}</p></CardContent>
                        </Card>
                         <Card className="lg:col-span-1">
                            <CardHeader><CardTitle>Nejčastější chyba</CardTitle></CardHeader>
                            <CardContent><p className="text-xl font-semibold">{kpis.mostCommon}</p></CardContent>
                        </Card>
                        <Card className="lg:col-span-2">
                            <CardHeader><CardTitle>TOP 10 nejčastějších chyb</CardTitle></CardHeader>
                            <CardContent className="h-[300px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={chartData.byDescription} layout="vertical" margin={{ left: 150, top: 5, right: 20, bottom: 5 }}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#4A5568" />
                                        <XAxis type="number" stroke="#A0AEC0" />
                                        <YAxis type="category" dataKey="name" width={150} stroke="#A0AEC0" tick={{ fontSize: 12, fill: '#A0AEC0' }} />
                                        <Tooltip contentStyle={{ backgroundColor: '#2D3748', border: '1px solid #4A5568' }} />
                                        <Bar dataKey="value" name="Počet" fill="#8884d8" />
                                    </BarChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ErrorMonitorTab;