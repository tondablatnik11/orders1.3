import Papa from 'papaparse';

/**
 * Zpracuje data o chybách, ať už z pole objektů (Supabase) nebo z CSV souboru.
 * @param {File|Array<Object>} input - Vstupní data (soubor nebo pole).
 * @returns {Promise<Object>} - Promise s detailními chybami a metrikami pro grafy.
 */
export const processErrorData = (input) => {
  if (input instanceof File) {
    return processCsvFile(input);
  } else if (Array.isArray(input)) {
    return Promise.resolve(processArray(input));
  } else {
    return Promise.reject(new Error("Neznámý typ vstupních dat."));
  }
};

/**
 * Zpracuje pole objektů (např. z dotazu na Supabase).
 * @param {Array<Object>} data - Pole chyb z databáze.
 * @returns {Object} - Objekt s detailními chybami a souhrnnými metrikami.
 */
const processArray = (data) => {
  const errors = data.map(row => ({
    id: row.id,
    timestamp: row.timestamp || new Date(row.created_at).toISOString(),
    user: row.user || 'N/A',
    errorType: row.error_type || 'Unknown',
    priority: row.priority || 'Medium',
    description: row.description,
    status: row.status || 'New',
    applicationArea: row.application_area || 'General',
    errorCode: row.error_code || 'N/A',
  }));

  return aggregateData(errors);
};

/**
 * Zpracuje nahraný CSV soubor.
 * @param {File} file - Nahráný soubor.
 * @returns {Promise<Object>} - Promise s výsledky.
 */
const processCsvFile = (file) => {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        try {
          const errors = results.data.map((row, index) => {
            if (!row.Date || !row.Time || !row.Description) return null;
            const timestamp = new Date(`${row.Date} ${row.Time}`);
            if (isNaN(timestamp.getTime())) return null;

            return {
              id: row.ID || `err-csv-${Date.now()}-${index}`,
              timestamp: timestamp.toISOString(),
              user: row.User || 'N/A',
              errorType: row['Error Type'] || 'Unknown',
              priority: row.Priority || 'Medium',
              description: row.Description,
              status: row.Status || 'New',
              applicationArea: row['Application Area'] || 'General',
              errorCode: row['Error Code'] || 'N/A',
            };
          }).filter(Boolean);
          
          resolve(aggregateData(errors));
        } catch (error) {
          reject(error);
        }
      },
      error: (error) => reject(error),
    });
  });
};


/**
 * Agreguje zpracovaná data pro zobrazení v grafech a KPI.
 * @param {Array<Object>} errors - Pole zpracovaných chyb.
 * @returns {Object} - Agregovaná data.
 */
const aggregateData = (errors) => {
  if (!errors || errors.length === 0) {
    return {
        detailedErrors: [],
        summaryMetrics: { totalErrors: 0, uniqueErrorTypes: 0, totalHighPriority: 0 },
        chartsData: { errorsByPriority: [], errorsByStatus: [], errorsByArea: [] }
    };
  }

  const errorsByPriority = aggregate(errors, 'priority');
  const errorsByStatus = aggregate(errors, 'status');
  const errorsByArea = aggregate(errors, 'applicationArea');
  const totalHighPriority = errors.filter(e => e.priority === 'High').length;

  return {
    detailedErrors: errors,
    summaryMetrics: {
      totalErrors: errors.length,
      uniqueErrorTypes: new Set(errors.map(e => e.errorType)).size,
      totalHighPriority,
    },
    chartsData: {
      errorsByPriority,
      errorsByStatus,
      errorsByArea,
    }
  };
}

/**
 * Pomocná funkce pro agregaci dat podle daného klíče.
 * @param {Array<Object>} data - Pole objektů s chybami.
 * @param {string} key - Klíč, podle kterého se má agregovat (např. 'priority', 'status').
 * @returns {Array<Object>} - Pole objektů pro použití v grafech.
 */
const aggregate = (data, key) => {
    const aggregation = data.reduce((acc, item) => {
        const value = item[key];
        acc[value] = (acc[value] || 0) + 1;
        return acc;
    }, {});

    return Object.entries(aggregation).map(([name, value]) => ({ name, value }));
};