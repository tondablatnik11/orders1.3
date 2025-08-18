import * as XLSX from 'xlsx';

// --- Konfigurace ---
export const binTypeToHeightMap = { 'K1': 0.4, 'KLT': 0.4, 'EP1': 0.7, 'EP2': 1.0, 'EP3': 1.2, 'EP4': 1.5 };
const POSITION_WIDTH = 1.2;
const RACK_DEPTH = 1.4;

// --- PARSOVACÍ FUNKCE ---
const parseFileToJson = (file) => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const data = new Uint8Array(e.target.result);
            const workbook = XLSX.read(data, { type: 'array' });
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
            type: masterInfo.storage_bin_type || position.type || 'N/A',
            pickingArea: masterInfo.picking_area,
            zone: masterInfo.zone,
            maximum_weight: masterInfo.maximum_weight || 0,
            status: stockInfo ? 'occupied' : 'empty',
            stockData: stockInfo ? [stockInfo] : null,
            pickCount: pickingFrequency?.get(binId) || 0,
        });
    });

    const kpis = calculateAdvancedKPIs(warehouseGrid, pickingData, stockData);
    const { dimensions, labels } = create3DLayout(warehouseGrid);
    return { grid: warehouseGrid, dimensions, labels, kpis };
};

// --- VÝPOČET POKROČILÝCH KPI ---
export const calculateAdvancedKPIs = (grid, pickingData, stockData) => {
    const gridArray = Array.from(grid.values());
    const occupiedBins = gridArray.filter(bin => bin.status === 'occupied');
    const totalBins = grid.size;
    
    // --- Stávající KPI ---
    const materialPickFrequency = pickingData?.reduce((acc, pick) => {
        const mat = pick.material;
        if(mat) acc.set(mat, (acc.get(mat) || 0) + 1);
        return acc;
    }, new Map());
    
    const sortedMaterials = [...(materialPickFrequency?.entries() || [])].sort((a, b) => b[1] - a[1]);
    const totalPicks = sortedMaterials.reduce((sum, [, count]) => sum + count, 0);
    
    let cumulativePercentage = 0;
    const abcAnalysis = { A: [], B: [], C: [] };
    sortedMaterials.forEach(([material, count]) => {
        cumulativePercentage += (count / totalPicks) * 100;
        const locations = gridArray.filter(b => b.stockData && b.stockData[0]?.material === material).length;
        const materialInfo = { material, count, locations };
        if (cumulativePercentage <= 80) abcAnalysis.A.push(materialInfo);
        else if (cumulativePercentage <= 95) abcAnalysis.B.push(materialInfo);
        else abcAnalysis.C.push(materialInfo);
    });

    const byBinType = gridArray.reduce((acc, bin) => {
        const type = bin.type || 'N/A';
        if (!acc[type]) acc[type] = { total: 0, occupied: 0, pickCount: 0 };
        acc[type].total++;
        if (bin.status === 'occupied') acc[type].occupied++;
        acc[type].pickCount += bin.pickCount;
        return acc;
    }, {});
    Object.values(byBinType).forEach(stats => { stats.rate = stats.total > 0 ? (stats.occupied / stats.total) * 100 : 0; });
    
    // --- NOVÉ KPI ---
    // 1. Vytížení hmotnosti
    const totalWeightCapacity = gridArray.reduce((sum, bin) => sum + (Number(bin.maximum_weight) || 0), 0);
    // Poznámka: Aktuální váha zásob není v LT10, takže ji nelze spočítat. Zobrazíme jen celkovou kapacitu.

    // 2. Volné prémiové pozice
    const emptyPremiumBins = gridArray.filter(bin => (bin.type === 'EP3' || bin.type === 'EP4') && bin.status === 'empty').length;

    // 3. Identifikace "Ležáků"
    const thirtyDaysAgo = new Date(new Date().setDate(new Date().getDate() - 30));
    const slowMovers = occupiedBins
        .filter(bin => bin.stockData && new Date(bin.stockData[0].last_movement) < thirtyDaysAgo)
        .sort((a, b) => new Date(a.stockData[0].last_movement) - new Date(b.stockData[0].last_movement))
        .slice(0, 10);

    // 4. Obrátkovost materiálů
    const materialStockTotals = stockData.reduce((acc, item) => {
        acc[item.material] = (acc[item.material] || 0) + Number(item.available_stock);
        return acc;
    }, {});

    const materialTurnover = Object.entries(materialStockTotals).map(([material, totalStock]) => {
        const picks = materialPickFrequency.get(material) || 0;
        // Jednoduchá metrika: počet picků / celkové množství. Vyšší je lepší.
        const turnoverRate = totalStock > 0 ? picks / totalStock : 0;
        return { material, turnoverRate };
    });

    const fastestMovers = [...materialTurnover].sort((a,b) => b.turnoverRate - a.turnoverRate).slice(0, 10);
    const slowestMovers = [...materialTurnover].filter(m => m.turnoverRate > 0).sort((a,b) => a.turnoverRate - b.turnoverRate).slice(0, 10);

    return {
        overall: {
            totalBins,
            occupiedBins: occupiedBins.length,
            occupancyRate: totalBins > 0 ? (occupiedBins.length / totalBins) * 100 : 0,
            totalPicks: totalPicks,
        },
        abcAnalysis,
        byBinType,
        // Nová data
        weightCapacity: totalWeightCapacity,
        emptyPremiumBins,
        slowMovers, // "Ležáci"
        fastestMovers,
        slowestMovers,
    };
};

// --- FUNKCE PRO 3D USPOŘÁDÁNÍ ---
export const create3DLayout = (grid) => {
    // ... Tato funkce zůstává stejná jako v předchozí verzi ...
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