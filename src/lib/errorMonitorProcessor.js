import * as XLSX from 'xlsx';
import { format, getDay } from 'date-fns';
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
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { defval: null, raw: false });
        
        const dataForSupabase = jsonData.map(row => {
          try {
            const dateValue = row['Created On'] || row['created on'];
            const timeValue = row['Time'] || row['time'];

            if (!dateValue) return null;
            
            let datePart = new Date(dateValue);

            if (isNaN(datePart.getTime())) {
                // Fallback pro případy, kdy je datum ve špatném formátu
                if (typeof dateValue === 'string' && dateValue.includes('/')) {
                    const parts = dateValue.split('/');
                    datePart = new Date(`${parts[2]}-${parts[0]}-${parts[1]}`);
                } else {
                    return null;
                }
            }
             if (isNaN(datePart.getTime())) return null;

            if (timeValue) {
                const timeStr = String(timeValue);
                const timeParts = timeStr.match(/(\d+):(\d+):(\d+)/);
                if(timeParts) {
                    datePart.setHours(parseInt(timeParts[1],10));
                    datePart.setMinutes(parseInt(timeParts[2],10));
                    datePart.setSeconds(parseInt(timeParts[3],10));
                }
            }

            const errorType = [row['Text'], row['Text.1']].filter(v => v != null).join(' - ').trim() || 'Neznámá chyba';
            const sourceDiff = Number(row['Source bin differ.'] || 0);
            
            // Unikátní klíč pro každý záznam, aby se předešlo duplicitám
            const unique_key = `${datePart.toISOString()}_${String(row['Material'] || '').trim()}_${String(row['Created By'] || '').trim()}`;

            return {
              unique_key,
              position: String(row['Storage Bin'] || 'N/A').trim(),
              error_type: errorType,
              material: String(row['Material'] || 'N/A').trim(),
              order_number: String(row['Dest.Storage Bin'] || 'N/A').trim(),
              qty_difference: sourceDiff,
              user: String(row['Created By'] || 'N/A').trim(),
              timestamp: datePart.toISOString(),
            };
          } catch (e) {
            console.error("Chyba při zpracování řádku:", row, e);
            return null;
          }
        }).filter(Boolean);

        if (dataForSupabase.length === 0) {
          throw new Error("V souboru nebyla nalezena žádná platná data. Zkontrolujte názvy sloupců a formát data.");
        }

        resolve(dataForSupabase);

      } catch (error) {
        console.error("Chyba při parsování XLSX:", error);
        reject(new Error(error.message || 'Nepodařilo se zpracovat soubor.'));
      }
    };
    reader.onerror = () => reject(new Error('Chyba při čtení souboru.'));
    reader.readAsBinaryString(file);
  });
};


// --- ZBYTEK SOUBORU ZŮSTÁVÁ STEJNÝ ---

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
      dayOfWeek: getDay(timestamp),
    };
  });
  const totalErrors = errors.length;
  const errorsByType = aggregate(errors, 'errorType', 'Počet chyb');
  const errorsByUser = aggregate(errors, 'user', 'Počet chyb');
  const errorsByPosition = aggregate(errors, 'position', 'Počet chyb');
  const errorsByHour = aggregateByTime(errors, 'hour', 24, (i) => `${String(i).padStart(2, '0')}:00`);
  const errorsByDay = aggregateByTime(errors, 'dayOfWeek', 7, (i) => {
    const dayIndex = (i + 6) % 7;
    return format(new Date(2024, 0, dayIndex + 1), 'eeee', { locale: cs });
  });
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