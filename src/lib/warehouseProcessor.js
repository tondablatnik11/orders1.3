// src/lib/warehouseProcessor.js
import * as XLSX from 'xlsx';

/**
 * Sjednotí statická data o layoutu skladu s dynamickými daty o aktuálních zásobách.
 * Vytvoří komplexní datový model celého skladu a vypočítá jeho rozměry.
 * @param {Array<Object>} layoutData - Zpracovaná data z warehouse-layout.json.
 * @param {Array<Object>} stockData - Zpracovaná data z nahraného souboru LT10.
 * @returns {{grid: Map<string, Object>, dimensions: Object}} - Objekt obsahující mapu skladu a jeho rozměry.
 */
export const createWarehouseSnapshot = (layoutData, stockData) => {
    if (!layoutData) return { grid: new Map(), dimensions: null };

    const stockMap = new Map();
    if (stockData) {
        stockData.forEach(item => {
            const binId = String(item['Storage Bin']);
            if (!stockMap.has(binId)) {
                stockMap.set(binId, []);
            }
            stockMap.get(binId).push(item);
        });
    }

    const warehouseGrid = new Map();
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity, minZ = Infinity, maxZ = -Infinity;
    const LEVEL_HEIGHT = 1.8; // Definuje výšku jednoho patra

    layoutData.forEach((position, index) => {
        const binId = position.id;
        const visualAddress = position.address;

        if (!visualAddress || typeof visualAddress !== 'string' || binId.length < 8) {
            console.warn(`Varování: Přeskakuji řádek v layoutu, chybí adresa nebo ID.`);
            return;
        }

        const stockInfo = stockMap.get(binId) || null;
        
        const addressParts = visualAddress.split('-').map(Number);
        const [haus, regal, platz] = [addressParts[0], addressParts[1], addressParts[3]];

        // --- ZDE JE KLÍČOVÁ OPRAVA ---
        // Vertikální pozici (patro) odvozujeme z 5. a 6. číslice ID
        const levelString = binId.substring(4, 6);
        const ebene = parseInt(levelString, 10);
        // Souřadnice Y se nyní počítá jako (patro - 1) * výška patra
        const y = (ebene - 1) * LEVEL_HEIGHT;
        // --- KONEC OPRAVY ---

        const x = (haus === 18 ? 50 : 0) + (regal - 1) * 1.2;
        const z = (platz - 1) * 1.0;

        minX = Math.min(minX, x); maxX = Math.max(maxX, x);
        minY = Math.min(minY, y); maxY = Math.max(maxY, y);
        minZ = Math.min(minZ, z); maxZ = Math.max(maxZ, z);

        warehouseGrid.set(binId, {
            id: binId,
            address: visualAddress,
            type: position.type || 'Pallet',
            position: [x, y, z],
            size: getBinSize(position.type),
            status: stockInfo ? 'occupied' : 'empty',
            stockData: stockInfo,
        });
    });
    
    const dimensions = {
        center: [(minX + maxX) / 2, (minY + maxY) / 2, (minZ + maxZ) / 2],
        size: [maxX - minX, maxY - minY, maxZ - minZ],
    };

    return { grid: warehouseGrid, dimensions };
};

// Ostatní funkce zůstávají beze změny
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
                reject(error);
            }
        };
        reader.onerror = (error) => reject(error);
        reader.readAsArrayBuffer(file);
    });
};

const getBinSize = (type) => {
    switch (type) {
        case 'Pallet': return [1.2, 1.8, 1.0];
        case 'KLT': return [0.6, 0.4, 0.4];
        case 'Multi SKU': return [1.2, 0.8, 1.0];
        default: return [1.0, 1.0, 1.0];
    }
};