import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { supabase } from '@/lib/supabaseClient'; // Váš Supabase klient
import * as XLSX from 'xlsx'; // Knihovna pro práci s XLSX

// --- Pomocná funkce pro agregaci dat pro grafy ---
const getTopN = (data, key, n = 10) => {
    const counts = data.reduce((acc, item) => {
        const value = item[key] || 'N/A';
        acc[value] = (acc[value] || 0) + 1;
        return acc;
    }, {});

    return Object.entries(counts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, n)
        .map(([name, value]) => ({ name, value }));
};


const ErrorMonitorTab = () => {
  const [errorData, setErrorData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState('');

  // --- Funkce pro načtení dat z databáze ---
  const fetchErrors = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('errors')
      .select('*')
      .order('timestamp', { ascending: false });

    if (error) {
      console.error('Chyba při načítání dat ze Supabase:', error);
      setUploadMessage(`Chyba: ${error.message}`);
    } else {
      setErrorData(data);
    }
    setLoading(false);
  }, []);

  // --- Načtení dat při prvním zobrazení komponenty ---
  useEffect(() => {
    fetchErrors();
  }, [fetchErrors]);

  // --- Funkce pro zpracování a import souboru ---
  const handleFileImport = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setUploading(true);
    setUploadMessage('Zpracovávám soubor...');

    try {
      const fileData = await file.arrayBuffer();
      const workbook = XLSX.read(fileData, { type: 'array' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);

      setUploadMessage('Transformuji data pro databázi...');
      const processedData = jsonData.map(row => {
        const text1 = row['Text']?.trim() || '';
        const text2 = row['Text.1']?.trim() || '';
        
        return {
            timestamp: new Date(`${row['Created On']} ${row['Time']}`).toISOString(),
            description: `${text1} ${text2}`.trim() || 'N/A',
            material: row['Material'] || 'N/A',
            error_location: row['Storage Bin'] || 'N/A',
            order_reference: String(row['Dest.Storage Bin']) || 'N/A', // Ujistíme se, že je to text
            user: row['Created By'] || 'N/A',
            target_qty: row['Source target qty'] || 0,
            actual_qty: row['Source actual qty.'] || 0,
            diff_qty: row['Source bin differ.'] || 0,
        };
      });

      setUploadMessage(`Nahrávám ${processedData.length} záznamů do Supabase...`);
      
      const CHUNK_SIZE = 100; // Nahráváme po 100 záznamech
      for (let i = 0; i < processedData.length; i += CHUNK_SIZE) {
          const chunk = processedData.slice(i, i + CHUNK_SIZE);
          const { error } = await supabase.from('errors').insert(chunk);
          if (error) {
              throw error; // Pokud nastane chyba, přerušíme a zobrazíme ji
          }
      }

      setUploadMessage('Import dokončen! Aktualizuji data...');
      await fetchErrors(); // Znovu načteme data pro aktualizaci zobrazení
      
    } catch (error) {
      console.error('Selhal import souboru:', error);
      setUploadMessage(`Chyba při importu: ${error.message}`);
    } finally {
      setUploading(false);
      // Vymažeme zprávu po 5 sekundách
      setTimeout(() => setUploadMessage(''), 5000);
    }
  };

  // --- Memoizované výpočty pro grafy a KPI (zůstávají stejné) ---
   const kpis = useMemo(() => {
    if (errorData.length === 0) return { total: 0, mostCommon: 'N/A' };
    const descriptions = getTopN(errorData, 'description', 1);
    return {
      total: errorData.length,
      mostCommon: descriptions.length > 0 ? descriptions[0].name : 'N/A',
    };
  }, [errorData]);
  
  const chartData = useMemo(() => ({
    byDescription: getTopN(errorData, 'description'),
    byMaterial: getTopN(errorData, 'material'),
    byLocation: getTopN(errorData, 'error_location'),
    byUser: getTopN(errorData, 'user'),
  }), [errorData]);


  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Importovat chyby a nahrát do databáze</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col space-y-4">
          <p>Vyberte .xlsx soubor pro import. Data budou zpracována a uložena do databáze.</p>
          <div className="flex items-center space-x-4">
            <Button asChild variant="outline" disabled={uploading}>
              <label htmlFor="file-upload">
                {uploading ? 'Pracuji...' : 'Vybrat soubor'}
              </label>
            </Button>
            <input id="file-upload" type="file" accept=".xlsx, .xls" className="hidden" onChange={handleFileImport} disabled={uploading} />
            {uploadMessage && <p className="text-sm text-muted-foreground">{uploadMessage}</p>}
          </div>
        </CardContent>
      </Card>

      {loading && <p>Načítám data z databáze...</p>}

      {!loading && (
        <>
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader><CardTitle>Celkový počet chyb v DB</CardTitle></CardHeader>
              <CardContent><p className="text-3xl font-bold">{kpis.total}</p></CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle>Nejčastější popis chyby</CardTitle></CardHeader>
              <CardContent><p className="text-2xl font-semibold">{kpis.mostCommon}</p></CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader><CardTitle>Detailní přehled chyb (posledních 50)</CardTitle></CardHeader>
            <CardContent>
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                        <TableRow>
                            <TableHead>Čas</TableHead>
                            <TableHead>Popis chyby</TableHead>
                            <TableHead>Materiál</TableHead>
                            <TableHead>Pozice</TableHead>
                            <TableHead>Zakázka</TableHead>
                            <TableHead>Cíl. mn.</TableHead>
                            <TableHead>Skut. mn.</TableHead>
                            <TableHead>Rozdíl</TableHead>
                            <TableHead>Uživatel</TableHead>
                        </TableRow>
                        </TableHeader>
                        <TableBody>
                        {errorData.map((error) => (
                            <TableRow key={error.id}>
                            <TableCell>{new Date(error.timestamp).toLocaleString('cs-CZ')}</TableCell>
                            <TableCell className="font-medium">{error.description}</TableCell>
                            <TableCell>{error.material}</TableCell>
                            <TableCell>{error.error_location}</TableCell>
                            <TableCell>{error.order_reference}</TableCell>
                            <TableCell>{error.target_qty}</TableCell>
                            <TableCell>{error.actual_qty}</TableCell>
                            <TableCell className={error.diff_qty < 0 ? 'text-red-500 font-bold' : ''}>{error.diff_qty}</TableCell>
                            <TableCell>{error.user}</TableCell>
                            </TableRow>
                        ))}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>
          </Card>

          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader><CardTitle>TOP 10 nejčastějších chyb</CardTitle></CardHeader>
              <CardContent className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData.byDescription} layout="vertical" margin={{ left: 150 }}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis type="number" />
                        <YAxis type="category" dataKey="name" width={150} tick={{ fontSize: 12 }} />
                        <Tooltip />
                        <Bar dataKey="value" name="Počet" fill="#8884d8" />
                    </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle>TOP 10 nejchybovějších materiálů</CardTitle></CardHeader>
              <CardContent className="h-[400px]">
                 <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData.byMaterial} layout="vertical" margin={{ left: 150 }}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis type="number" />
                        <YAxis type="category" dataKey="name" width={150} tick={{ fontSize: 12 }}/>
                        <Tooltip />
                        <Bar dataKey="value" name="Počet" fill="#82ca9d" />
                    </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
};

export default ErrorMonitorTab;