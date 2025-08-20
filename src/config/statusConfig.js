// src/config/statusConfig.js

export const statusConfig = {
    // Fáze plánování (studené barvy)
    '10': { label: '10', color: '#60a5fa' },        // Nová
    '31': { label: '31', color: '#38bdf8' },    // Vytvořeno
    '35': { label: '35', color: '#818cf8' },     // Tisknuto
    
    // Fáze v procesu (teplé barvy)
    '40': { label: '40', color: '#facc15' },   // V procesu
    '50': { label: '50', color: '#fb923c' },  // Vychystáno
    '60': { label: '60', color: '#f87171' },     // Zabaleno
    
    // Fáze dokončení (zelené barvy)
    '70': { label: '70', color: '#a3e635' },     // Naloženo
    '80': { label: '80', color: '#4ade80' },  // Fakturováno
    '90': { label: '90', color: '#34d399' },    // Dokončeno
};

// Obecné barvy pro grafy, pokud nejsou specifické pro status
export const CHART_COLORS = [
    '#3b82f6', '#22d3ee', '#84cc16', '#f97316', '#a855f7', 
    '#eab308', '#ef4444', '#14b8a6', '#6366f1', '#ec4899'
];