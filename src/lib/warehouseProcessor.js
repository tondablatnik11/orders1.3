import * as XLSX from 'xlsx';
import { statusConfig } from '@/config/statusConfig';

// --- Konfigurace a PARSOVACÍ FUNKCE (beze změny) ---
export const binTypeToHeightMap = { 'K1': 0.4, 'KLT': 0.4, 'P1': 0.7, 'P2': 1.0, 'P3': 1.2, 'P4': 1.5 };
const parseFileToJson = (file) => new Promise((resolve, reject) => { /* ... kód beze změny ... */ });
export const parseStockFile = parseFileToJson;
export const parseBinMasterFile = parseFileToJson;

// --- HLAVNÍ FUNKCE PRO ZPRACOVÁNÍ DAT (beze změny) ---
export const processWarehouseData = (layoutData, stockData, pickingData, binMasterData) => {
    if (!layoutData) return { grid: new Map(), dimensions: null, labels: [], kpis: null };
    const stockMap = new Map((stockData || []).map(item => [String(item.storage_bin), item]));
    const binMasterMap = new Map((binMasterData || []).map(item => [String(item.storage_bin), item]));
    const pickingFrequency = (pickingData || []).reduce((acc, pick) => {
        const bin = String(pick.source_storage_bin);
        if(bin) acc.set(bin, (acc.get(bin) || 0) + 1);
        return acc;
    }, new Map());
    const warehouseGrid = new Map();
    layoutData.forEach(position => {
        const binId = String(position.id);
        const stockInfo = stockMap.get(binId);
        const masterInfo = binMasterMap.get(binId) || {};
        warehouseGrid.set(binId, {
            id: binId, address: position.address,
            type: stockInfo?.storage_bin_type || masterInfo.storage_bin_type || position.type || 'N/A',
            pickingArea: masterInfo.picking_area, zone: masterInfo.zone,
            maximum_weight: masterInfo.maximum_weight || 0,
            status: stockInfo ? 'occupied' : 'empty',
            stockData: stockInfo ? [stockInfo] : null,
            pickCount: pickingFrequency?.get(binId) || 0,
        });
    });
    const kpis = calculateAdvancedKPIs(warehouseGrid, pickingData, stockData, binMasterData);
    const { dimensions, labels } = create3DLayout(warehouseGrid);
    return { grid: warehouseGrid, dimensions, labels, kpis };
};

// --- KOMPLETNĚ PŘEPRACOVANÁ A ZJEDNODUŠENÁ FUNKCE PRO VÝPOČET KPI ---
export const calculateAdvancedKPIs = (grid, pickingData, stockData, binMasterData) => {
    const gridArray = Array.from(grid.values());
    const occupiedBins = gridArray.filter(bin => bin.status === 'occupied');
    const totalBins = grid.size;
    const binTypesOfInterest = ['K1', 'P1', 'P2', 'P3', 'P4'];

    // --- KPI podle typu pozice (pro nové karty) ---
    const byBinType = {};
    binTypesOfInterest.forEach(type => {
        byBinType[type] = { total: 0, occupied: 0 };
    });

    (binMasterData || []).forEach(bin => {
        const type = bin.storage_bin_type;
        if (byBinType[type]) {
            byBinType[type].total++;
        }
    });
    (stockData || []).forEach(item => {
        const type = item.storage_bin_type;
        if (byBinType[type]) {
            byBinType[type].occupied++;
        }
    });

    Object.values(byBinType).forEach(stats => {
        stats.rate = stats.total > 0 ? (stats.occupied / stats.total) * 100 : 0;
    });

    // --- Analýza po řadách ---
    const byRowAndType = {};
    (binMasterData || []).forEach(bin => {
        const row = bin.storage_bin?.substring(0, 2);
        const type = bin.storage_bin_type;
        if (row && type) {
            if (!byRowAndType[row]) byRowAndType[row] = {};
            if (!byRowAndType[row][type]) byRowAndType[row][type] = { total: 0, occupied: 0 };
            byRowAndType[row][type].total++;
        }
    });
    (stockData || []).forEach(item => {
        const row = item.storage_bin?.substring(0, 2);
        const type = item.storage_bin_type;
        if (row && type && byRowAndType[row] && byRowAndType[row][type]) {
            byRowAndType[row][type].occupied++;
        }
    });

    // --- Detailní analýza řad 13-18 ---
    const detailedRowAnalysis = [];
    const targetRows = ['13', '14', '15', '16', '17', '18'];
    const analysisData = {};
    
    (binMasterData || []).forEach(bin => {
        const row = bin.storage_bin?.substring(0, 2);
        if (targetRows.includes(row)) {
            const type = bin.storage_bin_type;
            if (binTypesOfInterest.includes(type)) {
                if (!analysisData[row]) analysisData[row] = {};
                if (!analysisData[row][type]) analysisData[row][type] = { total: 0, occupied: 0 };
                analysisData[row][type].total++;
            }
        }
    });
    (stockData || []).forEach(item => {
        const row = item.storage_bin?.substring(0, 2);
        if (targetRows.includes(row)) {
            const type = item.storage_bin_type;
            if (binTypesOfInterest.includes(type) && analysisData[row] && analysisData[row][type]) {
                analysisData[row][type].occupied++;
            }
        }
    });
    
    for (const row of targetRows) {
        const rowData = { row };
        for (const type of binTypesOfInterest) {
            const total = analysisData[row]?.[type]?.total || 0;
            const occupied = analysisData[row]?.[type]?.occupied || 0;
            const typeKey = type === 'K1' ? 'KLT' : type; // K1 interně, KLT v grafu
            rowData[`occupied_${typeKey}`] = occupied;
            rowData[`empty_${typeKey}`] = total - occupied;
        }
        detailedRowAnalysis.push(rowData);
    }
    
    return {
        overall: {
            totalBins, 
            occupiedBins: occupiedBins.length,
            freeBins: totalBins - occupiedBins.length,
            occupancyRate: totalBins > 0 ? (occupiedBins.length / totalBins) * 100 : 0,
        },
        byBinType,
        byRowAndType,
        detailedRowAnalysis,
        abcAnalysis: {}, // Placeholder, aby se předešlo chybám v jiných komponentách
    };
};


// --- FUNKCE PRO 3D USPOŘÁDÁNÍ (beze změny) ---
export const create3DLayout = (grid) => {
    if (grid.size === 0) return { dimensions: null, labels: [] };
    const KLT_LEVEL_HEIGHT = 0.8, PALLET_LEVEL_HEIGHT = 2.0, CELL_DEPTH = 1.4, RACK_DEPTH = 1.4, AISLE_WIDTH = 4.0, RACK_SPINE_GAP = 0.2;
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity, minZ = Infinity, maxZ = -Infinity;
    const labels = new Map();
    grid.forEach(bin => {
        if (!bin.address) return;
        const addressParts = bin.address.split('-').map(Number);
        if (addressParts.length < 4) return;
        const [regal, dum, vyska, pozice] = addressParts;
        const isKltLevel = vyska <= 6;
        const y = isKltLevel ? (vyska - 1) * KLT_LEVEL_HEIGHT : (6 * KLT_LEVEL_HEIGHT) + ((vyska / 10) - 1) * PALLET_LEVEL_HEIGHT;
        const z = (dum - 1) * CELL_DEPTH;
        const rackPairIndex = Math.floor((regal - 13) / 2);
        const isRightSideInPair = regal % 2 === 0;
        const blockWidth = (RACK_DEPTH * 2) + RACK_SPINE_GAP + AISLE_WIDTH;
        const baseX = rackPairIndex * blockWidth;
        let x;
        if (isRightSideInPair) x = baseX + RACK_DEPTH + RACK_SPINE_GAP + ((pozice - 1) * 1.2);
        else x = baseX + ((pozice - 1) * 1.2);
        bin.position = [x, y, z];
        minX = Math.min(minX, x); maxX = Math.max(maxX, x); minY = Math.min(minY, y); maxY = Math.max(maxY, y); minZ = Math.min(minZ, z); maxZ = Math.max(maxZ, z);
        const labelKey = `AISLE-${rackPairIndex}`;
        if (!labels.has(labelKey)) {
             const labelX = baseX + RACK_DEPTH + (RACK_SPINE_GAP / 2);
             const labelZ = -CELL_DEPTH * 2;
             const pairRegal = 13 + rackPairIndex*2;
             labels.set(labelKey, { text: `R${pairRegal}/${pairRegal+1}`, position: [labelX, 0.01, labelZ] });
        }
    });
    return {
        dimensions: { center: [(minX + maxX) / 2, (minY + maxY) / 2, (minZ + maxZ) / 2], size: [maxX - minX, maxY - minY, maxZ - minZ], maxLevelY: maxY },
        labels: Array.from(labels.values()),
    };
};