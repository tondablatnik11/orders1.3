// src/lib/warehouseProcessor.js
import { parse, differenceInDays } from 'date-fns';

/**
 * Hlavní funkce, která zpracovává surová data ze skladového reportu.
 * @param {Array} stockData - Pole objektů s daty o zásobách.
 * @returns {Object} - Objekt obsahující KPI a data pro grafy.
 */
export const processWarehouseData = (stockData) => {
    if (!stockData || stockData.length === 0) {
        return null;
    }

    const today = new Date();
    const processedData = stockData.map(item => {
        // Excel datum 'Durat.' je číslo, převedeme ho na skutečné datum
        // Excel ukládá datum jako počet dní od 1.1.1900 (s chybou, že považuje 1900 za přestupný rok)
        const excelEpoch = new Date(1899, 11, 30);
        const receptionDate = new Date(excelEpoch.getTime() + (item['Durat.'] * 86400000));
        
        const ageInDays = receptionDate ? differenceInDays(today, receptionDate) : 0;
        
        return {
            ...item,
            ageInDays: ageInDays,
            receptionDate: receptionDate
        };
    });

    // --- Výpočet Klíčových Ukazatelů (KPI) ---
    const totalStock = processedData.reduce((sum, item) => sum + item['Available stock'], 0);
    const occupiedBins = new Set(processedData.map(item => item['Storage Bin'])).size;
    const uniqueMaterials = new Set(processedData.map(item => item['Material'])).size;
    const totalPallets = new Set(processedData.map(item => item['Storage Unit'])).size;

    // --- Příprava Dat pro Grafy ---

    // 1. Stáří zásob
    const ageBrackets = { '0-30 dní': 0, '31-60 dní': 0, '61-90 dní': 0, '91-180 dní': 0, '181+ dní': 0 };
    processedData.forEach(item => {
        if (item.ageInDays <= 30) ageBrackets['0-30 dní']++;
        else if (item.ageInDays <= 60) ageBrackets['31-60 dní']++;
        else if (item.ageInDays <= 90) ageBrackets['61-90 dní']++;
        else if (item.ageInDays <= 180) ageBrackets['91-180 dní']++;
        else ageBrackets['181+ dní']++;
    });
    const stockAgeDistribution = Object.entries(ageBrackets).map(([name, value]) => ({ name, 'Počet palet': value }));

    // 2. TOP 10 materiálů
    const materialCounts = processedData.reduce((acc, item) => {
        acc[item.Material] = (acc[item.Material] || 0) + item['Available stock'];
        return acc;
    }, {});
    const top10Materials = Object.entries(materialCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 10)
        .map(([name, value]) => ({ name, 'Celkové množství': value }));
        
    // 3. Rozložení zásob podle typu skladu
    const stockByStorageType = processedData.reduce((acc, item) => {
        const type = item['Storage Type'];
        acc[type] = (acc[type] || 0) + item['Available stock'];
        return acc;
    }, {});
    const stockDistribution = Object.entries(stockByStorageType).map(([name, value]) => ({ name, value }));

    return {
        kpis: {
            totalStock,
            occupiedBins,
            uniqueMaterials,
            totalPallets,
            deadStockCount: ageBrackets['181+ dní'],
        },
        charts: {
            stockAgeDistribution,
            top10Materials,
            stockDistribution,
        },
        detailedStock: processedData, // Detailní data pro tabulku
    };
};

/**
 * Funkce pro nahrání a zpracování CSV souboru pro Supabase.
 * @param {File} file - Nahrávaný soubor.
 * @returns {Promise<Array>} - Pole objektů připravené pro vložení do DB.
 */
export const processWarehouseFileForSupabase = (file) => {
    return new Promise(async (resolve, reject) => {
        const XLSX = await import('xlsx');
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = e.target.result;
                const workbook = XLSX.read(data, { type: 'array' });
                const sheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[sheetName];
                const jsonData = XLSX.utils.sheet_to_json(worksheet);
                
                // Zde bychom mohli data ještě pročistit nebo transformovat před nahráním
                // Prozatím je necháme tak, jak jsou
                resolve(jsonData);
            } catch (error) {
                reject(error);
            }
        };
        reader.onerror = (error) => reject(error);
        reader.readAsArrayBuffer(file);
    });
};