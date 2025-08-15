// src/lib/errorMonitorProcessor.js
import { format, startOfDay, subDays } from 'date-fns';

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
                if (timeValue instanceof Date) {
                    hours = timeValue.getUTCHours();
                    minutes = timeValue.getUTCMinutes();
                    seconds = timeValue.getUTCSeconds();
                } else if (typeof timeValue === 'number') { // Excel time is a float from 0 to 1
                    const totalSeconds = Math.round(timeValue * 86400);
                    hours = Math.floor(totalSeconds / 3600);
                    minutes = Math.floor((totalSeconds % 3600) / 60);
                    seconds = totalSeconds % 60;
                }
                datePart.setUTCHours(hours, minutes, seconds);
            }
            
            const timestamp = datePart.toISOString();
            const user = String(getCellValue(row, ['Created By', 'created by']) || 'N/A').trim();
            const material = String(getCellValue(row, ['Material', 'material']) || 'N/A').trim();
            const order_refence = String(getCellValue(row, ['Dest.Storage Bin', 'dest.storage bin']) || 'N/A').trim();
            const error_location = String(getCellValue(row, ['Storage Bin', 'storage bin']) || 'N/A').trim();
            const unique_key = `${timestamp}-${user}-${material}-${order_refence}-${error_location}`;

            return {
                timestamp: timestamp,
                description: `${String(row['Text'] || '').trim()} ${String(row['Text.1'] || '').trim()}`.trim() || 'N/A',
                material: material,
                error_location: error_location,
                order_refence: order_refence,
                user: user,
                target_qty: Number(getCellValue(row, ['Source target qty', 'source target qty']) || 0),
                actual_qty: Number(getCellValue(row, ['Source actual qty.', 'source actual qty.']) || 0),
                diff_qty: Number(getCellValue(row, ['Source bin differ.', 'source bin differ.']) || 0),
                unique_key: unique_key
            };
          } catch (e) {
            console.warn("Chyba při zpracování řádku:", row, e);
            return null;
          }
        }).filter(Boolean);
        
        resolve(dataForSupabase);
      } catch (error) {
        console.error("Chyba při parsování souboru:", error);
        reject(error);
      }
    };
    reader.onerror = (error) => reject(error);
    reader.readAsBinaryString(file);
  });
};


/**
 * Hlavní funkce, která zpracovává surová data z databáze na formát pro UI
 * @param {Array} data - Pole objektů s chybami ze Supabase
 * @returns {Object} - Objekt obsahující zpracovaná data pro grafy, tabulky a nové analýzy
 */
export const processArrayForDisplay = (data) => {
    if (!data || data.length === 0) {
        return { detailedErrors: [], chartsData: {}, riskAnalysis: {}, timeSeriesData: {} };
    }
    
    // Transformace a příprava dat
    const errorsForCharts = data.map(e => ({
        ...e,
        position: String(e.error_location || 'Nezadáno').trim(),
        material: String(e.material || 'Nezadáno').trim(),
        user: String(e.user || 'Nezadáno').trim(),
        description: e.description || 'Neznámý typ',
        qtyDifference: Math.abs(Number(e.diff_qty) || 0),
        date: startOfDay(new Date(e.timestamp)).toISOString().split('T')[0] // Normalizujeme datum
    }));

    // Agregace pro stávající grafy (koláčové, sloupcové)
    const aggregateMetric = (dataset, key, metricName) => {
        const aggregation = dataset.reduce((acc, item) => {
            const value = item[key];
            if (!value || value === 'Nezadáno' || value === 'N/A' || value === '') return acc;
            acc[value] = (acc[value] || 0) + 1;
            return acc;
        }, {});
        return Object.entries(aggregation)
            .map(([name, value]) => ({ name, [metricName]: value }))
            .sort((a, b) => b[metricName] - a[metricName]);
    };

    const aggregateQuantityDifference = (dataset) => {
        const aggregation = dataset.filter(e => e.qtyDifference > 0).reduce((acc, e) => {
            acc[e.material] = (acc[e.material] || 0) + e.qtyDifference;
            return acc;
        }, {});
        return Object.entries(aggregation)
            .map(([name, value]) => ({ name, 'Absolutní rozdíl': value }))
            .sort((a, b) => b['Absolutní rozdíl'] - a['Absolutní rozdíl']);
    };
    
    // NOVÉ: Analýza pro identifikaci rizikových položek
    const performRiskAnalysis = (dataset) => {
        const topRiskyMaterials = aggregateMetric(dataset, 'material', 'Počet chyb').slice(0, 5);
        const topRiskyOrders = aggregateMetric(dataset.filter(e => e.order_refence && e.order_refence !== 'N/A'), 'order_refence', 'Počet chyb').slice(0, 5);
        return { topRiskyMaterials, topRiskyOrders };
    };

    // NOVÉ: Zpracování dat pro časovou osu a klouzavý průměr
    const processTimeSeries = (dataset) => {
        const errorsByDay = dataset.reduce((acc, error) => {
            const day = error.date;
            acc[day] = (acc[day] || 0) + 1;
            return acc;
        }, {});

        const sortedDays = Object.entries(errorsByDay)
            .map(([date, count]) => ({ date, count }))
            .sort((a, b) => new Date(a.date) - new Date(b.date));

        // Výpočet 30-denního klouzavého průměru
        const withMovingAverage = sortedDays.map((entry, index, arr) => {
            const thirtyDaysAgo = subDays(new Date(entry.date), 30);
            const relevantData = arr.filter(d => new Date(d.date) >= thirtyDaysAgo && new Date(d.date) <= new Date(entry.date));
            const total = relevantData.reduce((sum, d) => sum + d.count, 0);
            const movingAverage = relevantData.length > 0 ? (total / relevantData.length) : 0;
            return {
                ...entry,
                name: format(new Date(entry.date), 'dd.MM'),
                'Počet chyb': entry.count,
                '30-denní průměr': parseFloat(movingAverage.toFixed(2))
            };
        });

        return withMovingAverage;
    };

    return {
        // Původní data
        detailedErrors: data.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)),
        chartsData: {
            errorsByPosition: aggregateMetric(errorsForCharts, 'position', 'Počet chyb'),
            errorsByMaterial: aggregateMetric(errorsForCharts, 'material', 'Počet chyb'),
            errorsByUser: aggregateMetric(errorsForCharts, 'user', 'Počet chyb'),
            errorsByType: aggregateMetric(errorsForCharts, 'description', 'Počet chyb'),
            quantityDifferenceByMaterial: aggregateQuantityDifference(errorsForCharts),
        },
        // NOVÁ DATA
        riskAnalysis: performRiskAnalysis(errorsForCharts),
        timeSeriesData: processTimeSeries(errorsForCharts),
    };
};