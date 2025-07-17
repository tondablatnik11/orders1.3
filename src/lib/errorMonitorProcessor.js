// src/lib/errorMonitorProcessor.js
const getCellValue = (row, keys) => {
    for (const key of keys) {
        if (row[key] !== undefined && row[key] !== null) {
            return row[key];
        }
    }
    return null;
};

export const processErrorDataForSupabase = (file) => {
  return new Promise(async (resolve, reject) => {
    const XLSX = await import('xlsx');

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
                let hours = 0, minutes = 0, seconds = 0;
                if (timeValue instanceof Date && !isNaN(timeValue.getTime())) {
                    hours = timeValue.getUTCHours();
                    minutes = timeValue.getUTCMinutes();
                    seconds = timeValue.getUTCSeconds();
                } else if (typeof timeValue === 'number') {
                    const fraction = timeValue > 1 ? timeValue - Math.floor(timeValue) : timeValue;
                    const totalSeconds = Math.round(fraction * 86400);
                    hours = Math.floor(totalSeconds / 3600);
                    minutes = Math.floor((totalSeconds % 3600) / 60);
                    seconds = totalSeconds % 60;
                } else if (typeof timeValue === 'string') {
                    const timeParts = timeValue.split(':');
                    hours = parseInt(timeParts[0], 10) || 0;
                    minutes = parseInt(timeParts[1], 10) || 0;
                    seconds = parseInt(timeParts[2], 10) || 0;
                }
                datePart.setHours(hours, minutes, seconds);
            }
            
            const storageBin = String(getCellValue(row, ['Storage Bin', 'storage bin']) || 'N/A').trim();
            const uniqueKey = `${datePart.toISOString()}_${getCellValue(row, ['Material'])}_${getCellValue(row, ['Created By', 'created by'])}_${storageBin}`;

            // ====================== KLÍČOVÁ OPRAVA ZDE ======================
            // Názvy klíčů byly upraveny tak, aby odpovídaly názvům sloupců
            // v databázi Supabase, jak je vidět na vašem screenshotu.
            // Například 'order_number' bylo změněno na 'order_refence'.
            // ================================================================
            return {
              unique_key: uniqueKey,
              description: String(getCellValue(row, ['Text', 'Description']) || 'Neznámá chyba').trim(),
              material: String(getCellValue(row, ['Material']) || 'N/A').trim(),
              order_refence: String(getCellValue(row, ['Dest.Storage Bin']) || 'N/A').trim(),
              user: String(getCellValue(row, ['Created By', 'created by']) || 'N/A').trim(),
              timestamp: datePart.toISOString(),
              error_location: storageBin,
              diff_qty: Number(getCellValue(row, ['Source bin differ.']) || 0)
            };
          } catch (e) {
            console.error('Chyba při zpracování řádku:', row, e);
            return null;
          }
        }).filter(Boolean);

        if (dataForSupabase.length === 0) {
          throw new Error("V souboru nebyla nalezena žádná platná data.");
        }
        resolve(dataForSupabase);
      } catch (error) {
        console.error('Chyba při zpracování souboru:', error);
        reject(new Error(error.message || 'Nepodařilo se zpracovat soubor.'));
      }
    };
    reader.onerror = () => reject(new Error('Chyba při čtení souboru.'));
    reader.readAsBinaryString(file);
  });
};

export const processArrayForDisplay = (data) => {
    if (!data || data.length === 0) return null;

    const errorsForCharts = data.map(row => ({
        position: row.error_location || row.position,
        errorType: row.description || 'N/A',
        material: row.material,
        qtyDifference: Number(row.diff_qty || row.qty_difference) || 0,
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
        detailedErrors: data.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)),
        chartsData: {
            errorsByPosition: aggregateMetric(errorsForCharts, 'position', 'Počet chyb'),
            errorsByMaterial: aggregateMetric(errorsForCharts, 'material', 'Počet chyb'),
            quantityDifferenceByMaterial: aggregateQuantityDifference(errorsForCharts),
            errorsByType: aggregateMetric(errorsForCharts, 'errorType', 'Počet chyb'),
        }
    };
};