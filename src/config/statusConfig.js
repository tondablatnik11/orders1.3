// src/config/statusConfig.js

export const statusConfig = {
    // Fáze plánování (studené barvy)
    '10': { label: 'Nová', color: '#60a5fa' },        // Light Blue
    '31': { label: 'Vytvořeno', color: '#38bdf8' },    // Cyan
    '35': { label: 'Tisknuto', color: '#818cf8' },     // Indigo
    
    // Fáze v procesu (teplé barvy)
    '40': { label: 'V procesu', color: '#facc15' },   // Yellow
    '50': { label: 'Vychystáno', color: '#fb923c' },  // Orange
    '60': { label: 'Zabaleno', color: '#f87171' },     // Red-Orange
    
    // Fáze dokončení (zelené barvy)
    '70': { label: 'Naloženo', color: '#a3e635' },     // Lime
    '80': { label: 'Fakturováno', color: '#4ade80' },  // Green
    '90': { label: 'Dokončeno', color: '#34d399' },    // Emerald
};

// Obecné barvy pro grafy, pokud nejsou specifické pro status
export const CHART_COLORS = [
    '#3b82f6', '#22d3ee', '#84cc16', '#f97316', '#a855f7', 
    '#eab308', '#ef4444', '#14b8a6', '#6366f1', '#ec4899'
];