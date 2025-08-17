// src/lib/warehouseProcessor.js
import * as XLSX from 'xlsx';

/**
 * Sjednotí statická data o layoutu skladu s dynamickými daty o aktuálních zásobách.
 * Vytvoří komplexní datový model celého skladu.
 * @param {Array<Object>} layoutData - Zpracovaná data z Regalplätze.csv (nebo budoucího warehouse-layout.json).
 * @param {Array<Object>} stockData - Zpracovaná data z nahraného souboru LT10.
 * @returns {Map<string, Object>} Mapa, kde klíč je ID pozice a hodnota je objekt s kompletními informacemi.
 */
export const createWarehouseSnapshot = (layoutData, stockData) => {
    if (!layoutData) return new Map();

    // Krok 1: Vytvoříme mapu pro rychlý přístup k datům o zásobách. Klíčem je 'Storage Bin'.
    const stockMap = new Map();
    // Pokud stockData existují, naplníme mapu
    if (stockData) {
        stockData.forEach(item => {
            const binId = String(item['Storage Bin']);
            if (!stockMap.has(binId)) {
                stockMap.set(binId, []);
            }
            stockMap.get(binId).push(item);
        });
    }

    // Krok 2: Vytvoříme finální mapu celého skladu, obohacenou o data ze zásob.
    const warehouseGrid = new Map();
    layoutData.forEach(position => {
        const binId = String(position['Platzadresse im Barcode ohne Bindestrich -> Stellplatz']);
        const stockInfo = stockMap.get(binId) || null;

        const [haus, regal, ebene, platz] = position['Platzadresse visuelle Darstellung'].split('-').map(Number);

        const x = (regal - 1) * 1.2;
        const y = (ebene - 1) * 1.8;
        const z = (platz - 1) * 1.0;

        warehouseGrid.set(binId, {
            id: binId,
            address: position['Platzadresse visuelle Darstellung'],
            type: position.KLT || 'Pallet',
            position: [x, y, z],
            size: getBinSize(position.KLT),
            status: stockInfo ? 'occupied' : 'empty',
            stockData: stockInfo,
        });
    });

    return warehouseGrid;
};

/**
 * Vypočítá klíčové ukazatele (KPI) z kompletního snapshotu skladu.
 * @param {Map<string, Object>} gridData - Mapa celého skladu.
 * @returns {Object} Objekt s KPI.
 */
export const calculateKPIs = (gridData) => {
    if (!gridData || gridData.size === 0) {
        return { totalBins: 0, occupiedBins: 0, occupancyRate: 0, uniqueSKUs: 0, totalPallets: 0 };
    }

    const gridArray = Array.from(gridData.values());
    const occupiedBins = gridArray.filter(bin => bin.status === 'occupied').length;
    const allStockItems = gridArray.flatMap(bin => bin.stockData || []);
    
    const uniqueSKUs = new Set(allStockItems.map(item => item.Material)).size;
    const totalPallets = new Set(allStockItems.map(item => item['Storage Unit'])).size;

    return {
        totalBins: gridData.size,
        occupiedBins,
        occupancyRate: ((occupiedBins / gridData.size) * 100).toFixed(1),
        uniqueSKUs,
        totalPallets,
    };
};

/**
 * Pomocná funkce pro parsování XLSX souboru (jako LT10).
 * @param {File} file - Soubor nahraný uživatelem.
 * @returns {Promise<Array<Object>>}
 */
export const parseStockFile = (file) => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = new Uint8Array(e.target.result);
                const workbook = XLSX.read(data, { type: 'array' });
                const sheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[sheetName];
                const jsonData = XLSX.utils.sheet_to_json(worksheet);
                resolve(jsonData);
            } catch (error) {
                console.error("Chyba při parsování XLSX souboru:", error);
                reject(error);
            }
        };
        reader.onerror = (error) => reject(error);
        reader.readAsArrayBuffer(file);
    });
};

/**
 * Pomocná funkce pro určení rozměrů pozice podle typu.
 * @param {string} type - Typ pozice (KLT, Pallet, atd.)
 * @returns {Array<number>} Pole s rozměry [šířka, výška, hloubka]
 */
const getBinSize = (type) => {
    switch (type) {
        case 'Pallet': return [1.2, 1.8, 1.0];
        case 'KLT': return [0.6, 0.4, 0.4];
        case 'Multi SKU': return [1.2, 0.8, 1.0];
        default: return [1.0, 1.0, 1.0];
    }
};