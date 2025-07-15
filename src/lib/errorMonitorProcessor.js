import * as XLSX from 'xlsx';
import { format } from 'date-fns';

/**
 * Funkce 1: Zpracuje nahraný XLSX soubor a vrátí data připravená pro vložení do Supabase.
 * Převádí názvy sloupců na snake_case pro databázi.
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
            const datePart = row['Created On'] ? new Date(row['Created On']) : new Date();
            if (row['Time'] && typeof row['Time'] === 'string') {
                const timeParts = row['Time'].split(':');
                datePart.setHours(parseInt(timeParts[0] || 0, 10));
                datePart.setMinutes(parseInt(timeParts[1] || 0, 10));
                datePart.setSeconds(parseInt(timeParts[2] || 0, 10));
            }

            const targetQty = Number(row['Source target qty'] || 0);
            const actualQty = Number(row['Source actual qty.'] || 0);
            
            let errorType = String(row['Text'] || 'Neznámá chyba').trim();
            if (errorType.toLowerCase() === 'location') {
                errorType = 'Location empty';
            }

            return {
              position: String(row['Storage Bin'] || 'N/A').trim(),
              error_type: errorType,
              material: String(row['Material'] || 'N/A').trim(),
              order_number: String(row['Dest.Storage Bin'] || 'N/A').trim(),
              qty_difference: targetQty - actualQty,
              user: String(row['Created By'] || 'N/A').trim(),
              timestamp: datePart.toISOString(),
            };
        }).filter(Boolean);

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
 * Funkce 2: Zpracuje pole dat (načtené ze Supabase) pro zobrazení v grafech a tabulkách.
 * Očekává data s názvy sloupců v snake_case.
 */
export const processArrayForDisplay = (data) => {
  const errors = data.map(row => ({
    position: row.position,
    errorType: row.error_type,
    material: row.material,
    orderNumber: row.order_number,
    qtyDifference: Number(row.qty_difference) || 0,
    user: row.user,
    timestamp: row.timestamp,
    hour: format(new Date(row.timestamp), 'HH'), // Přidána hodina pro analýzu
  }));

  const totalErrors = errors.length;
  const errorsByType = aggregate(errors, 'errorType');
  const errorsByUser = aggregate(errors, 'user');
  const errorsByPosition = aggregate(errors, 'position');
  
  // Nový graf: Chyby podle hodiny
  const errorsByHour = aggregateByHour(errors);

  const materialDiscrepancy = errors
    .filter(e => e.qtyDifference !== 0)
    .reduce((acc, e) => {
        const material = String(e.material).trim() || 'Nezadáno';
        acc[material] = (acc[material] || 0) + Math.abs(e.qtyDifference);
        return acc;
    }, {});
  
  const topMaterialDiscrepancy = Object.entries(materialDiscrepancy)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 10) // Zobrazení TOP 10
    .map(([name, value]) => ({ name, 'Absolutní rozdíl': value }));

  const mostCommonError = errorsByType[0]?.name || 'N/A';
  const userWithMostErrors = errorsByUser[0]?.name || 'N/A';
  const totalDifference = errors.reduce((sum, e) => sum + Math.abs(e.qtyDifference), 0);

  const sortedErrors = errors.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

  return {
    detailedErrors: sortedErrors,
    summaryMetrics: {
      totalErrors,
      mostCommonError,
      userWithMostErrors,
      totalDifference, // Nová metrika
    },
    chartsData: {
      errorsByType,
      errorsByUser,
      topMaterialDiscrepancy,
      errorsByPosition,
      errorsByHour, // Nová data pro graf
    }
  };
};

// Pomocná funkce pro seskupování dat pro grafy
const aggregate = (data, key) => {
    const aggregation = data.reduce((acc, item) => {
        let value = item[key];
        
        if (typeof value !== 'string' || value.trim() === '') {
            value = 'Nezadáno';
        } else {
            value = value.trim();
        }
        
        acc[value] = (acc[value] || 0) + 1;
        return acc;
    }, {});

    return Object.entries(aggregation)
        .map(([name, value]) => ({ name, 'Počet chyb': value }))
        .sort((a, b) => b['Počet chyb'] - a['Počet chyb']);
};

// Nová pomocná funkce pro seskupování podle hodiny
const aggregateByHour = (data) => {
    const aggregation = data.reduce((acc, item) => {
        const hour = item.hour;
        acc[hour] = (acc[hour] || 0) + 1;
        return acc;
    }, {});

    // Vytvoříme pole pro všechny hodiny (00-23) a naplníme je daty
    return Array.from({ length: 24 }, (_, i) => {
        const hour = String(i).padStart(2, '0');
        return {
            hodina: `${hour}:00`,
            'Počet chyb': aggregation[hour] || 0,
        };
    });
};