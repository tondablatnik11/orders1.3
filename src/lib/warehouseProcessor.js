import * as XLSX from 'xlsx';

// --- Konfigurace a PARSOVACÍ FUNKCE (beze změny) ---
export const binTypeToHeightMap = { 'K1': 0.4, 'KLT': 0.4, 'EP1': 0.7, 'EP2': 1.0, 'EP3': 1.2, 'EP4': 1.5 };
const parseFileToJson = (file) => new Promise((resolve, reject) => { /* ... kód beze změny ... */ });
export const parseStockFile = parseFileToJson;
export const parseBinMasterFile = parseFileToJson;

// --- HLAVNÍ FUNKCE PRO ZPRACOVÁNÍ DAT (beze změny) ---
export const processWarehouseData = (layoutData, stockData, pickingData, binMasterData) => {
    if (!layoutData) return { grid: new Map(), dimensions: null, labels: [], kpis: null };
    const stockMap = new Map(stockData?.map(item => [String(item.storage_bin), item]));
    const binMasterMap = new Map(binMasterData?.map(item => [String(item.storage_bin), item]));
    const pickingFrequency = pickingData?.reduce((acc, pick) => {
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
    const materialPickFrequency = pickingData?.reduce((acc, pick) => { /* ... kód beze změny ... */ }, new Map());
    const sortedMaterials = [...(materialPickFrequency?.entries() || [])].sort((a, b) => b[1] - a[1]);
    const totalPicks = sortedMaterials.reduce((sum, [, count]) => sum + count, 0);
    let cumulativePercentage = 0;
    const abcAnalysis = { A: {materials: [], picks: 0}, B: {materials: [], picks: 0}, C: {materials: [], picks: 0} };
    sortedMaterials.forEach(([material, count]) => { /* ... kód beze změny ... */ });

    // --- Ostatní KPI (beze změny) ---
    const byBinType = gridArray.reduce((acc, bin) => { /* ... kód beze změny ... */ }, {});
    Object.values(byBinType).forEach(stats => { stats.rate = stats.total > 0 ? (stats.occupied / stats.total) * 100 : 0; });
    const totalWeightCapacity = gridArray.reduce((sum, bin) => sum + (Number(bin.maximum_weight) || 0), 0);
    const emptyPremiumBins = gridArray.filter(bin => (bin.type === 'EP3' || bin.type === 'EP4') && bin.status === 'empty').length;
    
    // --- Analýza po řadách (beze změny, ale spoléhá na normalizovaná data) ---
    const byRowAndType = {};
    const typeMappingForRowAnalysis = { 'EP1': 'P1', 'EP2': 'P2', 'EP3': 'P3', 'EP4': 'P4', 'K1': 'K1' }; // Tato mapa slouží jen pro seskupení v této konkrétní analýze
    (binMasterData || []).forEach(bin => {
        const address = bin.storage_bin;
        const type = typeMappingForRowAnalysis[bin.storage_bin_type] || bin.storage_bin_type;
        if (address && type) {
            const row = address.substring(0, 2);
            if (!byRowAndType[row]) byRowAndType[row] = {};
            if (!byRowAndType[row][type]) byRowAndType[row][type] = { total: 0, occupied: 0 };
            byRowAndType[row][type].total++;
        }
    });
    (stockData || []).forEach(item => {
        const address = item.storage_bin;
        const type = typeMappingForRowAnalysis[item.storage_bin_type] || item.storage_bin_type;
        if (address && type) {
            const row = address.substring(0, 2);
            if (byRowAndType[row] && byRowAndType[row][type]) {
                byRowAndType[row][type].occupied++;
            }
        }
    });

    // --- OPRAVENÁ LOGIKA: Detailní analýza řad 13-18 ---
    const detailedRowAnalysis = [];
    const targetRows = ['13', '14', '15', '16', '17', '18'];
    const binTypes = ['K1', 'EP1', 'EP2', 'EP3', 'EP4'];

    // Krok 1: Inicializace struktury a výpočet celkových počtů z master dat
    const analysisData = (binMasterData || []).reduce((acc, bin) => {
        const row = bin.storage_bin?.substring(0, 2);
        if (targetRows.includes(row)) {
            // Předpokládáme, že bin.storage_bin_type je již normalizovaný (např. 'EP1')
            const type = bin.storage_bin_type;
            if (binTypes.includes(type)) {
                if (!acc[row]) acc[row] = {};
                if (!acc[row][type]) acc[row][type] = { total: 0, occupied: 0 };
                acc[row][type].total++;
            }
        }
        return acc;
    }, {});

    // Krok 2: Výpočet obsazených pozic z dat o zásobách
    (stockData || []).forEach(item => {
        const row = item.storage_bin?.substring(0, 2);
        if (targetRows.includes(row)) {
            // Předpokládáme, že item.storage_bin_type je již normalizovaný (např. 'EP1')
            const type = item.storage_bin_type;
            if (binTypes.includes(type)) {
                // Zajistíme, že struktura existuje
                if (!analysisData[row]) analysisData[row] = {};
                if (!analysisData[row][type]) analysisData[row][type] = { total: 0, occupied: 0 };
                
                analysisData[row][type].occupied++;
            }
        }
    });

    // Krok 3: Formátování výstupních dat pro graf
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