/** @type {import('tailwindcss').Config} /
module.exports = {
content: [
'./src/pages/**/.{js,ts,jsx,tsx,mdx}',
'./src/components//*.{js,ts,jsx,tsx,mdx}',
'./src/app//.{js,ts,jsx,tsx,mdx}',
'./node_modules/@tremor/**/.{js,ts,jsx,tsx}',
],
theme: {
transparent: 'transparent',
current: 'currentColor',
extend: {
colors: {
// Nová paleta barev pro Tremor
tremor: {
brand: {
faint: '#eff6ff', // blue-50
muted: '#bfdbfe', // blue-200
subtle: '#60a5fa', // blue-400
DEFAULT: '#3b82f6', // blue-500
emphasis: '#1d4ed8', // blue-700
inverted: '#ffffff', // white
},
background: {
muted: '#f9fafb', // gray-50
subtle: '#f3f4f6', // gray-100
DEFAULT: '#ffffff', // white
emphasis: '#374151', // gray-700
},
border: {
DEFAULT: '#e5e7eb', // gray-200
},
ring: {
DEFAULT: '#e5e7eb', // gray-200
},
content: {
subtle: '#9ca3af', // gray-400
DEFAULT: '#6b7280', // gray-500
emphasis: '#374151', // gray-700
strong: '#111827', // gray-900
inverted: '#ffffff', // white
},
},
// Nová paleta pro tmavý režim
'dark-tremor': {
brand: {
faint: '#0b1229', // custom
muted: '#172554', // blue-950
subtle: '#1e40af', // blue-800
DEFAULT: '#3b82f6', // blue-500
emphasis: '#60a5fa', // blue-400
inverted: '#030712', // gray-950
},
background: {
muted: '#131A2B', // custom
subtle: '#1f2937', // gray-800
DEFAULT: '#111827', // gray-900
emphasis: '#d1d5db', // gray-300
},
border: {
DEFAULT: '#1f2937', // gray-800
},
ring: {
DEFAULT: '#1f2937', // gray-800
},
content: {
subtle: '#4b5563', // gray-600
DEFAULT: '#6b7280', // gray-500
emphasis: '#e5e7eb', // gray-200
strong: '#f9fafb', // gray-50
inverted: '#000000', // black
},
},
},
boxShadow: {
// stíny pro světlý režim
'tremor-input': '0 1px 2px 0 rgb(0 0 0 / 0.05)',
'tremor-card': '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
'tremor-dropdown': '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
// stíny pro tmavý režim
'dark-tremor-input': '0 1px 2px 0 rgb(0 0 0 / 0.05)',
'dark-tremor-card': '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
'dark-tremor-dropdown': '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
},
borderRadius: {
'tremor-small': '0.375rem',
'tremor-default': '0.5rem',
'tremor-full': '9999px',
},
fontSize: {
'tremor-label': ['0.75rem', { lineHeight: '1rem' }],
'tremor-default': ['0.875rem', { lineHeight: '1.25rem' }],
'tremor-title': ['1.125rem', { lineHeight: '1.75rem' }],
'tremor-metric': ['1.875rem', { lineHeight: '2.25rem' }],
},
},
},
safelist: [
{
pattern:
/^(bg-(?:slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-(?:50|100|200|300|400|500|600|700|800|900|950))$/,
variants: ['hover', 'ui-selected'],
},
{
pattern:
/^(text-(?:slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-(?:50|100|200|300|400|500|600|700|800|900|950))$/,
variants: ['hover', 'ui-selected'],
},
{
pattern:
/^(border-(?:slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-(?:50|100|200|300|400|500|600|700|800|900|950))$/,
variants: ['hover', 'ui-selected'],
},
{
pattern:
/^(ring-(?:slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-(?:50|100|200|300|400|500|600|700|800|900|950))$/,
},
{
pattern:
/^(stroke-(?:slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-(?:50|100|200|300|400|500|600|700|800|900|950))$/,
},
{
pattern:
/^(fill-(?:slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-(?:50|100|200|300|400|500|600|700|800|900|950))$/,
},
],
plugins: [require('@headlessui/tailwindcss'), require('@tailwindcss/forms')],
}&lt;hr&gt;
&lt;h2 id=&quot;krok-2-finalni-verze-errormonitortab-jsx&quot;&gt;Krok 2: Finální verze &lt;code&gt;ErrorMonitorTab.jsx&lt;/code&gt;&lt;/h2&gt;
&lt;p&gt;Tento kód je nyní zjednodušený. Místo ručního nastavování barev bude plně respektovat profesionální styly, které jsme definovali v kroku 1.&lt;/p&gt;
&lt;pre&gt;&lt;code class=&quot;language-jsx&quot;&gt;import React, { useState, useRef, useCallback } from &#39;react&#39;;
import { processErrorData } from &#39;@/lib/errorMonitorProcessor&#39;;
import { Card, Title, Text, Button, BarChart, Grid, TextInput } from &#39;@tremor/react&#39;;
import { UploadCloud, AlertCircle, SearchIcon, BarChart3, Users, AlertTriangle } from &#39;lucide-react&#39;;
import toast from &#39;react-hot-toast&#39;;

const ErrorMonitorTab = () =\> {
const [errorData, setErrorData] = useState(null);
const [isLoading, setIsLoading] = useState(false);
const [searchQuery, setSearchQuery] = useState('');
const fileInputRef = useRef(null);

const handleFileUpload = useCallback(async (event) =\> {
const file = event.target.files[0];
if (\!file) return;

setIsLoading(true);
setErrorData(null);
toast.loading('Zpracovávám soubor...');try {
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

const KpiCard = ({ title, value, icon }) =\> (
\<Card\>
\<div className="flex items-center gap-4"\>
\<div className={`p-3 bg-tremor-background-subtle dark:bg-dark-tremor-background-subtle rounded-lg border border-tremor-border dark:border-dark-tremor-border`}\>
{icon}
\</div\>
\<div\>
\<Text\>{title}\</Text\>
\<p className={`text-2xl font-bold text-tremor-content-strong dark:text-dark-tremor-content-strong truncate`} title={value}\>{value}\</p\>
\</div\>
\</div\>
\</Card\>
);

const filteredErrors = errorData?.detailedErrors.filter(error =\>
Object.values(error).some(value =\>
String(value).toLowerCase().includes(searchQuery.toLowerCase())
)
) || [];

return (
\<div className="p-4 sm:p-6 bg-tremor-background-muted dark:bg-dark-tremor-background-muted min-h-full"\>
\<div className="flex flex-wrap justify-between items-center gap-4 mb-8"\>
\<Title className="text-tremor-content-strong dark:text-dark-tremor-content-strong"\>Analýza Chyb Skenování\</Title\>
\<Button
onClick={() =\> fileInputRef.current?.click()}
loading={isLoading}
icon={UploadCloud}
size="lg"
\>
Nahrát Report (.xlsx)
\</Button\>
\<input
type="file"
accept=".xlsx, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
onChange={handleFileUpload}
ref={fileInputRef}
className="hidden"
/\>
\</div\>

{errorData ? (

  &lt;Grid numItemsLg={5} className=&quot;gap-6&quot;&gt;
    &lt;Card className=&quot;lg:col-span-3&quot;&gt;
        &lt;Title&gt;TOP 10 Typů Chyb&lt;/Title&gt;
        &lt;BarChart className=&quot;mt-6 h-80&quot; data={errorData.chartsData.errorsByType.slice(0, 10)} index=&quot;name&quot; categories={['Počet chyb']} colors={['blue']} yAxisWidth={130} layout=&quot;vertical&quot; /&gt;
    &lt;/Card&gt;
    &lt;Card className=&quot;lg:col-span-2&quot;&gt;
        &lt;Title&gt;Chyby podle uživatele&lt;/Title&gt;
        &lt;BarChart className=&quot;mt-6 h-80&quot; data={errorData.chartsData.errorsByUser} index=&quot;name&quot; categories={['Počet chyb']} colors={['fuchsia']} /&gt;
    &lt;/Card&gt;
  &lt;/Grid&gt;

  &lt;Card&gt;
    &lt;Title&gt;Materiály s největším rozdílem v množství&lt;/Title&gt;
    &lt;BarChart className=&quot;mt-6 h-80&quot; data={errorData.chartsData.topMaterialDiscrepancy} index=&quot;name&quot; categories={['Absolutní rozdíl']} colors={['amber']} /&gt;
  &lt;/Card&gt;

  &lt;Card&gt;
    &lt;div className='flex justify-between items-center mb-4'&gt;
        &lt;Title&gt;Detailní záznamy chyb&lt;/Title&gt;
        &lt;TextInput icon={SearchIcon} placeholder=&quot;Hledat v záznamech...&quot; value={searchQuery} onValueChange={setSearchQuery} className=&quot;max-w-xs&quot; /&gt;
    &lt;/div&gt;
    &lt;div className=&quot;overflow-y-auto h-[500px] border-t&quot;&gt;
      &lt;table className=&quot;min-w-full&quot;&gt;
        &lt;thead className=&quot;sticky top-0 bg-tremor-background dark:bg-dark-tremor-background border-b border-tremor-border dark:border-dark-tremor-border z-10&quot;&gt;
          &lt;tr&gt;
            &lt;th className=&quot;p-4 text-left text-xs font-semibold text-tremor-content dark:text-dark-tremor-content uppercase tracking-wider&quot;&gt;Čas&lt;/th&gt;
            &lt;th className=&quot;p-4 text-left text-xs font-semibold text-tremor-content dark:text-dark-tremor-content uppercase tracking-wider&quot;&gt;Typ Chyby&lt;/th&gt;
            &lt;th className=&quot;p-4 text-left text-xs font-semibold text-tremor-content dark:text-dark-tremor-content uppercase tracking-wider&quot;&gt;Uživatel&lt;/th&gt;
            &lt;th className=&quot;p-4 text-left text-xs font-semibold text-tremor-content dark:text-dark-tremor-content uppercase tracking-wider&quot;&gt;Materiál&lt;/th&gt;
            &lt;th className=&quot;p-4 text-left text-xs font-semibold text-tremor-content dark:text-dark-tremor-content uppercase tracking-wider&quot;&gt;Pozice&lt;/th&gt;
            &lt;th className=&quot;p-4 text-left text-xs font-semibold text-tremor-content dark:text-dark-tremor-content uppercase tracking-wider&quot;&gt;Číslo zakázky&lt;/th&gt;
            &lt;th className=&quot;p-4 text-left text-xs font-semibold text-tremor-content dark:text-dark-tremor-content uppercase tracking-wider&quot;&gt;Rozdíl&lt;/th&gt;
          &lt;/tr&gt;
        &lt;/thead&gt;
        &lt;tbody className=&quot;divide-y divide-tremor-border dark:divide-dark-tremor-border&quot;&gt;
          {filteredErrors.map((error, idx) =&gt; (
            &lt;tr key={idx} className=&quot;hover:bg-tremor-background-subtle dark:hover:bg-dark-tremor-background-subtle transition-colors duration-150&quot;&gt;
              &lt;td className=&quot;p-4 whitespace-nowrap text-sm text-tremor-content&quot;&gt;{new Date(error.timestamp).toLocaleString('cs-CZ')}&lt;/td&gt;
              &lt;td className=&quot;p-4 whitespace-nowrap text-sm text-tremor-brand font-medium&quot;&gt;{error.errorType}&lt;/td&gt;
              &lt;td className=&quot;p-4 whitespace-nowrap text-sm text-tremor-content-strong dark:text-dark-tremor-content-strong&quot;&gt;{error.user}&lt;/td&gt;
              &lt;td className=&quot;p-4 whitespace-nowrap text-sm text-tremor-content&quot;&gt;{error.material}&lt;/td&gt;
              &lt;td className=&quot;p-4 whitespace-nowrap text-sm text-tremor-content&quot;&gt;{error.position}&lt;/td&gt;
              &lt;td className=&quot;p-4 whitespace-nowrap text-sm text-tremor-content&quot;&gt;{error.orderNumber}&lt;/td&gt;
              &lt;td className={`p-4 whitespace-nowrap text-sm font-bold ${error.qtyDifference !== 0 ? 'text-amber-600' : 'text-slate-400'}`}&gt;{error.qtyDifference}&lt;/td&gt;
            &lt;/tr&gt;
          ))}
        &lt;/tbody&gt;
      &lt;/table&gt;
    &lt;/div&gt;
  &lt;/Card&gt;
&lt;/div&gt;
) : (




)}

);
};

export default ErrorMonitorTab;