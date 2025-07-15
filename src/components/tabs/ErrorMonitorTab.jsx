import React, { useState, useRef, useCallback } from 'react';
import { processErrorData } from '@/lib/errorMonitorProcessor';
import { Card, Title, Text, Button, BarChart, Grid, TextInput } from '@tremor/react';
import { UploadCloud, AlertCircle, SearchIcon } from 'lucide-react';
import toast from 'react-hot-toast';

const ErrorMonitorTab = () => {
  const [errorData, setErrorData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const fileInputRef = useRef(null);

  const handleFileUpload = useCallback(async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setIsLoading(true);
    setErrorData(null);
    toast.loading('Zpracovávám soubor...');

    try {
      const processedData = await processErrorData(file);
      setErrorData(processedData);
      toast.dismiss();
      toast.success('Analýza chyb je připravena!');
    } catch (error) {
      toast.dismiss();
      toast.error(error.message || 'Nepodařilo se zpracovat soubor.');
    } finally {
      setIsLoading(false);
      if(fileInputRef.current) fileInputRef.current.value = "";
    }
  }, []);

  const StyledCard = ({ children, className = '' }) => (
    <div className={`bg-slate-800/60 border border-slate-700 rounded-lg p-4 sm:p-6 shadow-md ${className}`}>
        {children}
    </div>
  );

  // Filtrování dat pro tabulku
  const filteredErrors = errorData?.detailedErrors.filter(error =>
    Object.values(error).some(value =>
      String(value).toLowerCase().includes(searchQuery.toLowerCase())
    )
  ) || [];

  return (
    <div className="p-4 sm:p-6 bg-slate-950 min-h-full text-slate-300">
      <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
        <h1 className="text-2xl font-semibold text-white">Analýza Chyb Skenování</h1>
        <Button
          onClick={() => fileInputRef.current?.click()}
          loading={isLoading}
          icon={UploadCloud}
          color="teal"
        >
          Nahrát report chyb (.xlsx)
        </Button>
        <input
          type="file"
          accept=".xlsx, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
          onChange={handleFileUpload}
          ref={fileInputRef}
          className="hidden"
        />
      </div>

      {errorData ? (
        <div className="space-y-6">
          {/* KPI Karty */}
          <Grid numItemsLg={3} className="gap-6">
            <StyledCard>
                <Text className="text-slate-400">Celkem chyb</Text>
                <p className="text-3xl font-semibold text-white">{errorData.summaryMetrics.totalErrors}</p>
            </StyledCard>
            <StyledCard>
                <Text className="text-slate-400">Nejčastější typ chyby</Text>
                <p className="text-3xl font-semibold text-teal-400 truncate" title={errorData.summaryMetrics.mostCommonError}>{errorData.summaryMetrics.mostCommonError}</p>
            </StyledCard>
            <StyledCard>
                <Text className="text-slate-400">Uživatel s nejvíce chybami</Text>
                <p className="text-3xl font-semibold text-white">{errorData.summaryMetrics.userWithMostErrors}</p>
            </StyledCard>
          </Grid>
          
          {/* Grafy */}
          <Grid numItemsLg={2} className="gap-6">
            <StyledCard>
                <Title className="text-white">Nejčastější chyby (TOP 10)</Title>
                <BarChart className="mt-4 h-80" data={errorData.chartsData.errorsByType.slice(0, 10)} index="name" categories={['Počet chyb']} colors={['cyan']} yAxisWidth={120} layout="vertical" />
            </StyledCard>
            <StyledCard>
                <Title className="text-white">Chyby podle uživatele</Title>
                <BarChart className="mt-4 h-80" data={errorData.chartsData.errorsByUser} index="name" categories={['Počet chyb']} colors={['teal']} />
            </StyledCard>
          </Grid>

          <StyledCard>
            <Title className="text-white">Materiály s největším rozdílem v množství</Title>
            <BarChart className="mt-4 h-80" data={errorData.chartsData.topMaterialDiscrepancy} index="name" categories={['Absolutní rozdíl']} colors={['amber']} />
          </StyledCard>

          {/* Tabulka s detaily */}
          <StyledCard>
            <div className='flex justify-between items-center mb-4'>
                <Title className="text-white">Detailní přehled chyb</Title>
                <TextInput icon={SearchIcon} placeholder="Hledat v záznamech..." value={searchQuery} onValueChange={setSearchQuery} className="max-w-xs" />
            </div>
            <div className="overflow-x-auto h-[500px]">
              <table className="min-w-full">
                <thead className="sticky top-0 bg-slate-800 border-b border-slate-700">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Čas</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Typ Chyby</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Uživatel</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Materiál</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Pozice</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Číslo zakázky</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Rozdíl množství</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {filteredErrors.map((error, idx) => (
                    <tr key={idx} className="hover:bg-slate-800/50">
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-slate-400">{new Date(error.timestamp).toLocaleString('cs-CZ')}</td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-teal-400">{error.errorType}</td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-white">{error.user}</td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-slate-400">{error.material}</td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-slate-400">{error.position}</td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-slate-400">{error.orderNumber}</td>
                      <td className={`px-4 py-4 whitespace-nowrap text-sm font-bold ${error.qtyDifference !== 0 ? 'text-amber-500' : 'text-slate-500'}`}>{error.qtyDifference}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </StyledCard>
        </div>
      ) : (
        // Placeholder, když nejsou nahrána žádná data
        <div className="flex items-center justify-center h-[60vh] border-2 border-dashed border-slate-700 rounded-xl">
             <div className='text-center'>
                <AlertCircle className="h-16 w-16 text-slate-600 mb-4 mx-auto" />
                <Title className="text-slate-500">Žádná data k zobrazení</Title>
                <Text className="text-slate-600">Nahrajte prosím report chyb pro zobrazení analýzy.</Text>
             </div>
        </div>
      )}
    </div>
  );
};

export default ErrorMonitorTab;