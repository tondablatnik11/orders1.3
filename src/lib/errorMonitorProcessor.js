import * as XLSX from 'xlsx';

// Hlavní funkce, která rozhodne, jaký typ dat zpracovat
export const processErrorData = (input) => {
  if (input instanceof File) {
    return processXlsxFile(input); // Změna na XLSX
  }
  if (Array.isArray(input)) {
    return Promise.resolve(processArray(input));
  }
  return Promise.reject(new Error("Neznámý typ vstupních dat."));
};

// Zpracuje pole objektů (data ze Supabase nebo z XLSX)
const processArray = (data) => {
  const errors = data.map(row => {
    // Logika pro správné složení data a času
    // Zkusí nejdříve 'timestamp', pak 'Date', nakonec dnešní datum
    const datePartSource = row.timestamp || row.Date;
    const datePart = datePartSource ? new Date(datePartSource).toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
    
    const timePart = row.time || row.Time || '00:00:00';
    const fullTimestamp = new Date(`${datePart}T${timePart}Z`); // 'Z' označuje UTC

    if (isNaN(fullTimestamp.getTime())) {
      console.warn('Neplatný formát data pro řádek:', row);
      return null;
    }
    
    return {
      id: row.id || row.ID,
      timestamp: fullTimestamp.toISOString(),
      user: row.user || row.User || 'N/A',
      errorType: row.error_type || row['Error Type'] || 'Unknown',
      priority: row.priority || row.Priority || 'Medium',
      description: row.description || row.Description,
      status: row.status || row.Status || 'New',
      applicationArea: row.application_area || row['Application Area'] || 'General',
      errorCode: row.error_code || row['Error Code'] || 'N/A',
    };
  }).filter(Boolean);

  return aggregateData(errors);
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
        
        // Zpracujeme data z XLSX pomocí stejné funkce jako pro data ze Supabase
        const processedData = processArray(jsonData);
        resolve(processedData);
      } catch (error) {
        console.error('Chyba při parsování XLSX:', error);
        reject(new Error('Nepodařilo se zpracovat XLSX soubor.'));
      }
    };
    reader.onerror = (error) => {
        reject(new Error('Chyba při čtení souboru.'));
    };
    reader.readAsBinaryString(file);
  });
};

// Agreguje data pro grafy a souhrn
const aggregateData = (errors) => {
  if (!errors || errors.length === 0) {
    return {
        detailedErrors: [],
        summaryMetrics: { totalErrors: 0, uniqueErrorTypes: 0, totalHighPriority: 0 },
        chartsData: { errorsByPriority: [], errorsByStatus: [], errorsByArea: [] }
    };
  }

  const sortedErrors = errors.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

  const aggregate = (data, key) => {
    const aggregation = data.reduce((acc, item) => {
        const value = item[key] || 'Nezadáno';
        acc[value] = (acc[value] || 0) + 1;
        return acc;
    }, {});
    return Object.entries(aggregation).map(([name, value]) => ({ name, value }));
  };

  return {
    detailedErrors: sortedErrors,
    summaryMetrics: {
      totalErrors: sortedErrors.length,
      uniqueErrorTypes: new Set(sortedErrors.map(e => e.errorType)).size,
      totalHighPriority: sortedErrors.filter(e => e.priority === 'High').length,
    },
    chartsData: {
      errorsByPriority: aggregate(sortedErrors, 'priority'),
      errorsByStatus: aggregate(sortedErrors, 'status'),
      errorsByArea: aggregate(sortedErrors, 'applicationArea'),
    }
  };
}