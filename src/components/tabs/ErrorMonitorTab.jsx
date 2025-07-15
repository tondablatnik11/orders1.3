import React, { useState, useRef, useEffect, useCallback } from 'react';
import { processErrorData } from '@/lib/errorMonitorProcessor';
import { getSupabase } from '@/lib/supabaseClient'; 
import { Card, Title, Text, Button, DonutChart, BarChart, Grid } from '@tremor/react';
import { UploadCloud, AlertCircle, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';

const supabase = getSupabase();

const ErrorMonitorTab = () => {
  const [errorData, setErrorData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const fileInputRef = useRef(null);

  const fetchAndProcessData = useCallback(async (source) => {
    setIsLoading(true);
    setErrorMessage('');
    
    if (source instanceof File) {
        toast.loading('Zpracovávám soubor...');
    }

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

      if (source instanceof File) {
        toast.dismiss();
        toast.success('Soubor byl úspěšně zpracován!');
      }

    } catch (error) {
      console.error("Chyba při zpracování dat:", error);
      const msg = error.message || 'Nepodařilo se načíst nebo zpracovat data o chybách.';
      setErrorMessage(msg);
      if (source instanceof File) {
          toast.dismiss();
          toast.error(msg);
      }
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
      case 'Medium': return 'bg-amber-500';
      case 'Low': return 'bg-green-500';
      default: return 'bg-slate-600';
    }
  };

  // Vlastní komponenta pro kartu s novým designem
  const StyledCard = ({ children, className = '' }) => (
    <div className={`bg-sky-900/50 border border-cyan-400/10 rounded-xl p-4 sm:p-6 shadow-lg shadow-cyan-900/10 ${className}`}>
        {children}
    </div>
  );

  return (
    <div className="p-4 sm:p-6 bg-sky-950 min-h-full text-slate-300">
      <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
        <h1 className="text-2xl font-semibold text-cyan-400">Monitoring Chyb Aplikace</h1>
        <div className="flex items-center gap-2">
            <input
              type="file"
              accept=".xlsx, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
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
              Nahrát log chyb (.xlsx)
            </Button>
            <Button
              onClick={handleRefreshClick}
              loading={isLoading}
              icon={RefreshCw}
              color="cyan"
            >
              Aktualizovat
            </Button>
        </div>
      </div>

      {errorMessage && !isLoading && (
        <StyledCard className="bg-red-900/20 border-red-500/30">
          <div className="flex items-center">
            <AlertCircle className="h-5 w-5 text-red-500 mr-3 shrink-0" />
            <span className="text-red-400">{errorMessage}</span>
          </div>
        </StyledCard>
      )}

      {!isLoading && errorData && errorData.detailedErrors.length > 0 ? (
        <div className="space-y-6">
          <Grid numItemsLg={3} className="gap-6">
            <StyledCard>
                <Text className="text-sky-200">Celkem chyb</Text>
                <p className="text-3xl font-semibold text-white">{errorData.summaryMetrics.totalErrors}</p>
            </StyledCard>
            <StyledCard>
                <Text className="text-sky-200">Unikátní typy chyb</Text>
                <p className="text-3xl font-semibold text-white">{errorData.summaryMetrics.uniqueErrorTypes}</p>
            </StyledCard>
            <StyledCard>
                <Text className="text-sky-200">Vysoká priorita</Text>
                <p className="text-3xl font-semibold text-red-500">{errorData.summaryMetrics.totalHighPriority}</p>
            </StyledCard>
          </Grid>
          
          <Grid numItemsLg={5} className="gap-6">
            <StyledCard className="lg:col-span-3">
                <Title className="text-white">Chyby podle Aplikační Oblasti</Title>
                <BarChart className="mt-4 h-80" data={errorData.chartsData.errorsByArea} index="name" categories={['value']} colors={['cyan']} yAxisWidth={100} layout="vertical" />
            </StyledCard>
            <StyledCard className="lg:col-span-2">
                <Title className="text-white">Chyby podle Priority</Title>
                <DonutChart className="mt-10 h-64" data={errorData.chartsData.errorsByPriority} category="value" index="name" colors={['red-600', 'amber-500', 'green-600']} />
            </StyledCard>
          </Grid>

          <StyledCard>
            <Title className="text-white">Detailní přehled chyb</Title>
            <div className="overflow-x-auto mt-4">
              <table className="min-w-full">
                <thead className="border-b-2 border-sky-800">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-sky-300 uppercase tracking-wider">Priorita</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-sky-300 uppercase tracking-wider">Čas</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-sky-300 uppercase tracking-wider">Popis chyby</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-sky-300 uppercase tracking-wider">Stav</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-sky-300 uppercase tracking-wider">Uživatel</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-sky-900">
                  {errorData.detailedErrors.map((error) => (
                    <tr key={error.id} className="hover:bg-sky-900">
                      <td className="px-4 py-4 whitespace-nowrap"><span className={`inline-block h-4 w-4 rounded-full ring-2 ring-sky-950 ${priorityColor(error.priority)}`} title={error.priority}></span></td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-sky-300">{new Date(error.timestamp).toLocaleString('cs-CZ')}</td>
                      <td className="px-4 py-4 text-sm text-white max-w-sm truncate" title={error.description}>{error.description}</td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-sky-300">{error.status}</td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-sky-300">{error.user}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </StyledCard>
        </div>
      ) : (
        <StyledCard className="flex flex-col items-center justify-center h-96 border-dashed border-sky-800">
            {isLoading ? (
                <><RefreshCw className="h-16 w-16 text-sky-700 mb-4 animate-spin" /><Title className="text-sky-500">Načítám data...</Title></>
            ) : (
                <><AlertCircle className="h-16 w-16 text-sky-700 mb-4" /><Title className="text-sky-500">Žádná data k zobrazení</Title><Text className="text-sky-600">Nebyly nalezeny žádné záznamy o chybách.</Text></>
            )}
        </StyledCard>
      )}
    </div>
  );
};

export default ErrorMonitorTab;