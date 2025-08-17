// src/lib/warehouseProcessor.js
import * as XLSX from 'xlsx';

// --- Finální Konfigurace Rozměrů ---
const RACK_WIDTH = 1.2;      // Šířka jednoho regálového sloupce
const AISLE_WIDTH = 4.0;     // ZVĚTŠENO pro realistickou šířku uličky
const RACK_DEPTH = 1.0;      // Hloubka regálu
const LEVEL_HEIGHT = 1.5;    // SNÍŽENO pro realističtější proporce regálů
const HALL_OFFSET_X = 80;    // Mezera mezi halou 13 a 18

/**
 * Zpracovává data a vrací snapshot skladu, jeho rozměry a data pro popisky.
 */
export const createWarehouseSnapshot = (layoutData, stockData) => {
    if (!layoutData) return { grid: new Map(), dimensions: null, labels: [] };

    const stockMap = new Map();
    if (stockData) {
        stockData.forEach(item => {
            const binId = String(item['Storage Bin']);
            if (!stockMap.has(binId)) stockMap.set(binId, []);
            stockMap.get(binId).push(item);
        });
    }

    const warehouseGrid = new Map();
    const labelData = new Map();
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity, minZ = Infinity, maxZ = -Infinity;

    layoutData.forEach((position) => {
        const binId = position.id;
        const visualAddress = position.address;
        if (!visualAddress || typeof visualAddress !== 'string' || !binId || binId.length < 8) return;

        const stockInfo = stockMap.get(binId) || null;
        const addressParts = visualAddress.split('-').map(Number);
        const [haus, regal, platz] = [addressParts[0], addressParts[1], addressParts[3]];
        const levelString = binId.substring(4, 6);
        const ebene = parseInt(levelString, 10);
        
        const y = (ebene - 1) * LEVEL_HEIGHT;
        const x = (haus === 18 ? HALL_OFFSET_X : 0) + (regal - 1) * (RACK_WIDTH + AISLE_WIDTH);
        const z = (platz - 1) * RACK_DEPTH;

        minX = Math.min(minX, x); maxX = Math.max(maxX, x);
        minY = Math.min(minY, y); maxY = Math.max(maxY, y);
        minZ = Math.min(minZ, z); maxZ = Math.max(maxZ, z);

        const labelKey = `${haus}-${regal}`;
        if (!labelData.has(labelKey)) {
            labelData.set(labelKey, { text: `R${regal}`, position: [x, 0.01, minZ - RACK_DEPTH * 2] });
        }

        warehouseGrid.set(binId, {
            id: binId, address: visualAddress, type: position.type || 'Pallet',
            position: [x, y, z], status: stockInfo ? 'occupied' : 'empty', stockData: stockInfo,
        });
    });
    
    const dimensions = {
        center: [(minX + maxX) / 2, (minY + maxY) / 2, (minZ + maxZ) / 2],
        size: [maxX - minX, maxY - minY, maxZ - minZ],
        maxLevelY: maxY,
    };

    return { grid: warehouseGrid, dimensions, labels: Array.from(labelData.values()) };
};

/**
 * Vypočítá klíčové ukazatele (KPI) z kompletního snapshotu skladu.
 */
export const calculateKPIs = (gridData) => {
    if (!gridData || gridData.size === 0) return { totalBins: 0, occupiedBins: 0, occupancyRate: 0, uniqueSKUs: 0, totalPallets: 0 };
    const gridArray = Array.from(gridData.values());
    const occupiedBins = gridArray.filter(bin => bin.status === 'occupied').length;
    const allStockItems = gridArray.flatMap(bin => bin.stockData || []).filter(Boolean);
    const uniqueSKUs = new Set(allStockItems.map(item => item.Material)).size;
    const totalPallets = new Set(allStockItems.map(item => item['Storage Unit'])).size;
    return {
        totalBins: gridData.size, occupiedBins,
        occupancyRate: ((occupiedBins / gridData.size) * 100).toFixed(1),
        uniqueSKUs, totalPallets,
    };
};

/**
 * Pomocná funkce pro parsování XLSX souboru (jako LT10).
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
            } catch (error) { reject(error); }
        };
        reader.onerror = (error) => reject(error);
        reader.readAsArrayBuffer(file);
    });
};