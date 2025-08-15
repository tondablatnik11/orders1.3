// src/lib/errorMonitorProcessor.js
import { format, startOfDay, subDays, endOfDay, parse } from 'date-fns';
import { cs } from 'date-fns/locale';

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
                } else if (typeof timeValue === 'number') {
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
 * Hlavní funkce pro zpracování dat pro UI
 */
export const processArrayForDisplay = (data) => {
    if (!data || data.length === 0) {
        return { detailedErrors: [], chartsData: {}, timeSeriesData: {} };
    }
    
    const errorsForCharts = data.map(e => ({
        ...e,
        timestampDate: new Date(e.timestamp),
        position: String(e.error_location || 'Nezadáno').trim(),
        material: String(e.material || 'Nezadáno').trim(),
        user: String(e.user || 'Nezadáno').trim(),
        description: e.description || 'Neznámý typ',
        qtyDifference: Math.abs(Number(e.diff_qty) || 0),
    }));

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
    
    // Zpracování dat pro časovou osu s různými intervaly
    const processTimeSeries = (dataset) => {
        const now = new Date();
        const today = endOfDay(now);
        const lastDay = subDays(today, 1);
        const lastWeek = subDays(today, 7);
        const lastMonth = subDays(today, 30);

        const daily = dataset.filter(d => d.timestampDate >= lastDay);
        const weekly = dataset.filter(d => d.timestampDate >= lastWeek);
        const monthly = dataset.filter(d => d.timestampDate >= lastMonth);

        const aggregateBy = (data, period) => {
            let grouper;
            if (period === 'day') {
                grouper = (d) => format(d, 'HH:00');
            } else if (period === 'week') {
                grouper = (d) => format(d, 'eeeeee', { locale: cs });
            } else { // month
                grouper = (d) => format(d, 'dd.MM');
            }

            const grouped = data.reduce((acc, error) => {
                const key = grouper(error.timestampDate);
                acc[key] = (acc[key] || 0) + 1;
                return acc;
            }, {});
            
            const mapped = Object.entries(grouped).map(([name, count]) => ({ name, 'Počet chyb': count }));

            // ===== ZDE JE KLÍČOVÁ OPRAVA PRO ŘAZENÍ =====
            if (period === 'week') {
                const daysOrder = ['Po', 'Út', 'St', 'Čt', 'Pá', 'So', 'Ne'];
                return mapped.sort((a, b) => daysOrder.indexOf(a.name) - daysOrder.indexOf(b.name));
            }
            if (period === 'month') {
                return mapped.sort((a, b) => {
                    const dateA = parse(a.name, 'dd.MM', new Date());
                    const dateB = parse(b.name, 'dd.MM', new Date());
                    return dateA - dateB;
                });
            }
            if (period === 'day') {
                 return mapped.sort((a, b) => parseInt(a.name) - parseInt(b.name));
            }
            return mapped;
        };

        return {
            day: aggregateBy(daily, 'day'),
            week: aggregateBy(weekly, 'week'),
            month: aggregateBy(monthly, 'month'),
        };
    };

    return {
        detailedErrors: data.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)),
        chartsData: {
            errorsByPosition: aggregateMetric(errorsForCharts, 'position', 'Počet chyb'),
            errorsByMaterial: aggregateMetric(errorsForCharts, 'material', 'Počet chyb'),
            errorsByUser: aggregateMetric(errorsForCharts, 'user', 'Počet chyb'),
            errorsByType: aggregateMetric(errorsForCharts, 'description', 'Počet chyb'),
            quantityDifferenceByMaterial: aggregateQuantityDifference(errorsForCharts),
        },
        timeSeriesData: processTimeSeries(errorsForCharts),
    };
};