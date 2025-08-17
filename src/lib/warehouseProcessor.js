// src/lib/warehouseProcessor.js
import * as XLSX from 'xlsx';

// --- Konfigurace rozměrů, aby byly konzistentní s 3D mapou ---
const LEVEL_HEIGHT = 1.8; // Výška jednoho patra
const BEAM_THICKNESS = 0.1; // Tloušťka nosníku

/**
 * Sjednotí statická data o layoutu skladu s dynamickými daty o aktuálních zásobách.
 * Vytvoří komplexní datový model celého skladu a vypočítá jeho rozměry.
 * @param {Array<Object>} layoutData - Zpracovaná data z warehouse-layout.json.
 * @param {Array<Object>} stockData - Zpracovaná data z nahraného souboru LT10.
 * @returns {{grid: Map<string, Object>, dimensions: Object}} - Objekt obsahující mapu skladu a jeho rozměry.
 */
export const createWarehouseSnapshot = (layoutData, stockData) => {
    if (!layoutData) return { grid: new Map(), dimensions: null };

    const stockMap = new Map();
    if (stockData) {
        stockData.forEach(item => {
            const binId = String(item['Storage Bin']);
            if (!stockMap.has(binId)) {
                stockMap.set(binId, []);
            }
            stockMap.get(binId).push(item);
        });
    }

    const warehouseGrid = new Map();
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity, minZ = Infinity, maxZ = -Infinity;

    layoutData.forEach((position, index) => {
        const binId = position.id;
        const visualAddress = position.address;

        if (!visualAddress || typeof visualAddress !== 'string' || binId.length < 8) {
            console.warn(`Varování: Přeskakuji řádek v layoutu, chybí adresa nebo ID.`);
            return;
        }

        const stockInfo = stockMap.get(binId) || null;
        
        const addressParts = visualAddress.split('-').map(Number);
        const [haus, regal, platz] = [addressParts[0], addressParts[1], addressParts[3]];

        const levelString = binId.substring(4, 6);
        const ebene = parseInt(levelString, 10);
        
        // --- KLÍČOVÁ ZMĚNA: Přesnější výpočet Y souřadnice ---
        // Paleta bude sedět na nosníku, ne na zemi patra.
        const y = (ebene - 1) * LEVEL_HEIGHT + BEAM_THICKNESS / 2;
        // --- KONEC ZMĚNY ---

        const x = (haus === 18 ? 50 : 0) + (regal - 1) * 1.2;
        const z = (platz - 1) * 1.0;

        minX = Math.min(minX, x); maxX = Math.max(maxX, x);
        minY = Math.min(minY, y); maxY = Math.max(maxY, y);
        minZ = Math.min(minZ, z); maxZ = Math.max(maxZ, z);

        warehouseGrid.set(binId, {
            id: binId,
            address: visualAddress,
            type: position.type || 'Pallet',
            position: [x, y, z],
            status: stockInfo ? 'occupied' : 'empty',
            stockData: stockInfo,
        });
    });
    
    const dimensions = {
        center: [(minX + maxX) / 2, (minY + maxY) / 2, (minZ + maxZ) / 2],
        size: [maxX - minX, maxY - minY, maxZ - minZ],
        minY: minY,
        maxY: maxY
    };

    return { grid: warehouseGrid, dimensions };
};

// Ostatní funkce (calculateKPIs, parseStockFile) zůstávají beze změny
export const calculateKPIs = (gridData) => { /* ... */ };
export const parseStockFile = (file) => { /* ... */ };