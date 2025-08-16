// src/lib/warehouseProcessor.js
import { differenceInDays } from 'date-fns';

/**
 * Hlavní funkce, která zpracovává surová data ze skladového reportu.
 * @param {Array} stockData - Pole objektů s daty o zásobách.
 * @returns {Object} - Objekt obsahující KPI a data pro grafy.
 */
export const processWarehouseData = (stockData) => {
    if (!stockData || stockData.length === 0) {
        return null;
    }

    const processedData = stockData.map(item => {
        const ageInDays = Number(item['Durat.']) || 0;
        
        return {
            ...item,
            ageInDays: ageInDays,
        };
    });

    // --- Výpočet Klíčových Ukazatelů (KPI) ---
    const totalStock = processedData.reduce((sum, item) => sum + (item['Available stock'] || 0), 0);
    const occupiedBins = new Set(processedData.map(item => item['Storage Bin'])).size;
    const uniqueMaterials = new Set(processedData.map(item => item['Material'])).size;
    const totalPallets = new Set(processedData.map(item => item['Storage Unit'])).size;

    // --- Příprava Dat pro Grafy ---
    const ageBrackets = { '0-30 dní': 0, '31-60 dní': 0, '61-90 dní': 0, '91-180 dní': 0, '181+ dní': 0 };
    processedData.forEach(item => {
        if (item.ageInDays <= 30) ageBrackets['0-30 dní']++;
        else if (item.ageInDays <= 60) ageBrackets['31-60 dní']++;
        else if (item.ageInDays <= 90) ageBrackets['61-90 dní']++;
        else if (item.ageInDays <= 180) ageBrackets['91-180 dní']++;
        else ageBrackets['181+ dní']++;
    });
    const stockAgeDistribution = Object.entries(ageBrackets).map(([name, value]) => ({ name, 'Počet palet': value }));

    const materialCounts = processedData.reduce((acc, item) => {
        acc[item.Material] = (acc[item.Material] || 0) + (item['Available stock'] || 0);
        return acc;
    }, {});
    const top10Materials = Object.entries(materialCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 10)
        .map(([name, value]) => ({ name, 'Celkové množství': value }));
        
    const stockByStorageType = processedData.reduce((acc, item) => {
        const type = item['Storage Type'];
        if (type) {
            acc[type] = (acc[type] || 0) + (item['Available stock'] || 0);
        }
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
        detailedStock: processedData,
    };
};

/**
 * Funkce pro nahrání a zpracování CSV/XLSX souboru pro Supabase.
 */
export const processWarehouseFileForSupabase = (file) => {
    return new Promise(async (resolve, reject) => {
        try {
            const XLSX = await import('xlsx');
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const data = e.target.result;
                    const workbook = XLSX.read(data, { type: 'array' });
                    const sheetName = workbook.SheetNames[0];
                    const worksheet = workbook.Sheets[sheetName];
                    const jsonData = XLSX.utils.sheet_to_json(worksheet);

                    // ===== ZDE JE KLÍČOVÁ OPRAVA =====
                    // Vytvoříme nová, čistá data a explicitně mapujeme pouze ty sloupce,
                    // které existují v naší databázové tabulce. Tím ignorujeme
                    // všechny přebytečné nebo duplicitní sloupce jako "Storage Bin_1".
                    const dataToUpload = jsonData.map(row => ({
                        "Selection": row["Selection"],
                        "Storage Bin": row["Storage Bin"], // Vezme první (a jediný potřebný) sloupec
                        "Material": row["Material"],
                        "Plant": row["Plant"],
                        "Available stock": row["Available stock"],
                        "Base Unit of Measure": row["Base Unit of Measure"],
                        "Batch": row["Batch"],
                        "Stock Category": row["Stock Category"],
                        "Special Stock": row["Special Stock"],
                        "Special Stock Number": row["Special Stock Number"],
                        "Durat.": row["Durat."],
                        "Storage Unit": row["Storage Unit"],
                        "Storage Type": row["Storage Type"],
                        "Storage Section": row["Storage Section"],
                        "Storage bin type": row["Storage bin type"],
                        "Bin section": row["Bin section"]
                    }));

                    resolve(dataToUpload);
                } catch (error) {
                    reject(error);
                }
            };
            reader.onerror = (error) => reject(error);
            reader.readAsArrayBuffer(file);
        } catch (error) {
            reject(error);
        }
    });
};