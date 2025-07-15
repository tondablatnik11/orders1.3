import React, { useState, useRef } from 'react';
import { processErrorLog } from '@/lib/errorMonitorProcessor';
import { Card, Title, Text, Button, DonutChart, BarChart, Grid, Col } from '@tremor/react';
import { UploadCloud, AlertCircle } from 'lucide-react';

const ErrorMonitorTab = () => {
  const [errorData, setErrorData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const fileInputRef = useRef(null);

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setIsLoading(true);
    setErrorMessage('');
    setErrorData(null);

    try {
      const data = await processErrorLog(file);
      setErrorData(data);
    } catch (error) {
      setErrorMessage(error.message || 'Nepodařilo se zpracovat soubor. Zkontrolujte prosím formát a obsah souboru.');
    } finally {
      setIsLoading(false);
      // Reset file inputu pro možnost nahrát stejný soubor znovu
      if(fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleButtonClick = () => {
    fileInputRef.current?.click();
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
    <div className="p-6 bg-gray-50 min-h-full">
      <div className="flex justify-between items-center mb-6">
        <Title>Monitoring Chyb Aplikace</Title>
        <input
          type="file"
          accept=".csv"
          onChange={handleFileUpload}
          ref={fileInputRef}
          className="hidden"
        />
        <Button
          onClick={handleButtonClick}
          loading={isLoading}
          icon={UploadCloud}
          color="red"
        >
          Nahrát log chyb
        </Button>
      </div>

      {errorMessage && (
        <Card className="mb-6 bg-red-100 border-red-500">
          <div className="flex items-center">
            <AlertCircle className="h-5 w-5 text-red-700 mr-3" />
            <Text className="text-red-800">{errorMessage}</Text>
          </div>
        </Card>
      )}

      {errorData ? (
        <div className="space-y-6">
          {/* Souhrnné karty */}
          <Grid numItemsLg={3} className="gap-6">
            <Card>
                <Text>Celkem chyb</Text>
                <p className="text-3xl font-semibold">{errorData.summaryMetrics.totalErrors}</p>
            </Card>
            <Card>
                <Text>Unikátní typy chyb</Text>
                <p className="text-3xl font-semibold">{errorData.summaryMetrics.uniqueErrorTypes}</p>
            </Card>
            <Card>
                <Text>Vysoká priorita</Text>
                <p className="text-3xl font-semibold">{errorData.summaryMetrics.totalHighPriority}</p>
            </Card>
          </Grid>
          
          {/* Grafy */}
          <Grid numItemsLg={2} className="gap-6">
            <Card>
              <Title>Chyby podle Priority</Title>
              <BarChart
                className="mt-4 h-72"
                data={errorData.chartsData.errorsByPriority}
                index="name"
                categories={['value']}
                colors={['red']}
                yAxisWidth={48}
                showLegend={false}
              />
            </Card>
            <Card>
              <Title>Chyby podle Stavu</Title>
               <DonutChart
                className="mt-4 h-72"
                data={errorData.chartsData.errorsByStatus}
                category="value"
                index="name"
                colors={['cyan', 'blue', 'indigo']}
              />
            </Card>
          </Grid>

           <Card>
              <Title>Chyby podle Aplikační Oblasti</Title>
              <BarChart
                className="mt-4 h-80"
                data={errorData.chartsData.errorsByArea}
                index="name"
                categories={['value']}
                colors={['orange']}
                yAxisWidth={100}
                layout="vertical"
              />
            </Card>

          {/* Detailní tabulka chyb */}
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
                  {errorData.detailedErrors.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)).map((error) => (
                    <tr key={error.id}>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <span className={`inline-block h-4 w-4 rounded-full ${priorityColor(error.priority)}`} title={error.priority}></span>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(error.timestamp).toLocaleString('cs-CZ')}</td>
                      <td className="px-4 py-4 text-sm text-gray-900 max-w-sm truncate">{error.description}</td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">{error.status}</td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">{error.user}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      ) : (
        <Card className="flex flex-col items-center justify-center h-96 border-dashed border-2">
            <UploadCloud className="h-16 w-16 text-gray-400 mb-4" />
            <Title className="text-gray-600">Žádná data k zobrazení</Title>
            <Text className="text-gray-500">Nahrajte prosím soubor s logem chyb pro zobrazení analýzy.</Text>
        </Card>
      )}
    </div>
  );
};

export default ErrorMonitorTab;