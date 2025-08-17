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

export const binTypeToHeightMap = {
    'K1': KLT_ACTUAL_HEIGHT, 'KLT': KLT_ACTUAL_HEIGHT,
    'EP1': 0.7, 'EP2': 1.0, 'EP3': 1.2, 'EP4': 1.5,
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
            type: position.type || (isKltLevel ? 'K1' : 'EP3'),
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
    const allStockItems = gridArray.flatMap(bin => {
        const binType = bin.type;
        return (bin.stockData || []).map(item => ({...item, binType}));
    }).filter(Boolean);

    const totalBins = gridData.size;
    const occupiedBins = gridArray.filter(bin => bin.status === 'occupied').length;
    
    const byRow = gridArray.reduce((acc, bin) => {
        const [regal] = bin.address.split('-').map(Number);
        if (!acc[regal]) acc[regal] = { total: 0, occupied: 0 };
        acc[regal].total++;
        if (bin.status === 'occupied') acc[regal].occupied++;
        return acc;
    }, {});
    Object.values(byRow).forEach(row => { row.rate = row.total > 0 ? (row.occupied / row.total) * 100 : 0; });

    const byBinType = gridArray.reduce((acc, bin) => {
        const type = bin.type;
        if (!acc[type]) acc[type] = { total: 0, occupied: 0 };
        acc[type].total++;
        if (bin.status === 'occupied') acc[type].occupied++;
        return acc;
    }, {});
    Object.values(byBinType).forEach(stats => { stats.rate = stats.total > 0 ? (stats.occupied / stats.total) * 100 : 0; });

    let totalVolume = 0, occupiedVolume = 0;
    gridArray.forEach(bin => {
        const binHeight = binTypeToHeightMap[bin.type] || 0;
        const binVolume = POSITION_WIDTH * RACK_DEPTH * binHeight;
        totalVolume += binVolume;
        if (bin.status === 'occupied') occupiedVolume += binVolume;
    });

    const materialCounts = allStockItems.reduce((acc, item) => {
        acc[item.Material] = (acc[item.Material] || 0) + 1;
        return acc;
    }, {});
    const topMaterialsByBins = Object.entries(materialCounts).sort(([, a], [, b]) => b - a).slice(0, 10).map(([material, count]) => ({ material, count }));
    
    const materialDistributionByBinType = allStockItems.reduce((acc, item) => {
        const type = item.binType;
        if (!acc[type]) acc[type] = new Set();
        acc[type].add(item.Material);
        return acc;
    }, {});
    Object.keys(materialDistributionByBinType).forEach(type => {
        materialDistributionByBinType[type] = materialDistributionByBinType[type].size;
    });

    const emptyBinsByType = gridArray.filter(bin => bin.status === 'empty').reduce((acc, bin) => {
        const type = bin.type;
        acc[type] = (acc[type] || 0) + 1;
        return acc;
    }, {});


    return {
        overall: {
            totalBins, occupiedBins, totalVolume, occupiedVolume,
            occupancyRate: totalBins > 0 ? ((occupiedBins / totalBins) * 100).toFixed(1) : 0,
            volumeOccupancyRate: totalVolume > 0 ? ((occupiedVolume / totalVolume) * 100).toFixed(1) : 0,
            uniqueSKUs: new Set(allStockItems.map(item => item.Material)).size,
        },
        byRow, byBinType, topMaterialsByBins, materialDistributionByBinType, emptyBinsByType
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