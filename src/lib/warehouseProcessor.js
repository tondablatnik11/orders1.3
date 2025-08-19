import * as XLSX from 'xlsx';

// --- Konfigurace ---
export const binTypeToHeightMap = { 'K1': 0.4, 'KLT': 0.4, 'EP1': 0.7, 'EP2': 1.0, 'EP3': 1.2, 'EP4': 1.5 };

// --- PARSOVACÍ FUNKCE ---
const parseFileToJson = (file) => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const data = new Uint8Array(e.target.result);
            const workbook = XLSX.read(data, { type: 'array', cellDates: true });
            const worksheet = workbook.Sheets[workbook.SheetNames[0]];
            resolve(XLSX.utils.sheet_to_json(worksheet));
        } catch (error) { reject(error); }
    };
    reader.onerror = (error) => reject(error);
    reader.readAsArrayBuffer(file);
});
export const parseStockFile = parseFileToJson;
export const parseBinMasterFile = parseFileToJson;

// --- HLAVNÍ FUNKCE PRO ZPRACOVÁNÍ DAT ---
export const processWarehouseData = (layoutData, stockData, pickingData, binMasterData) => {
    const validLayoutData = layoutData || [];
    const validStockData = stockData || [];
    const validPickingData = pickingData || [];
    const validBinMasterData = binMasterData || [];

    if (validLayoutData.length === 0) {
        return { grid: new Map(), dimensions: null, labels: [], kpis: calculateAdvancedKPIs(new Map(), [], [], []) };
    }

    const stockMap = new Map(validStockData.map(item => [String(item.storage_bin), item]));
    const binMasterMap = new Map(validBinMasterData.map(item => [String(item.storage_bin), item]));
    
    const pickingFrequency = validPickingData.reduce((acc, pick) => {
        if (pick && pick.source_storage_bin) {
            const bin = String(pick.source_storage_bin);
            acc.set(bin, (acc.get(bin) || 0) + 1);
        }
        return acc;
    }, new Map());

    const warehouseGrid = new Map();
    validLayoutData.forEach(position => {
        const binId = String(position.id);
        const stockInfo = stockMap.get(binId);
        const masterInfo = binMasterMap.get(binId) || {};
        
        warehouseGrid.set(binId, {
            id: binId,
            address: position.address,
            type: masterInfo.storage_bin_type || position.type || 'N/A',
            status: stockInfo ? 'occupied' : 'empty',
            pickCount: pickingFrequency.get(binId) || 0,
            stockInfo: stockInfo || null,
            masterInfo: masterInfo
        });
    });

    const kpis = calculateAdvancedKPIs(warehouseGrid, validPickingData, validStockData, validBinMasterData);
    const { dimensions, labels } = create3DLayout(warehouseGrid);
    return { grid: warehouseGrid, dimensions, labels, kpis };
};

// --- VÝPOČET POKROČILÝCH KPI ---
export const calculateAdvancedKPIs = (grid, pickingData, stockData, binMasterData) => {
    const gridArray = Array.from(grid.values());
    const occupiedBins = gridArray.filter(bin => bin.status === 'occupied');
    const totalBins = grid.size;
    
    // --- OPRAVA: Obnovení logiky pro ABC Analýzu ---
    const materialPickFrequency = pickingData.reduce((acc, pick) => {
        if (pick && pick.material) {
            const mat = pick.material;
            acc.set(mat, (acc.get(mat) || 0) + (pick.picked_quantity || 1));
        }
        return acc;
    }, new Map());

    const sortedMaterials = [...materialPickFrequency.entries()].sort((a, b) => b[1] - a[1]);
    const totalPicks = sortedMaterials.reduce((sum, [, count]) => sum + count, 0);
    
    let cumulativePercentage = 0;
    const abcAnalysis = { A: { materials: [], picks: 0 }, B: { materials: [], picks: 0 }, C: { materials: [], picks: 0 } };
    sortedMaterials.forEach(([material, count]) => {
        cumulativePercentage += (totalPicks > 0 ? (count / totalPicks) * 100 : 0);
        const materialInfo = { material, count, locations: 0 }; // Placeholder, reálný počet lokací je komplexnější
        
        if (cumulativePercentage <= 80) { 
            abcAnalysis.A.materials.push(materialInfo); 
            abcAnalysis.A.picks += count; 
        } else if (cumulativePercentage <= 95) { 
            abcAnalysis.B.materials.push(materialInfo); 
            abcAnalysis.B.picks += count; 
        } else { 
            abcAnalysis.C.materials.push(materialInfo); 
            abcAnalysis.C.picks += count; 
        }
    });


    // --- Detailní analýza řad 13-18 ---
    const targetRows = ['13', '14', '15', '16', '17', '18'];
    const detailedRowAnalysis = targetRows.map(rowNum => {
        const rowBins = gridArray.filter(bin => bin.address && bin.address.startsWith(`${rowNum}-`));
        return {
            row: `R ${rowNum}`,
            occupied_EP1: rowBins.filter(b => b.type === 'EP1' && b.status === 'occupied').length,
            empty_EP1: rowBins.filter(b => b.type === 'EP1' && b.status === 'empty').length,
            occupied_EP2: rowBins.filter(b => b.type === 'EP2' && b.status === 'occupied').length,
            empty_EP2: rowBins.filter(b => b.type === 'EP2' && b.status === 'empty').length,
            occupied_EP3: rowBins.filter(b => b.type === 'EP3' && b.status === 'occupied').length,
            empty_EP3: rowBins.filter(b => b.type === 'EP3' && b.status === 'empty').length,
            occupied_EP4: rowBins.filter(b => b.type === 'EP4' && b.status === 'occupied').length,
            empty_EP4: rowBins.filter(b => b.type === 'EP4' && b.status === 'empty').length,
            occupied_KLT: rowBins.filter(b => (b.type === 'K1' || b.type === 'KLT') && b.status === 'occupied').length,
            empty_KLT: rowBins.filter(b => (b.type === 'K1' || b.type === 'KLT') && b.status === 'empty').length,
        };
    });

    // --- Profesionální KPI ---
    const totalSKUs = new Set(stockData.map(item => item.material)).size;
    const picksPerDay = totalPicks / 90;
    
    const totalWeightCapacity = binMasterData.reduce((sum, bin) => sum + (Number(bin.maximum_weight) || 0), 0);
    const currentTotalWeight = stockData.reduce((sum, item) => sum + (Number(item.total_weight) || 0), 0);
    const weightOccupancyRate = totalWeightCapacity > 0 ? (currentTotalWeight / totalWeightCapacity) * 100 : 0;

    const ninetyDaysAgo = new Date(new Date().setDate(new Date().getDate() - 90));
    const slowMovers = stockData.filter(item => {
        const lastMovement = item.last_movement ? new Date(item.last_movement) : (item.gr_date ? new Date(item.gr_date) : null);
        return lastMovement && lastMovement < ninetyDaysAgo;
    });
    
    return {
        overall: {
            totalBins,
            occupiedBins: occupiedBins.length,
            occupancyRate: totalBins > 0 ? (occupiedBins.length / totalBins) * 100 : 0,
            totalPicks,
            totalSKUs,
            picksPerDay,
            slowMoversCount: slowMovers.length,
            weightOccupancyRate,
            pickingEfficiency: totalSKUs > 0 ? totalPicks / totalSKUs : 0,
        },
        abcAnalysis, // OPRAVA: Přidání ABC dat do výsledku
        detailedRowAnalysis,
    };
};

// --- FUNKCE PRO 3D USPOŘÁDÁNÍ ---
export const create3DLayout = (grid) => {
    if (!grid || grid.size === 0) return { dimensions: null, labels: [] };
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
        if (isRightSideInPair) {
            x = baseX + RACK_DEPTH + RACK_SPINE_GAP + ((pozice - 1) * 1.2);
        } else {
            x = baseX + ((pozice - 1) * 1.2);
        }
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

    if(!isFinite(minX)) {
        return { dimensions: { center: [0,0,0], size: [0,0,0], maxLevelY: 0 }, labels: [] };
    }

    return {
        dimensions: { center: [(minX + maxX) / 2, (minY + maxY) / 2, (minZ + maxZ) / 2], size: [maxX - minX, maxY - minY, maxZ - minZ], maxLevelY: maxY },
        labels: Array.from(labels.values()),
    };
};