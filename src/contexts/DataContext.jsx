'use client';
import React, { createContext, useState, useEffect, useCallback, useMemo, useContext } from 'react';
import { getSupabase } from '../lib/supabaseClient';
import { useAuth } from '@/hooks/useAuth';
import { processData } from '../lib/dataProcessor';
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { processErrorData } from '@/lib/errorMonitorProcessor';

// Změna zde: importujeme getSupabase místo supabase
import { getSupabase } from '@/lib/supabaseClient'; 
import { Card, Title, Text, Button, DonutChart, BarChart, Grid } from '@tremor/react';
import { UploadCloud, AlertCircle, RefreshCw } from 'lucide-react';

// Změna zde: Získáme klienta zavoláním funkce
const supabase = getSupabase();

const ErrorMonitorTab = () => {
  const [errorData, setErrorData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const fileInputRef = useRef(null);

  const fetchAndProcessData = useCallback(async (source) => {
    setIsLoading(true);
    setErrorMessage('');
    try {
      let dataToProcess;
      if (source instanceof File) {
        dataToProcess = source;
      } else {
        const { data: supabaseData, error } = await supabase
          .from('errors')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(500);

        if (error) throw error;
        dataToProcess = supabaseData;
      }

      const processedData = await processErrorData(dataToProcess);
      setErrorData(processedData);

    } catch (error) {
      console.error("Chyba při zpracování dat:", error);
      setErrorMessage(error.message || 'Nepodařilo se načíst nebo zpracovat data o chybách.');
      setErrorData(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAndProcessData();
  }, [fetchAndProcessData]);

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      fetchAndProcessData(file);
    }
    if(fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleRefreshClick = () => {
    fetchAndProcessData();
  };
  
  const priorityColor = (priority) => {
    switch (priority) {
      case 'High': return 'bg-red-500';
      case 'Medium': return 'bg-yellow-500';
      case 'Low': return 'bg-green-500';
      default: return 'bg-gray-400';
    }
  };

  return (
    <div className="p-4 sm:p-6 bg-gray-50/50 min-h-full">
      <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
        <Title>Monitoring Chyb Aplikace</Title>
        <div className="flex items-center gap-2">
            <input
              type="file"
              accept=".csv"
              onChange={handleFileUpload}
              ref={fileInputRef}
              className="hidden"
            />
            <Button
              onClick={handleUploadClick}
              variant="secondary"
              icon={UploadCloud}
              disabled={isLoading}
            >
              Nahrát log chyb
            </Button>
            <Button
              onClick={handleRefreshClick}
              loading={isLoading}
              icon={RefreshCw}
            >
              Aktualizovat
            </Button>
        </div>
      </div>

      {errorMessage && (
        <Card className="mb-6 bg-red-100 border-red-500">
          <div className="flex items-center">
            <AlertCircle className="h-5 w-5 text-red-700 mr-3 shrink-0" />
            <Text className="text-red-800">{errorMessage}</Text>
          </div>
        </Card>
      )}

      {!isLoading && errorData && errorData.detailedErrors.length > 0 ? (
        <div className="space-y-6">
          <Grid numItemsLg={3} className="gap-6">
            <Card>
                <Text>Celkem chyb</Text>
                <p className="text-2xl sm:text-3xl font-semibold">{errorData.summaryMetrics.totalErrors}</p>
            </Card>
            <Card>
                <Text>Unikátní typy chyb</Text>
                <p className="text-2xl sm:text-3xl font-semibold">{errorData.summaryMetrics.uniqueErrorTypes}</p>
            </Card>
            <Card>
                <Text>Vysoká priorita</Text>
                <p className="text-2xl sm:text-3xl font-semibold text-red-600">{errorData.summaryMetrics.totalHighPriority}</p>
            </Card>
          </Grid>
          
          <Grid numItemsLg={5} className="gap-6">
            <div className="lg:col-span-3">
              <Card>
                <Title>Chyby podle Aplikační Oblasti</Title>
                <BarChart className="mt-4 h-80" data={errorData.chartsData.errorsByArea} index="name" categories={['value']} colors={['orange']} yAxisWidth={100} layout="vertical" />
              </Card>
            </div>
            <div className="lg:col-span-2">
              <Card>
                <Title>Chyby podle Priority</Title>
                <DonutChart className="mt-10 h-64" data={errorData.chartsData.errorsByPriority} category="value" index="name" colors={['red', 'yellow', 'green']} />
              </Card>
            </div>
          </Grid>

          <Card>
            <Title>Detailní přehled chyb</Title>
            <div className="overflow-x-auto mt-4">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Priorita</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Čas</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Popis chyby</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stav</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Uživatel</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {errorData.detailedErrors.map((error) => (
                    <tr key={error.id}>
                      <td className="px-4 py-4 whitespace-nowrap"><span className={`inline-block h-4 w-4 rounded-full ring-2 ring-white ${priorityColor(error.priority)}`} title={error.priority}></span></td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600">{new Date(error.timestamp).toLocaleString('cs-CZ')}</td>
                      <td className="px-4 py-4 text-sm text-gray-900 max-w-sm truncate" title={error.description}>{error.description}</td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600">{error.status}</td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600">{error.user}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      ) : (
        <Card className="flex flex-col items-center justify-center h-96 border-dashed border-2">
            {isLoading ? (
                <>
                    <RefreshCw className="h-16 w-16 text-gray-400 mb-4 animate-spin" />
                    <Title className="text-gray-600">Načítám data z databáze...</Title>
                </>
            ) : (
                <>
                    <AlertCircle className="h-16 w-16 text-gray-400 mb-4" />
                    <Title className="text-gray-600">Žádná data k zobrazení</Title>
                    <Text className="text-gray-500">Nebyly nalezeny žádné záznamy o chybách.</Text>
                </>
            )}
        </Card>
      )}
    </div>
  );
};

export default ErrorMonitorTab;
import toast from 'react-hot-toast';

export const DataContext = createContext(null);
export const useData = () => useContext(DataContext);

export const DataProvider = ({ children }) => {
  const [allOrdersData, setAllOrdersData] = useState([]);
  const [summary, setSummary] = useState(null);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [selectedOrderDetails, setSelectedOrderDetails] = useState(null);
  
  const [errorLogData, setErrorLogData] = useState([]);
  const [errorSummary, setErrorSummary] = useState(null);
  const [isLoadingErrorData, setIsLoadingErrorData] = useState(true);

  const { currentUser, loading: authLoading } = useAuth();
  const supabase = getSupabase();

  const fetchData = useCallback(async () => {
    setIsLoadingData(true);
    try {
      const { data, error } = await supabase.from("deliveries").select('*').limit(10000);
      if (error) throw error;
      setAllOrdersData(data || []);
      const processed = processData(data || []);
      setSummary(processed);
    } catch (error) {
      toast.error("Chyba při načítání dat zakázek.");
      console.error("DataContext: Chyba při načítání dat:", error);
      setAllOrdersData([]);
      setSummary(null);
    } finally {
      setIsLoadingData(false);
    }
  }, [supabase]);

  useEffect(() => {
    if (currentUser && !authLoading) {
      fetchData();
    } else if (!currentUser && !authLoading) {
      setAllOrdersData([]);
      setSummary(null);
      setIsLoadingData(false);
    }
  }, [currentUser, authLoading, fetchData]);

  const handleFileUpload = useCallback(async (file) => {
    if (!file || typeof window.XLSX === 'undefined') return;
    toast.loading('Zpracovávám soubor zakázek...');
    
    const parseExcelDate = (excelDate) => {
        if (typeof excelDate === 'number') {
            return new Date((excelDate - 25569) * 86400 * 1000).toISOString();
        }
        return null;
    };

    const reader = new FileReader();
    reader.onload = async (evt) => {
        try {
            const bstr = evt.target.result;
            const wb = XLSX.read(bstr, { type: 'binary' });
            const wsname = wb.SheetNames[0];
            const ws = wb.Sheets[wsname];
            const jsonData = XLSX.utils.sheet_to_json(ws);

            const transformedData = jsonData.map(row => ({
                "Delivery No": String(row["Delivery No"] || row["Delivery"] || '').trim(),
                "Status": Number(row["Status"]),
                "del.type": row["del.type"],
                "Loading Date": parseExcelDate(row["Loading Date"]),
                "Note": row["Note"] || "",
                "Forwarding agent name": row["Forwarding agent name"],
                "Name of ship-to party": row["Name of ship-to party"],
                "Total Weight": row["Total Weight"],
                "Bill of lading": row["Bill of lading"],
                "Country ship-to prty": row["Country ship-to prty"],
                "created_at": new Date().toISOString(),
                "updated_at": new Date().toISOString(),
            })).filter(row => row["Delivery No"]);

            if (transformedData.length > 0) {
              const { error } = await supabase.from('deliveries').upsert(transformedData, { onConflict: 'Delivery No' });
              if (error) throw error;
              toast.dismiss();
              toast.success(`Data byla úspěšně nahrána! (${transformedData.length} záznamů)`);
              fetchData();
            } else {
              toast.dismiss();
              toast.error('Nenalezena žádná platná data k nahrání.');
            }
        } catch (error) {
            console.error('Chyba při nahrávání souboru:', error);
            toast.dismiss();
            toast.error(`Chyba při nahrávání dat: ${error.message}`);
        }
    };
    reader.readAsBinaryString(file);
  }, [supabase, fetchData]);
  
  const handleErrorLogUpload = useCallback(async (file) => {
    if (!file || typeof window.XLSX === 'undefined') return;
    toast.loading('Zpracovávám soubor s chybami...');
    setIsLoadingErrorData(true);

    const reader = new FileReader();
    reader.onload = (evt) => {
        try {
            const bstr = evt.target.result;
            const wb = XLSX.read(bstr, { type: 'binary' });
            const wsname = wb.SheetNames[0];
            const ws = wb.Sheets[wsname];
            const jsonData = XLSX.utils.sheet_to_json(ws);
            
            setErrorLogData(jsonData);
            const processedErrors = processErrorLogData(jsonData);
            setErrorSummary(processedErrors);
            toast.dismiss();
            toast.success('Log s chybami byl úspěšně načten a zpracován.');
        } catch (error) {
            console.error('Chyba při zpracování error logu:', error);
            toast.dismiss();
            toast.error(`Chyba při zpracování souboru: ${error.message}`);
        } finally {
            setIsLoadingErrorData(false);
        }
    };
    reader.readAsBinaryString(file);
  }, []);


  const value = useMemo(() => ({
    allOrdersData,
    summary,
    isLoadingData,
    refetchData: fetchData,
    handleFileUpload,
    selectedOrderDetails,
    setSelectedOrderDetails,
    supabase,
    errorLogData,
    errorSummary,
    isLoadingErrorData,
    handleErrorLogUpload,
  }), [allOrdersData, summary, isLoadingData, fetchData, handleFileUpload, selectedOrderDetails, supabase, errorLogData, errorSummary, isLoadingErrorData, handleErrorLogUpload]);

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
};