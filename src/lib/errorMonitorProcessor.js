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
        // Klíčová změna: vracíme cellDates: true pro spolehlivé parsování
        const workbook = XLSX.read(bstr, { type: 'binary', cellDates: true });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        // defval: null zajistí, že prázdné buňky nebudou přeskočeny
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { defval: null });
        
        const dataForSupabase = jsonData.map(row => {
          try {
            const dateValue = row['Created On'] || row['created on'];
            const timeValue = row['Time'] || row['time'];

            if (!dateValue) return null;

            // Univerzální zpracování data, které zvládne více formátů
            let datePart = new Date(dateValue);
            if (isNaN(datePart.getTime())) return null;

            if (timeValue) {
                // Zvládne čas jako Date objekt i jako desetinné číslo
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

            // Typ chyby se bere pouze ze sloupce 'Text'
            const errorType = String(row['Text'] || 'Neznámá chyba').trim();
            const sourceDiff = Number(row['Source bin differ.'] || 0);
            // Vytvoření unikátního klíče pro každý záznam, aby se předešlo duplicitám
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


/**
 * Zpracuje pole dat (načtené ze Supabase) a připraví je pro zobrazení v grafech.
 */
export const processArrayForDisplay = (data) => {
    if (!data || data.length === 0) return null;

    const errors = data.map(row => {
        return {
            position: row.position,
            material: row.material,
            qtyDifference: Number(row.qty_difference) || 0,
            timestamp: row.timestamp,
        };
    });
    
    // Funkce pro agregaci dat pro jednotlivé grafy
    const aggregateMetric = (data, key, metricName) => {
        const aggregation = data.reduce((acc, item) => {
            const value = String(item[key] || 'Nezadáno').trim();
            // Ignorujeme prázdné nebo N/A pozice
            if (value === 'Nezadáno' || value === '') return acc;
            acc[value] = (acc[value] || 0) + 1;
            return acc;
        }, {});
        return Object.entries(aggregation)
            .map(([name, value]) => ({ name, [metricName]: value }))
            .sort((a, b) => b[metricName] - a[metricName]);
    };
    
    // Funkce pro agregaci rozdílů v množství
    const aggregateQuantityDifference = (data) => {
        const aggregation = data.filter(e => e.qtyDifference !== 0).reduce((acc, e) => {
            const material = String(e.material || 'Nezadáno').trim();
            if (material === 'Nezadáno' || material === '') return acc;
            acc[material] = (acc[material] || 0) + Math.abs(e.qtyDifference);
            return acc;
        }, {});
        return Object.entries(aggregation)
            .map(([name, value]) => ({ name, 'Absolutní rozdíl': value }))
            .sort((a, b) => b['Absolutní rozdíl'] - a['Absolutní rozdíl']);
    };
    
    // Vytvoření dat pro jednotlivé grafy
    const errorsByPosition = aggregateMetric(errors, 'position', 'Počet chyb');
    const errorsByMaterial = aggregateMetric(errors, 'material', 'Počet chyb');
    const quantityDifferenceByMaterial = aggregateQuantityDifference(errors);

    return {
        // Ponecháváme detailedErrors pro případné budoucí tabulky, ale hlavní jsou chartsData
        detailedErrors: errors.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)),
        chartsData: {
            errorsByPosition,
            errorsByMaterial,
            quantityDifferenceByMaterial,
        }
    };
};