import React, { useState, useRef, useCallback } from 'react';
import { processErrorData } from '@/lib/errorMonitorProcessor';
import { Card, Title, Text, Button, BarChart, Grid, TextInput } from '@tremor/react';
import { UploadCloud, AlertCircle, SearchIcon, BarChart3, Users, AlertTriangle } from 'lucide-react';
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

  const KpiCard = ({ title, value, icon }) => (
    <Card className="shadow-lg">
      <div className="flex items-center gap-4">
        <div className={`p-3 bg-slate-100 rounded-lg`}>
          {icon}
        </div>
        <div>
          <Text className="text-slate-500">{title}</Text>
          <p className={`text-2xl font-bold text-slate-800 truncate`} title={value}>{value}</p>
        </div>
      </div>
    </Card>
  );

  const filteredErrors = errorData?.detailedErrors.filter(error =>
    Object.values(error).some(value =>
      String(value).toLowerCase().includes(searchQuery.toLowerCase())
    )
  ) || [];

  return (
    <div className="p-4 sm:p-6 bg-slate-900 min-h-full">
      <div className="flex flex-wrap justify-between items-center gap-4 mb-8">
        <h1 className="text-3xl font-bold text-white tracking-tight">Analýza Chyb Skenování</h1>
        <Button
          onClick={() => fileInputRef.current?.click()}
          loading={isLoading}
          icon={UploadCloud}
          size="lg"
          color="blue"
        >
          Nahrát Report (.xlsx)
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
          <Grid numItemsLg={3} className="gap-6">
            <KpiCard title="Celkem chyb" value={errorData.summaryMetrics.totalErrors} icon={<BarChart3 className="w-6 h-6 text-blue-500"/>} />
            <KpiCard title="Nejčastější chyba" value={errorData.summaryMetrics.mostCommonError} icon={<AlertTriangle className="w-6 h-6 text-amber-500"/>} />
            <KpiCard title="Nejaktivnější uživatel" value={errorData.summaryMetrics.userWithMostErrors} icon={<Users className="w-6 h-6 text-fuchsia-500"/>} />
          </Grid>
          
          <Grid numItemsLg={5} className="gap-6">
            <Card className="lg:col-span-3 shadow-lg">
                <Title className="text-slate-800">TOP 10 Typů Chyb</Title>
                <BarChart className="mt-6 h-80" data={errorData.chartsData.errorsByType.slice(0, 10)} index="name" categories={['Počet chyb']} colors={['blue']} yAxisWidth={130} layout="vertical" />
            </Card>
            <Card className="lg:col-span-2 shadow-lg">
                <Title className="text-slate-800">Chyby podle uživatele</Title>
                <BarChart className="mt-6 h-80" data={errorData.chartsData.errorsByUser} index="name" categories={['Počet chyb']} colors={['fuchsia']} />
            </Card>
          </Grid>

          <Card className="shadow-lg">
            <Title className="text-slate-800">Materiály s největším rozdílem v množství</Title>
            <BarChart className="mt-6 h-80" data={errorData.chartsData.topMaterialDiscrepancy} index="name" categories={['Absolutní rozdíl']} colors={['amber']} />
          </Card>

          <Card className="shadow-lg">
            <div className='flex justify-between items-center mb-4'>
                <Title className="text-slate-800">Detailní záznamy chyb</Title>
                <TextInput icon={SearchIcon} placeholder="Hledat v záznamech..." value={searchQuery} onValueChange={setSearchQuery} className="max-w-xs" />
            </div>
            <div className="overflow-y-auto h-[500px] border-t">
              <table className="min-w-full">
                <thead className="sticky top-0 bg-white border-b z-10">
                  <tr>
                    <th className="p-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Čas</th>
                    <th className="p-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Typ Chyby</th>
                    <th className="p-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Uživatel</th>
                    <th className="p-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Materiál</th>
                    <th className="p-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Pozice</th>
                    <th className="p-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Číslo zakázky</th>
                    <th className="p-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Rozdíl</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filteredErrors.map((error, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50 transition-colors duration-150">
                      <td className="p-4 whitespace-nowrap text-sm text-slate-500">{new Date(error.timestamp).toLocaleString('cs-CZ')}</td>
                      <td className="p-4 whitespace-nowrap text-sm text-blue-600 font-medium">{error.errorType}</td>
                      <td className="p-4 whitespace-nowrap text-sm text-slate-800">{error.user}</td>
                      <td className="p-4 whitespace-nowrap text-sm text-slate-500">{error.material}</td>
                      <td className="p-4 whitespace-nowrap text-sm text-slate-500">{error.position}</td>
                      <td className="p-4 whitespace-nowrap text-sm text-slate-500">{error.orderNumber}</td>
                      <td className={`p-4 whitespace-nowrap text-sm font-bold ${error.qtyDifference !== 0 ? 'text-amber-600' : 'text-slate-400'}`}>{error.qtyDifference}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      ) : (
        <div className="flex items-center justify-center h-[60vh] border-2 border-dashed border-slate-800 rounded-xl bg-slate-900/50">
             <div className='text-center'>
                <AlertCircle className="h-16 w-16 text-slate-700 mb-4 mx-auto" />
                <h2 className="text-xl font-medium text-slate-500">Žádná data k zobrazení</h2>
                <p className="text-slate-600 mt-1">Nahrajte prosím report chyb pro zobrazení analýzy.</p>
             </div>
        </div>
      )}
    </div>
  );
};

export default ErrorMonitorTab;