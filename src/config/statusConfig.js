// src/config/statusConfig.js

export const statusConfig = {
    '10': { label: 'Nová', color: '#3b82f6' },        // Blue
    '31': { label: 'Vytvořeno', color: '#22d3ee' },    // Cyan
    '35': { label: 'Tisknuto', color: '#a855f7' },     // Purple
    '40': { label: 'V procesu', color: '#f97316' },   // Orange
    '50': { label: 'Vychystáno', color: '#eab308' },  // Yellow
    '60': { label: 'Zabaleno', color: '#84cc16' },     // Lime
    '70': { label: 'Naloženo', color: '#22c55e' },     // Green
    '80': { label: 'Fakturováno', color: '#10b981' },  // Emerald
    '90': { label: 'Dokončeno', color: '#16a34a' },    // Dark Green
};

// Obecné barvy pro grafy, pokud nejsou specifické pro status
export const CHART_COLORS = [
    '#3b82f6', '#22d3ee', '#84cc16', '#f97316', '#a855f7', 
    '#eab308', '#ef4444', '#14b8a6', '#6366f1', '#ec4899'
];