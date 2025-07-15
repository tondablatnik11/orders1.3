import * as XLSX from 'xlsx';
import { format, parse, getDay } from 'date-fns';
import { cs } from 'date-fns/locale';

/**
 * Zpracuje nahraný XLSX soubor a vrátí data připravená pro vložení do Supabase.
 */
export const processErrorDataForSupabase = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const bstr = event.target.result;
        const workbook = XLSX.read(bstr, { type: 'binary', cellDates: true });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);
        
        const dataForSupabase = jsonData.map(row => {
          try {
            // Zpracování data a času
            const dateStr = row['Created On'];
            const timeStr = row['Time'];
            if (!dateStr || !timeStr) return null;

            const datePart = new Date(dateStr);
            if (isNaN(datePart)) return null;

            if (typeof timeStr === 'string') {
              const timeParts = timeStr.split(':');
              datePart.setHours(parseInt(timeParts[0] || 0, 10));
              datePart.setMinutes(parseInt(timeParts[1] || 0, 10));
              datePart.setSeconds(parseInt(timeParts[2] || 0, 10));
            } else if (typeof timeStr === 'number') { // Zpracování času jako desetinného čísla z Excelu
              const totalSeconds = Math.round(timeStr * 86400);
              datePart.setHours(Math.floor(totalSeconds / 3600));
              datePart.setMinutes(Math.floor((totalSeconds % 3600) / 60));
              datePart.setSeconds(totalSeconds % 60);
            }

            // Kombinace textových polí pro typ chyby
            const errorType = [row['Text'], row['Text.1']].filter(Boolean).join(' - ').trim() || 'Neznámá chyba';

            // Zpracování rozdílů v množství
            const sourceDiff = Number(row['Source bin differ.'] || 0);
            
            return {
              position: String(row['Storage Bin'] || 'N/A').trim(),
              error_type: errorType,
              material: String(row['Material'] || 'N/A').trim(),
              order_number: String(row['Dest.Storage Bin'] || 'N/A').trim(),
              qty_difference: sourceDiff,
              user: String(row['Created By'] || 'N/A').trim(),
              timestamp: datePart.toISOString(),
            };
          } catch(e) {
            console.error("Chyba při zpracování řádku:", row, e);
            return null;
          }
        }).filter(Boolean); // Odstraní řádky, kde došlo k chybě

        resolve(dataForSupabase);

      } catch (error) {
        console.error("Chyba při parsování XLSX:", error);
        reject(new Error('Nepodařilo se zpracovat XLSX soubor. Zkontrolujte formát.'));
      }
    };
    reader.onerror = () => reject(new Error('Chyba při čtení souboru.'));
    reader.readAsBinaryString(file);
  });
};


/**
 * Zpracuje pole dat (načtené ze Supabase) pro zobrazení v grafech a tabulkách.
 */
export const processArrayForDisplay = (data) => {
  if (!data || data.length === 0) return null;

  const errors = data.map(row => {
    const timestamp = new Date(row.timestamp);
    return {
      position: row.position,
      errorType: row.error_type,
      material: row.material,
      orderNumber: row.order_number,
      qtyDifference: Number(row.qty_difference) || 0,
      user: row.user,
      timestamp: row.timestamp,
      hour: format(timestamp, 'HH'),
      dayOfWeek: getDay(timestamp), // 0 = neděle, 1 = pondělí, ...
    };
  });

  const totalErrors = errors.length;
  const errorsByType = aggregate(errors, 'errorType', 'Počet chyb');
  const errorsByUser = aggregate(errors, 'user', 'Počet chyb');
  const errorsByPosition = aggregate(errors, 'position', 'Počet chyb');
  
  const errorsByHour = aggregateByTime(errors, 'hour', 24, (i) => `${String(i).padStart(2, '0')}:00`);
  const errorsByDay = aggregateByTime(errors, 'dayOfWeek', 7, (i) => format(new Date(2024, 0, i + 1), 'eeee', { locale: cs }));

  const materialDiscrepancy = errors
    .filter(e => e.qtyDifference !== 0)
    .reduce((acc, e) => {
        const material = String(e.material).trim() || 'Nezadáno';
        acc[material] = (acc[material] || 0) + Math.abs(e.qtyDifference);
        return acc;
    }, {});
  
  const topMaterialDiscrepancy = Object.entries(materialDiscrepancy)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 10)
    .map(([name, value]) => ({ name, 'Absolutní rozdíl': value }));

  const mostCommonError = errorsByType[0]?.name || 'N/A';
  const userWithMostErrors = errorsByUser[0]?.name || 'N/A';
  const materialWithMostErrors = aggregate(errors, 'material', 'Počet chyb')[0]?.name || 'N/A';
  const totalDifference = errors.reduce((sum, e) => sum + Math.abs(e.qtyDifference), 0);

  const sortedErrors = errors.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

  return {
    detailedErrors: sortedErrors,
    summaryMetrics: {
      totalErrors,
      mostCommonError,
      userWithMostErrors,
      totalDifference,
      materialWithMostErrors,
    },
    chartsData: {
      errorsByType,
      errorsByUser,
      topMaterialDiscrepancy,
      errorsByPosition,
      errorsByHour,
      errorsByDay,
    }
  };
};

// Vylepšená agregační funkce
const aggregate = (data, key, metricName) => {
    const aggregation = data.reduce((acc, item) => {
        let value = item[key];
        if (typeof value !== 'string' || value.trim() === '' || value === 'N/A') {
            value = 'Nezadáno';
        } else {
            value = value.trim();
        }
        acc[value] = (acc[value] || 0) + 1;
        return acc;
    }, {});

    return Object.entries(aggregation)
        .map(([name, value]) => ({ name, [metricName]: value }))
        .sort((a, b) => b[metricName] - a[metricName]);
};

// Seskupování podle času (hodiny, dny v týdnu)
const aggregateByTime = (data, key, range, formatter) => {
    const aggregation = data.reduce((acc, item) => {
        const value = item[key];
        acc[value] = (acc[value] || 0) + 1;
        return acc;
    }, {});

    return Array.from({ length: range }, (_, i) => ({
        key: formatter(i),
        'Počet chyb': aggregation[i] || 0,
    }));
};