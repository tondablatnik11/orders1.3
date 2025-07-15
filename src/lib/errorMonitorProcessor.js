import * as XLSX from 'xlsx';

// Pomocná funkce pro bezpečné získání hodnoty ze řádku s kontrolou více možných názvů sloupců
const getCellValue = (row, keys) => {
    for (const key of keys) {
        if (row[key] !== undefined && row[key] !== null) {
            return row[key];
        }
    }
    return null;
};

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
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { defval: null });
        
        const dataForSupabase = jsonData.map(row => {
          try {
            const dateValue = getCellValue(row, ['Created On', 'created on']);
            if (!dateValue) return null;

            let datePart = new Date(dateValue);
            if (isNaN(datePart.getTime())) return null;

            const timeValue = getCellValue(row, ['Time', 'time']);
            if (timeValue) {
                if (timeValue instanceof Date) {
                    datePart.setHours(timeValue.getUTCHours());
                    datePart.setMinutes(timeValue.getUTCMinutes());
                    datePart.setSeconds(timeValue.getUTCSeconds());
                } else if (typeof timeValue === 'number') {
                    const fraction = timeValue - Math.floor(timeValue);
                    const totalSeconds = Math.round(fraction * 86400);
                    datePart.setHours(Math.floor(totalSeconds / 3600));
                    datePart.setMinutes(Math.floor((totalSeconds % 3600) / 60));
                    datePart.setSeconds(totalSeconds % 60);
                }
            }

            const errorType = String(getCellValue(row, ['Text']) || 'Neznámá chyba').trim();
            const storageBin = String(getCellValue(row, ['Storage Bin', 'storage bin']) || 'N/A').trim();
            const material = String(getCellValue(row, ['Material']) || 'N/A').trim();
            const user = String(getCellValue(row, ['Created By', 'created by']) || 'N/A').trim();
            const sourceDiff = Number(getCellValue(row, ['Source bin differ.']) || 0);
            
            // Vytvoření unikátního klíče pro každý záznam
            const unique_key = `${datePart.toISOString()}_${material}_${user}_${storageBin}`;

            return {
              unique_key,
              position: storageBin,
              error_type: errorType,
              material: material,
              order_number: String(getCellValue(row, ['Dest.Storage Bin']) || 'N/A').trim(),
              qty_difference: sourceDiff,
              user: user,
              timestamp: datePart.toISOString(),
            };
          } catch (e) {
            console.error("Chyba při zpracování řádku:", row, e);
            return null;
          }
        }).filter(Boolean);

        if (dataForSupabase.length === 0) {
          throw new Error("V souboru nebyla nalezena žádná platná data. Zkontrolujte, zda soubor obsahuje sloupce 'Created On', 'Storage Bin' a 'Text'.");
        }
        resolve(dataForSupabase);
      } catch (error) {
        reject(new Error(error.message || 'Nepodařilo se zpracovat soubor.'));
      }
    };
    reader.onerror = () => reject(new Error('Chyba při čtení souboru.'));
    reader.readAsBinaryString(file);
  });
};

/**
 * Zpracuje data z databáze a připraví je pro zobrazení.
 */
export const processArrayForDisplay = (data) => {
    if (!data || data.length === 0) return null;

    const errors = data.map(row => ({
        position: row.position,
        errorType: row.error_type,
        material: row.material,
        qtyDifference: Number(row.qty_difference) || 0,
        user: row.user,
        timestamp: row.timestamp,
    }));

    const aggregateMetric = (data, key, metricName) => {
        const aggregation = data.reduce((acc, item) => {
            const value = String(item[key] || 'Nezadáno').trim();
            if (value === 'Nezadáno' || value === 'N/A' || value === '') return acc;
            acc[value] = (acc[value] || 0) + 1;
            return acc;
        }, {});
        return Object.entries(aggregation)
            .map(([name, value]) => ({ name, [metricName]: value }))
            .sort((a, b) => b[metricName] - a[metricName]);
    };
    
    const aggregateQuantityDifference = (data) => {
        const aggregation = data.filter(e => e.qtyDifference !== 0).reduce((acc, e) => {
            const material = String(e.material || 'Nezadáno').trim();
            if (material === 'Nezadáno' || material === 'N/A' || material === '') return acc;
            acc[material] = (acc[material] || 0) + Math.abs(e.qtyDifference);
            return acc;
        }, {});
        return Object.entries(aggregation)
            .map(([name, value]) => ({ name, 'Absolutní rozdíl': value }))
            .sort((a, b) => b['Absolutní rozdíl'] - a['Absolutní rozdíl']);
    };
    
    return {
        detailedErrors: errors.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)),
        chartsData: {
            errorsByPosition: aggregateMetric(errors, 'position', 'Počet chyb'),
            errorsByMaterial: aggregateMetric(errors, 'material', 'Počet chyb'),
            quantityDifferenceByMaterial: aggregateQuantityDifference(errors),
            errorsByType: aggregateMetric(errors, 'errorType', 'Počet chyb'),
        }
    };
};