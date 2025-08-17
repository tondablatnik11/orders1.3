// src/lib/warehouseProcessor.js
import * as XLSX from 'xlsx';

// --- Konfigurace rozměrů ---
const KLT_ACTUAL_HEIGHT = 0.4;
const PALLET_LEVEL_HEIGHT = 2.0;    
const KLT_LEVEL_HEIGHT = 0.8;       
const CELL_DEPTH = 1.4;             
const POSITION_WIDTH = 1.2;         
const RACK_DEPTH = 1.4;             
const AISLE_WIDTH = 4.0;            
const RACK_SPINE_GAP = 0.2; 

// Mapa pro převod typů pozic na reálné výšky v metrech
export const binTypeToHeightMap = {
    'K1': KLT_ACTUAL_HEIGHT,
    'EP1': 0.7,
    'EP2': 1.0,
    'EP3': 1.2,
    'EP4': 1.5,
};

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
            x = baseX + RACK_DEPTH + RACK_SPINE_GAP + ((pozice - 1) * POSITION_WIDTH);
        } else {
            x = baseX + ((pozice - 1) * POSITION_WIDTH);
        }

        minX = Math.min(minX, x); maxX = Math.max(maxX, x);
        minY = Math.min(minY, y); maxY = Math.max(maxY, y);
        minZ = Math.min(minZ, z); maxZ = Math.max(maxZ, z);

        const labelKey = `AISLE-${rackPairIndex}`;
        if (!labelData.has(labelKey)) {
             const labelX = baseX + RACK_DEPTH + (RACK_SPINE_GAP / 2);
             const labelZ = -CELL_DEPTH * 2;
             const pairRegal = 13 + rackPairIndex*2;
             labelData.set(labelKey, { text: `R${pairRegal}/${pairRegal+1}`, position: [labelX, 0.01, labelZ] });
        }

        warehouseGrid.set(binId, {
            id: binId, address: visualAddress, 
            type: position.type || (isKltLevel ? 'K1' : 'EP3'), // fallback type
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

export const calculateDetailedKPIs = (gridData) => {
    if (!gridData || gridData.size === 0) return null;

    const gridArray = Array.from(gridData.values());
    const allStockItems = gridArray.flatMap(bin => bin.stockData || []).filter(Boolean);

    // --- Celkové statistiky ---
    const totalBins = gridData.size;
    const occupiedBins = gridArray.filter(bin => bin.status === 'occupied').length;
    
    // --- Analýza po řadách ---
    const byRow = {};
    gridArray.forEach(bin => {
        const [regal] = bin.address.split('-').map(Number);
        if (!byRow[regal]) byRow[regal] = { total: 0, occupied: 0 };
        byRow[regal].total++;
        if (bin.status === 'occupied') byRow[regal].occupied++;
    });
    Object.values(byRow).forEach(row => {
        row.rate = row.total > 0 ? ((row.occupied / row.total) * 100) : 0;
    });

    // --- Analýza podle typu a objemu pozic ---
    const byBinType = {};
    let totalVolume = 0;
    let occupiedVolume = 0;

    gridArray.forEach(bin => {
        const type = bin.type;
        if (!byBinType[type]) byBinType[type] = { total: 0, occupied: 0 };
        byBinType[type].total++;
        
        const binHeight = binTypeToHeightMap[type] || 0;
        const binVolume = POSITION_WIDTH * RACK_DEPTH * binHeight;
        totalVolume += binVolume;

        if (bin.status === 'occupied') {
            byBinType[type].occupied++;
            occupiedVolume += binVolume;
        }
    });
    Object.values(byBinType).forEach(typeStats => {
        typeStats.rate = typeStats.total > 0 ? ((typeStats.occupied / typeStats.total) * 100) : 0;
    });

    // --- Analýza stáří zásob ---
    const oldestStock = allStockItems
        .map(item => ({...item, duration: Number(item['Durat.']) || 0}))
        .sort((a, b) => b.duration - a.duration)
        .slice(0, 10);
    
    const totalAge = allStockItems.reduce((acc, item) => acc + (Number(item['Durat.']) || 0), 0);
    const averageAge = allStockItems.length > 0 ? totalAge / allStockItems.length : 0;
    
    // --- Analýza obsazenosti materiálem ---
     const byMaterial = allStockItems.reduce((acc, item) => {
        acc[item.Material] = (acc[item.Material] || 0) + 1;
        return acc;
    }, {});
    const topMaterials = Object.entries(byMaterial)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 10)
        .map(([material, count]) => ({ material, count }));


    return {
        overall: {
            totalBins, occupiedBins, totalVolume, occupiedVolume,
            occupancyRate: totalBins > 0 ? ((occupiedBins / totalBins) * 100).toFixed(1) : 0,
            volumeOccupancyRate: totalVolume > 0 ? ((occupiedVolume / totalVolume) * 100).toFixed(1) : 0,
            uniqueSKUs: new Set(allStockItems.map(item => item.Material)).size,
            totalPallets: new Set(allStockItems.map(item => item['Storage Unit'])).size,
        },
        byRow, byBinType, oldestStock, topMaterials, averageAge
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