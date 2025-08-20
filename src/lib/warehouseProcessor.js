import * as XLSX from 'xlsx';
// PŘIDÁNO: Chybějící import pro statusConfig, který byl příčinou minulé chyby
import { statusConfig } from '@/config/statusConfig';

// --- Konfigurace a PARSOVACÍ FUNKCE (beze změny) ---
export const binTypeToHeightMap = { 'K1': 0.4, 'KLT': 0.4, 'EP1': 0.7, 'EP2': 1.0, 'EP3': 1.2, 'EP4': 1.5 };
const parseFileToJson = (file) => new Promise((resolve, reject) => { /* ... kód beze změny ... */ });
export const parseStockFile = parseFileToJson;
export const parseBinMasterFile = parseFileToJson;

// --- HLAVNÍ FUNKCE PRO ZPRACOVÁNÍ DAT (S OPRAVOU) ---
export const processWarehouseData = (layoutData, stockData, pickingData, binMasterData) => {
    if (!layoutData) return { grid: new Map(), dimensions: null, labels: [], kpis: null };

    // OPRAVA: Přidán fallback na prázdné pole [], aby se zabránilo pádu při null datech
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
            id: binId,
            address: position.address,
            type: stockInfo?.storage_bin_type || masterInfo.storage_bin_type || position.type || 'N/A',
            pickingArea: masterInfo.picking_area,
            zone: masterInfo.zone,
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

// --- VÝPOČET POKROČILÝCH KPI (S OPRAVOU) ---
export const calculateAdvancedKPIs = (grid, pickingData, stockData, binMasterData) => {
    const gridArray = Array.from(grid.values());
    const occupiedBins = gridArray.filter(bin => bin.status === 'occupied');
    const totalBins = grid.size;
    
    // --- ABC Analýza (beze změny) ---
    const materialPickFrequency = (pickingData || []).reduce((acc, pick) => {
        const mat = pick.material;
        if(mat) acc.set(mat, (acc.get(mat) || 0) + 1);
        return acc;
    }, new Map());
    const sortedMaterials = [...(materialPickFrequency?.entries() || [])].sort((a, b) => b[1] - a[1]);
    const totalPicks = sortedMaterials.reduce((sum, [, count]) => sum + count, 0);
    const abcAnalysis = { A: {materials: [], picks: 0}, B: {materials: [], picks: 0}, C: {materials: [], picks: 0} };
    let cumulativePercentage = 0;
    sortedMaterials.forEach(([material, count]) => {
        cumulativePercentage += (totalPicks > 0 ? (count / totalPicks) * 100 : 0);
        const locations = gridArray.filter(b => b.stockData && b.stockData[0]?.material === material).length;
        const materialInfo = { material, count, locations };
        if (cumulativePercentage <= 80) { abcAnalysis.A.materials.push(materialInfo); abcAnalysis.A.picks += count; } 
        else if (cumulativePercentage <= 95) { abcAnalysis.B.materials.push(materialInfo); abcAnalysis.B.picks += count; } 
        else { abcAnalysis.C.materials.push(materialInfo); abcAnalysis.C.picks += count; }
    });

    // --- Ostatní KPI (beze změny) ---
    const byBinType = gridArray.reduce((acc, bin) => {
        const type = bin.type || 'N/A';
        if (!acc[type]) acc[type] = { total: 0, occupied: 0, pickCount: 0 };
        acc[type].total++;
        if (bin.status === 'occupied') acc[type].occupied++;
        acc[type].pickCount += bin.pickCount;
        return acc;
    }, {});
    Object.values(byBinType).forEach(stats => { stats.rate = stats.total > 0 ? (stats.occupied / stats.total) * 100 : 0; });
    
    // --- OPRAVA: Analýza po řadách ---
    // Tato logika je nyní zjednodušená a spoléhá na již normalizovaná data (EP1, EP2 atd.)
    const byRowAndType = {};
    const displayTypeMapping = { 'EP1': 'P1', 'EP2': 'P2', 'EP3': 'P3', 'EP4': 'P4', 'K1': 'K1' };
    (binMasterData || []).forEach(bin => {
        const row = bin.storage_bin?.substring(0, 2);
        const type = displayTypeMapping[bin.storage_bin_type] || bin.storage_bin_type;
        if (row && type) {
            if (!byRowAndType[row]) byRowAndType[row] = {};
            if (!byRowAndType[row][type]) byRowAndType[row][type] = { total: 0, occupied: 0 };
            byRowAndType[row][type].total++;
        }
    });
    (stockData || []).forEach(item => {
        const row = item.storage_bin?.substring(0, 2);
        const type = displayTypeMapping[item.storage_bin_type] || item.storage_bin_type;
        if (row && type && byRowAndType[row] && byRowAndType[row][type]) {
            byRowAndType[row][type].occupied++;
        }
    });

    // --- Detailní analýza řad 13-18 (již opravená, beze změny) ---
    const detailedRowAnalysis = [];
    const targetRows = ['13', '14', '15', '16', '17', '18'];
    const binTypes = ['K1', 'EP1', 'EP2', 'EP3', 'EP4'];
    const analysisData = (binMasterData || []).reduce((acc, bin) => {
        const row = bin.storage_bin?.substring(0, 2);
        if (targetRows.includes(row)) {
            const type = bin.storage_bin_type;
            if (binTypes.includes(type)) {
                if (!acc[row]) acc[row] = {};
                if (!acc[row][type]) acc[row][type] = { total: 0, occupied: 0 };
                acc[row][type].total++;
            }
        }
        return acc;
    }, {});
    (stockData || []).forEach(item => {
        const row = item.storage_bin?.substring(0, 2);
        if (targetRows.includes(row)) {
            const type = item.storage_bin_type;
            if (binTypes.includes(type)) {
                if (!analysisData[row]) analysisData[row] = {};
                if (!analysisData[row][type]) analysisData[row][type] = { total: 0, occupied: 0 };
                analysisData[row][type].occupied++;
            }
        }
    });
    for (const row of targetRows) {
        const rowData = { row };
        for (const type of binTypes) {
            const total = analysisData[row]?.[type]?.total || 0;
            const occupied = analysisData[row]?.[type]?.occupied || 0;
            const typeKey = type === 'K1' ? 'KLT' : type;
            rowData[`occupied_${typeKey}`] = occupied;
            rowData[`empty_${typeKey}`] = total - occupied;
        }
        detailedRowAnalysis.push(rowData);
    }
    
    return {
        overall: {
            totalBins, occupiedBins: occupiedBins.length,
            occupancyRate: totalBins > 0 ? (occupiedBins.length / totalBins) * 100 : 0,
            totalPicks: totalPicks,
            weightOccupancyRate: 50.0, // Příklad - nutno implementovat výpočet
            picksPerDay: totalPicks / 90,
            totalSKUs: materialPickFrequency.size,
            pickingEfficiency: occupiedBins.length > 0 ? totalPicks / materialPickFrequency.size : 0,
            slowMoversCount: 0, // Příklad - nutno implementovat výpočet
        },
        abcAnalysis, 
        byBinType,
        byRowAndType,
        detailedRowAnalysis,
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