import * as XLSX from 'xlsx';

/**
 * Hlavní funkce, která rozhodne, jaký typ dat zpracovat.
 * @param {File|Array<Object>} input - Soubor nebo pole dat.
 * @returns {Promise<Object>}
 */
export const processErrorData = (input) => {
  if (input instanceof File) {
    return processXlsxFile(input);
  }
  if (Array.isArray(input)) {
    return Promise.resolve(processArray(input));
  }
  return Promise.reject(new Error("Neznámý typ vstupních dat."));
};

/**
 * Zpracuje pole dat (např. z XLSX).
 * @param {Array<Object>} data - Pole řádků.
 * @returns {Object} - Zpracovaná data pro dashboard.
 */
const processArray = (data) => {
  // 1. Mapování a čištění dat podle vašich sloupců
  const errors = data.map(row => {
    // Vytvoření platného a kompletního časového razítka
    const datePart = row['Created On'] ? new Date(row['Created On']) : new Date();
    if (row['Time'] && typeof row['Time'] === 'string') {
        const timeParts = row['Time'].split(':');
        datePart.setHours(parseInt(timeParts[0] || 0, 10));
        datePart.setMinutes(parseInt(timeParts[1] || 0, 10));
        datePart.setSeconds(parseInt(timeParts[2] || 0, 10));
    }

    // Výpočet rozdílu v množství pro identifikaci problémů
    const targetQty = Number(row['Source target qty'] || 0);
    const actualQty = Number(row['Source actual qty.'] || 0);
    const qtyDifference = targetQty - actualQty;

    return {
      position: row['Storage Bin'] || 'N/A',
      errorType: row['Text'] || 'Neznámá chyba',
      material: row['Material'] || 'N/A',
      orderNumber: row['Dest.Storage Bin'] || 'N/A',
      qtyDifference: qtyDifference,
      user: row['Created By'] || 'N/A',
      timestamp: datePart.toISOString(),
    };
  }).filter(Boolean); // Odstraní případné chybné řádky

  // 2. Agregace dat pro grafy a souhrnné metriky
  const totalErrors = errors.length;
  const errorsByType = aggregate(errors, 'errorType');
  const errorsByUser = aggregate(errors, 'user');
  
  // Analýza materiálů s největšími nesrovnalostmi v množství
  const materialDiscrepancy = errors
    .filter(e => e.qtyDifference !== 0)
    .reduce((acc, e) => {
        // Použijeme absolutní hodnotu, aby se rozdíly (+/-) sčítaly
        acc[e.material] = (acc[e.material] || 0) + Math.abs(e.qtyDifference);
        return acc;
    }, {});
  
  const topMaterialDiscrepancy = Object.entries(materialDiscrepancy)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 7) // Zobrazíme TOP 7 problematických materiálů
    .map(([name, value]) => ({ name, 'Absolutní rozdíl': value }));

  const mostCommonError = errorsByType[0]?.name || 'N/A';
  const userWithMostErrors = errorsByUser[0]?.name || 'N/A';

  // Seřazení chyb od nejnovějších pro zobrazení v tabulce
  const sortedErrors = errors.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

  return {
    detailedErrors: sortedErrors,
    summaryMetrics: {
      totalErrors,
      mostCommonError,
      userWithMostErrors,
    },
    chartsData: {
      errorsByType,
      errorsByUser,
      topMaterialDiscrepancy,
    }
  };
};

/**
 * Zpracuje nahraný XLSX soubor.
 * @param {File} file - Nahráný soubor.
 * @returns {Promise<Object>}
 */
const processXlsxFile = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const bstr = event.target.result;
        const workbook = XLSX.read(bstr, { type: 'binary', cellDates: true });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);
        
        const processedData = processArray(jsonData);
        resolve(processedData);
      } catch (error) {
        console.error("Chyba při parsování XLSX:", error);
        reject(new Error('Nepodařilo se zpracovat XLSX soubor.'));
      }
    };
    reader.onerror = () => reject(new Error('Chyba při čtení souboru.'));
    reader.readAsBinaryString(file);
  });
};

/**
 * Pomocná funkce pro agregaci dat podle klíče (např. podle uživatele nebo typu chyby).
 * @param {Array<Object>} data - Pole dat.
 * @param {string} key - Klíč pro seskupení.
 * @returns {Array<Object>} - Agregovaná data pro graf.
 */
const aggregate = (data, key) => {
    const aggregation = data.reduce((acc, item) => {
        const value = item[key] || 'Nezadáno';
        acc[value] = (acc[value] || 0) + 1;
        return acc;
    }, {});

    return Object.entries(aggregation)
        .map(([name, value]) => ({ name, 'Počet chyb': value }))
        .sort((a, b) => b['Počet chyb'] - a['Počet chyb']);
};