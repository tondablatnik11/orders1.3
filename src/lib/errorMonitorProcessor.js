import * as XLSX from 'xlsx';

// Hlavní funkce, která rozhodne, jaký typ dat zpracovat
export const processErrorData = (input) => {
  if (input instanceof File) {
    return processXlsxFile(input);
  }
  if (Array.isArray(input)) {
    return Promise.resolve(processArray(input));
  }
  return Promise.reject(new Error("Neznámý typ vstupních dat."));
};

// Zpracuje pole objektů (data ze Supabase nebo z XLSX)
const processArray = (data) => {
  // 1. Mapování a čištění dat
  const errors = data.map(row => {
    // Vytvoření platného timestampu
    const datePart = row['Created On'] ? new Date(row['Created On']) : new Date();
    const timePart = row['Time'] || '00:00:00';
    datePart.setHours(timePart.split(':')[0]);
    datePart.setMinutes(timePart.split(':')[1]);
    datePart.setSeconds(timePart.split(':')[2]);

    // Výpočet rozdílu množství
    const targetQty = Number(row['Source target qty'] || 0);
    const actualQty = Number(row['Source actual qty.'] || 0);
    const qtyDifference = targetQty - actualQty;

    return {
      position: row['Storage Bin'] || 'N/A',
      errorType: row['Text'] || 'Neznámá chyba',
      material: row['Material'] || 'N/A',
      orderNumber: row['Dest.Storage Bin'] || 'N/A',
      qtyDifference,
      user: row['Created By'] || 'N/A',
      timestamp: datePart.toISOString(),
    };
  }).filter(Boolean);

  // 2. Agregace pro grafy a souhrny
  const totalErrors = errors.length;
  const errorsByType = aggregate(errors, 'errorType');
  const errorsByUser = aggregate(errors, 'user');
  
  const materialDiscrepancy = errors
    .filter(e => e.qtyDifference !== 0)
    .reduce((acc, e) => {
        acc[e.material] = (acc[e.material] || 0) + Math.abs(e.qtyDifference);
        return acc;
    }, {});
  
  const topMaterialDiscrepancy = Object.entries(materialDiscrepancy)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 7)
    .map(([name, value]) => ({ name, 'Absolutní rozdíl': value }));

  const mostCommonError = errorsByType[0]?.name || 'N/A';
  const userWithMostErrors = errorsByUser[0]?.name || 'N/A';

  // Seřazení pro tabulku
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

// Zpracuje nahraný XLSX soubor
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
        reject(new Error('Nepodařilo se zpracovat XLSX soubor.'));
      }
    };
    reader.onerror = () => reject(new Error('Chyba při čtení souboru.'));
    reader.readAsBinaryString(file);
  });
};

// Pomocná funkce pro agregaci dat
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