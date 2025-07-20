// src/components/shared/StaticStatusIcon.jsx
"use client";
import React from 'react';
import { CheckCircle, Clock, Hourglass, Truck, Package, Anchor, AlertCircle, FilePlus, PackageSearch } from 'lucide-react';

// Mapování statusů na ikony, barvy a popisky (sdílená logika s animovanou verzí)
const statusConfig = {
    '10': { Icon: FilePlus, color: '#3b82f6', label: 'Nová zakázka' },
    '30': { Icon: Clock, color: '#eab308', label: 'Připraveno k vychystání' },
    '31': { Icon: Hourglass, color: '#f97316', label: 'V procesu' },
    '35': { Icon: PackageSearch, color: '#f59e0b', label: 'Vychystávání' },
    '40': { Icon: Package, color: '#d97706', label: 'Vychystáno' },
    '50': { Icon: CheckCircle, color: '#10b981', label: 'Zabaleno' },
    '60': { Icon: Anchor, color: '#059669', label: 'Připraveno pro dopravce' },
    '70': { Icon: Truck, color: '#047857', label: 'Na cestě' },
    '80': { Icon: Truck, color: '#047857', label: 'Na cestě' },
    '90': { Icon: Truck, color: '#047857', label: 'Na cestě' },
    'default': { Icon: AlertCircle, color: '#64748b', label: 'Neznámý' }
};

const StaticStatusIcon = ({ status }) => {
    const config = statusConfig[String(status)] || statusConfig['default'];
    const { Icon, color, label } = config;

    return (
        <div className="flex items-center gap-2" title={label}>
            <Icon className="w-4 h-4" style={{ color: color }} />
            <span className="font-semibold" style={{ color: color }}>{status}</span>
        </div>
    );
};

export default StaticStatusIcon;