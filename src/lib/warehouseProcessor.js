// src/lib/warehouseProcessor.js
import * as XLSX from 'xlsx';

// --- FINÁLNÍ KONFIGURACE DLE DETAILNÍHO POPISU STRUKTURY ---
// Adresa: REGÁL - DŮM - VÝŠKA - POZICE (např. 13-37-50-03)

// --- Konfigurace rozměrů ---
const PALLET_LEVEL_HEIGHT = 2.0;    // Výška jednoho paletového patra (pro výšky 10, 20, ...)
const KLT_LEVEL_HEIGHT = 0.8;       // Výška jednoho KLT patra (pro výšky 01-06)
const CELL_DEPTH = 1.4;             // Hloubka jedné buňky/domu (osa Z)
const POSITION_WIDTH = 1.2;         // Šířka jedné pozice (01/02/03) v buňce (osa X)
const RACK_DEPTH = 1.4;             // Hloubka samotného regálu (jedna strana)
const AISLE_WIDTH = 4.0;            // Šířka uličky mezi páry regálů
const HALL_OFFSET_X = 100;          // Mezera pro oddělení hal (pokud se použije)

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

    // Pomocná mapa pro normalizaci výšek
    const levelMap = new Map();
    let currentLevelIndex = 0;

    layoutData.forEach((position) => {
        const binId = position.id;
        const visualAddress = position.address;
        if (!visualAddress || typeof visualAddress !== 'string' || !binId) return;

        const stockInfo = stockMap.get(binId) || null;
        const addressParts = visualAddress.split('-').map(Number);
        
        if (addressParts.length < 4) return;
        const [regal, dum, vyska, pozice] = addressParts;

        // --- VÝPOČET SOUŘADNICE Y (VÝŠKA) ---
        if (!levelMap.has(vyska)) {
            levelMap.set(vyska, currentLevelIndex++);
        }
        const isKltLevel = vyska <= 6;
        const y = isKltLevel 
            ? (vyska - 1) * KLT_LEVEL_HEIGHT
            : (6 * KLT_LEVEL_HEIGHT) + ((vyska / 10) - 1) * PALLET_LEVEL_HEIGHT;

        // --- VÝPOČET SOUŘADNICE Z (HLOUBKA V ULIČCE) ---
        const z = (dum - 1) * CELL_DEPTH;

        // --- VÝPOČET SOUŘADNICE X (ULIČKA A POZICE V REGÁLU) ---
        const rackPairIndex = Math.floor((regal - 13) / 2); // 0 pro pár 13/14, 1 pro 15/16 atd.
        const isRightSideInPair = regal % 2 === 0; // Je to pravá strana páru? (14, 16, 18)
        
        // Šířka kompletního bloku (2 regály + 1 ulička)
        const blockWidth = (RACK_DEPTH * 2) + AISLE_WIDTH;
        const baseX = rackPairIndex * blockWidth;

        let x = baseX;
        if (isRightSideInPair) {
            // Pravá strana páru (např. 14) - začíná za levou stranou a mezerou
            x += RACK_DEPTH;
        }
        
        // Přidáme posun na základě pozice (01/02/03)
        // Předpokládáme, že pozice jsou řazeny od kraje regálu do středu
        const xOffset = (pozice - 1) * POSITION_WIDTH;
        x += xOffset;


        minX = Math.min(minX, x); maxX = Math.max(maxX, x);
        minY = Math.min(minY, y); maxY = Math.max(maxY, y);
        minZ = Math.min(minZ, z); maxZ = Math.max(maxZ, z);

        const labelKey = `${regal}`;
        if (!labelData.has(labelKey)) {
             const labelX = baseX + RACK_DEPTH - (POSITION_WIDTH / 2);
             const labelZ = -CELL_DEPTH * 2; // Umístění popisku před regál
             labelData.set(labelKey, { text: `R${regal}`, position: [labelX, 0.01, labelZ] });
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