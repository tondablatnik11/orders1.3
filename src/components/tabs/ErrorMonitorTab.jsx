import React, { useState, useRef } from 'react';
import { useData } from '@/contexts/DataContext';
import { Card, Title, Text, Button, BarChart, Grid, TextInput } from '@tremor/react';
import { RefreshCw, SearchIcon, BarChart3, Users, AlertTriangle, UploadCloud } from 'lucide-react';

const ErrorMonitorTab = () => {
  const { errorData, isLoadingErrorData, refetchErrorData, handleErrorLogUpload } = useData();
  const [searchQuery, setSearchQuery] = useState('');
  const fileInputRef = useRef(null);

  const handleFileChange = (event) => {
      const file = event.target.files[0];
      if (file) {
          handleErrorLogUpload(file);
      }
      // Reset inputu, aby bylo možné nahrát stejný soubor znovu
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
  };

  const KpiCard = ({ title, value, icon }) => (
    <Card className="shadow-lg">
      <div className="flex items-center gap-4">
        <div className={`p-3 bg-slate-100 rounded-lg`}>{icon}</div>
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
        <div className="flex items-center gap-2">
            <Button onClick={() => fileInputRef.current?.click()} icon={UploadCloud} size="lg">Nahrát Report</Button>
            <Button onClick={refetchErrorData} loading={isLoadingErrorData} icon={RefreshCw} size="lg" variant="secondary">Aktualizovat</Button>
        </div>
        <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept=".xlsx" />
      </div>

      {isLoadingErrorData ? (
          <div className="flex justify-center items-center h-96">
            <RefreshCw className="w-10 h-10 text-slate-500 animate-spin" />
          </div>
      ) : errorData && errorData.detailedErrors.length > 0 ? (
        <div className="space-y-6">
          <Grid numItemsLg={3} className="gap-6">
            <KpiCard title="Celkem chyb" value={errorData.summaryMetrics.totalErrors} icon={<BarChart3 className="w-6 h-6 text-blue-500"/>} />
            <KpiCard title="Nejčastější chyba" value={errorData.summaryMetrics.mostCommonError} icon={<AlertTriangle className="w-6 h-6 text-amber-500"/>} />
            <KpiCard title="Nejaktivnější uživatel" value={errorData.summaryMetrics.userWithMostErrors} icon={<Users className="w-6 h-6 text-fuchsia-500"/>} />
          </Grid>
          
          <Grid numItemsLg={5} className="gap-6">
            <Card className="lg:col-span-3 shadow-lg">
                <Title>TOP 10 Typů Chyb</Title>
                <div className="mt-6 h-80">
                    <BarChart 
                        data={errorData.chartsData.errorsByType.slice(0, 10)} 
                        index="name" 
                        categories={['Počet chyb']} 
                        colors={['blue']} 
                        yAxisWidth={130} 
                        layout="vertical" 
                    />
                </div>
            </Card>
            <Card className="lg:col-span-2 shadow-lg">
                <Title>Chyby podle uživatele</Title>
                <div className="mt-6 h-80">
                    <BarChart 
                        data={errorData.chartsData.errorsByUser} 
                        index="name" 
                        categories={['Počet chyb']} 
                        colors={['fuchsia']} 
                    />
                </div>
            </Card>
          </Grid>
          
          <Grid numItemsLg={2} className="gap-6">
             <Card className="shadow-lg">
                <Title>TOP 10 Chybových Pozic</Title>
                <div className="mt-6 h-80">
                    <BarChart 
                        data={errorData.chartsData.errorsByPosition.slice(0, 10)} 
                        index="name" 
                        categories={['Počet chyb']} 
                        colors={['violet']} 
                    />
                </div>
             </Card>
             <Card className="shadow-lg">
                <Title>Materiály s největším rozdílem</Title>
                <div className="mt-6 h-80">
                    <BarChart 
                        data={errorData.chartsData.topMaterialDiscrepancy} 
                        index="name" 
                        categories={['Absolutní rozdíl']} 
                        colors={['amber']} 
                    />
                </div>
             </Card>
          </Grid>

          <Card className="shadow-lg">
            <div className='flex justify-between items-center mb-4'>
                <Title>Detailní záznamy chyb</Title>
                <TextInput icon={SearchIcon} placeholder="Hledat v záznamech..." value={searchQuery} onValueChange={setSearchQuery} className="max-w-xs" />
            </div>
            <div className="overflow-y-auto h-[500px] border-t">
              <table className="min-w-full">
                <thead className="sticky top-0 bg-blue-600 border-b border-blue-700 z-10">
                  <tr>
                    <th className="p-4 text-left text-xs font-semibold text-white uppercase tracking-wider">Čas</th>
                    <th className="p-4 text-left text-xs font-semibold text-white uppercase tracking-wider">Typ Chyby</th>
                    <th className="p-4 text-left text-xs font-semibold text-white uppercase tracking-wider">Uživatel</th>
                    <th className="p-4 text-left text-xs font-semibold text-white uppercase tracking-wider">Materiál</th>
                    <th className="p-4 text-left text-xs font-semibold text-white uppercase tracking-wider">Pozice</th>
                    <th className="p-4 text-left text-xs font-semibold text-white uppercase tracking-wider">Číslo zakázky</th>
                    <th className="p-4 text-left text-xs font-semibold text-white uppercase tracking-wider">Rozdíl</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {filteredErrors.map((error, idx) => (
                    <tr key={idx} className="hover:bg-slate-50 transition-colors duration-150">
                      <td className="p-4 whitespace-nowrap text-sm text-slate-500">{new Date(error.timestamp).toLocaleString('cs-CZ')}</td>
                      <td className="p-4 whitespace-nowrap text-sm text-blue-600 font-medium">{error.errorType}</td>
                      <td className="p-4 whitespace-nowrap text-sm text-slate-800 font-medium">{error.user}</td>
                      <td className="p-4 whitespace-nowrap text-sm text-slate-600">{error.material}</td>
                      <td className="p-4 whitespace-nowrap text-sm text-slate-600">{error.position}</td>
                      <td className="p-4 whitespace-nowrap text-sm text-slate-600">{error.orderNumber}</td>
                      <td className={`p-4 whitespace-nowrap text-sm font-bold ${error.qtyDifference !== 0 ? 'text-amber-600' : 'text-slate-400'}`}>{error.qtyDifference}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      ) : (
        <div className="flex items-center justify-center h-[60vh]">
            <Text>Žádná data k zobrazení. Zkuste aktualizovat nebo nahrát nový report.</Text>
        </div>
      )}
    </div>
  );
};

export default ErrorMonitorTab;