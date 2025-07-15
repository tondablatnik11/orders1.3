import React, { useState, useRef, useEffect, useCallback } from 'react';
import { processErrorData } from '@/lib/errorMonitorProcessor';
import { supabase } from '@/lib/supabaseClient'; 
import { Card, Title, Text, Button, DonutChart, BarChart, Grid } from '@tremor/react';
import { UploadCloud, AlertCircle, RefreshCw } from 'lucide-react';

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
        // Zpracování souboru
        dataToProcess = source;
      } else {
        // Načtení dat ze Supabase
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
      setErrorData(null); // Vyčistit stará data při chybě
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Prvotní načtení dat z databáze při zobrazení komponenty
  useEffect(() => {
    fetchAndProcessData();
  }, [fetchAndProcessData]);

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      fetchAndProcessData(file);
    }
    // Reset file inputu
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
      {/* Hlavička */}
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

      {/* Chybová zpráva */}
      {errorMessage && (
        <Card className="mb-6 bg-red-100 border-red-500">
          <div className="flex items-center">
            <AlertCircle className="h-5 w-5 text-red-700 mr-3 shrink-0" />
            <Text className="text-red-800">{errorMessage}</Text>
          </div>
        </Card>
      )}

      {/* Dashboard s daty */}
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
        // Stav při načítání nebo pokud nejsou žádná data
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