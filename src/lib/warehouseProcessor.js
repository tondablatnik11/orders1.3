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

    layoutData.forEach((position) => {
        const binId = position.id;
        const visualAddress = position.address;

        if (!visualAddress || typeof visualAddress !== 'string' || !binId || binId.length < 8) {
            console.warn(`Varování: Přeskakuji řádek v layoutu, chybí adresa nebo ID.`);
            return;
        }

        const stockInfo = stockMap.get(binId) || null;
        
        const addressParts = visualAddress.split('-').map(Number);
        const [haus, regal, platz] = [addressParts[0], addressParts[1], addressParts[3]];

        const levelString = binId.substring(4, 6);
        const ebene = parseInt(levelString, 10);
        
        // Y souřadnice nosníku, na kterém paleta sedí
        const y = (ebene - 1) * LEVEL_HEIGHT;

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
    };

    return { grid: warehouseGrid, dimensions };
};

/**
 * Vypočítá klíčové ukazatele (KPI) z kompletního snapshotu skladu.
 * @param {Map<string, Object>} gridData - Mapa celého skladu.
 * @returns {Object} Objekt s KPI.
 */
export const calculateKPIs = (gridData) => {
    if (!gridData || gridData.size === 0) {
        return { totalBins: 0, occupiedBins: 0, occupancyRate: 0, uniqueSKUs: 0, totalPallets: 0 };
    }
    const gridArray = Array.from(gridData.values());
    const occupiedBins = gridArray.filter(bin => bin.status === 'occupied').length;
    const allStockItems = gridArray.flatMap(bin => bin.stockData || []);
    const uniqueSKUs = new Set(allStockItems.map(item => item.Material)).size;
    const totalPallets = new Set(allStockItems.map(item => item['Storage Unit'])).size;
    return {
        totalBins: gridData.size,
        occupiedBins,
        occupancyRate: ((occupiedBins / gridData.size) * 100).toFixed(1),
        uniqueSKUs,
        totalPallets,
    };
};

/**
 * Pomocná funkce pro parsování XLSX souboru (jako LT10).
 * @param {File} file - Soubor nahraný uživatelem.
 * @returns {Promise<Array<Object>>}
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
            } catch (error) {
                reject(error);
            }
        };
        reader.onerror = (error) => reject(error);
        reader.readAsArrayBuffer(file);
    });
};