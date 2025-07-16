import * as XLSX from 'xlsx';

// Pomocná funkce pro převedení klíčů (názvů sloupců) na malá písmena a oříznutí mezer
const normalizeKeys = (obj) => {
    const newObj = {};
    for (const key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
            newObj[key.trim().toLowerCase()] = obj[key];
        }
    }
    return newObj;
};

/**
 * Zpracuje nahraný XLSX soubor a vrátí data připravená pro vložení do Supabase.
 * Tato verze je odolnější vůči velikosti písmen a mezerám v názvech sloupců.
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
        
        // Normalizujeme klíče pro každý řádek
        const normalizedData = jsonData.map(normalizeKeys);

        const dataForSupabase = normalizedData.map(row => {
          try {
            const dateValue = row['created on'];
            if (!dateValue) return null;

            let datePart = new Date(dateValue);
            if (isNaN(datePart.getTime())) return null;

            const timeValue = row['time'];
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

            const errorType = String(row['text'] || 'Neznámá chyba').trim();
            const storageBin = String(row['storage bin'] || 'N/A').trim();
            const material = String(row['material'] || 'N/A').trim();
            const user = String(row['created by'] || 'N/A').trim();
            const sourceDiff = Number(row['source bin differ.'] || 0);
            const destBin = String(row['dest.storage bin'] || 'N/A').trim();

            const unique_key = `${datePart.toISOString()}_${material}_${user}_${storageBin}`;

            return {
              unique_key,
              position: storageBin,
              error_type: errorType,
              material: material,
              order_number: destBin,
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
          throw new Error("V souboru nebyla nalezena žádná platná data. Zkontrolujte, zda soubor obsahuje sloupec 'Created On'.");
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
 * Tato funkce zůstává stejná, protože problém byl v importu.
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