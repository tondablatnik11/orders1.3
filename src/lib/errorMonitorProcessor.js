import Papa from 'papaparse';

/**
 * Zpracuje nahraný CSV soubor s logem chyb.
 * @param {File} file - Nahráný soubor od uživatele.
 * @returns {Promise<Object>} - Promise, která se resolvuje s objektem obsahujícím detailní chyby a souhrnné metriky.
 */
export const processErrorLog = (file) => {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        try {
          const errors = results.data.map((row, index) => {
            // Kontrola existence klíčových sloupců
            if (!row.Date || !row.Time || !row.Description) {
              console.warn(`Řádek ${index + 2} v CSV souboru přeskočen: chybí povinná data (Date, Time, Description).`);
              return null;
            }

            // Spojení data a času do jednoho validního Date objektu
            const timestamp = new Date(`${row.Date} ${row.Time}`);
            if (isNaN(timestamp.getTime())) {
                console.warn(`Neplatný formát data nebo času na řádku ${index + 2}: ${row.Date} ${row.Time}`);
                return null;
            }

            return {
              id: row.ID || `err-${Date.now()}-${index}`,
              timestamp: timestamp.toISOString(),
              user: row.User || 'N/A',
              errorType: row['Error Type'] || 'Unknown',
              priority: row.Priority || 'Medium',
              description: row.Description,
              status: row.Status || 'New',
              applicationArea: row['Application Area'] || 'General',
              errorCode: row['Error Code'] || 'N/A',
            };
          }).filter(Boolean); // Odstraní null hodnoty z nevalidních řádků

          if (errors.length === 0) {
            throw new Error("V souboru nebyla nalezena žádná validní data chyb.");
          }

          // Agregace dat pro grafy
          const errorsByPriority = aggregate(errors, 'priority');
          const errorsByStatus = aggregate(errors, 'status');
          const errorsByArea = aggregate(errors, 'applicationArea');
          const totalHighPriority = errors.filter(e => e.priority === 'High').length;

          resolve({
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
          });
        } catch (error) {
          console.error("Chyba při zpracování dat:", error);
          reject(error);
        }
      },
      error: (error) => {
        console.error("Chyba při parsování CSV:", error);
        reject(error);
      },
    });
  });
};

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