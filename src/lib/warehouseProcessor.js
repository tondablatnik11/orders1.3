// src/lib/warehouseProcessor.js
import * as XLSX from 'xlsx';

// --- FINÁLNÍ KONFIGURACE DLE DETAILNÍHO POPISU STRUKTURY ---
const PALLET_LEVEL_HEIGHT = 2.0;
const KLT_LEVEL_HEIGHT = 0.8;
const CELL_DEPTH = 1.4;
const POSITION_WIDTH = 1.2;
const RACK_DEPTH = 1.4;
const AISLE_WIDTH = 8.0;
const RACK_SPINE_GAP = 0.6; // ZMENŠENO: Minimální mezera mezi regály v páru (13-14)

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
        if (!visualAddress || typeof visualAddress !== 'string' || !binId) return;

        const stockInfo = stockMap.get(binId) || null;
        const addressParts = visualAddress.split('-').map(Number);
        if (addressParts.length < 4) return;
        const [regal, dum, vyska, pozice] = addressParts;
        const isKltLevel = vyska <= 6;
        
        const y = isKltLevel 
            ? (vyska - 1) * KLT_LEVEL_HEIGHT
            : (6 * KLT_LEVEL_HEIGHT) + ((vyska / 10) - 1) * PALLET_LEVEL_HEIGHT;
        const z = (dum - 1) * CELL_DEPTH;
        
        const rackPairIndex = Math.floor((regal - 13) / 2);
        const isRightSideInPair = regal % 2 === 0;
        
        const blockWidth = (RACK_DEPTH * 2) + RACK_SPINE_GAP + AISLE_WIDTH;
        const baseX = rackPairIndex * blockWidth;

        let x;
        if (isRightSideInPair) {
            // Pravá strana páru (např. 14) začíná za levou + páteřní mezerou
            x = baseX + RACK_DEPTH + RACK_SPINE_GAP + ((pozice - 1) * POSITION_WIDTH);
        } else {
            // Levá strana páru (např. 13)
            x = baseX + ((pozice - 1) * POSITION_WIDTH);
        }

        minX = Math.min(minX, x); maxX = Math.max(maxX, x);
        minY = Math.min(minY, y); maxY = Math.max(maxY, y);
        minZ = Math.min(minZ, z); maxZ = Math.max(maxZ, z);

        const labelKey = `AISLE-${rackPairIndex}`;
        if (!labelData.has(labelKey)) {
             const labelX = baseX + RACK_DEPTH + (RACK_SPINE_GAP / 2);
             const labelZ = -CELL_DEPTH * 2;
             labelData.set(labelKey, { text: `R${regal}/${regal+1}`, position: [labelX, 0.01, labelZ] });
        }

        warehouseGrid.set(binId, {
            id: binId, address: visualAddress, type: isKltLevel ? 'KLT' : 'Pallet',
            position: [x, y, z], status: stockInfo ? 'occupied' : 'empty', stockData: stockInfo,
        });
    });
    
    const dimensions = {
        center: [(minX + maxX) / 2, (minY + maxY) / 2, (minZ + maxZ) / 2],
        size: [maxX - minX, maxY - minY, maxZ - minZ],
        maxLevelY: maxY,
        minZ, maxZ,
        rackLayout: { AISLE_WIDTH, RACK_DEPTH, RACK_SPINE_GAP, POSITION_WIDTH, CELL_DEPTH }
    };
    return { grid: warehouseGrid, dimensions, labels: Array.from(labelData.values()) };
};

// Funkce calculateKPIs a parseStockFile zůstávají beze změny
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