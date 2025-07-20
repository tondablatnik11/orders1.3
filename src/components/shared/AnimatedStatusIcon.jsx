// src/components/shared/AnimatedStatusIcon.jsx
"use client";
import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, Clock, Hourglass, Truck, Package, Anchor, AlertCircle, FilePlus, PackageSearch } from 'lucide-react';

// NOVÉ: Rozšířená a vylepšená konfigurace statusů
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

// UPRAVENO: Nové, charakterističtější animace
const iconVariants = {
    '10': { // FilePlus - pulzování
        scale: [1, 1.1, 1],
        transition: { duration: 1.5, repeat: Infinity, ease: "easeInOut" }
    },
    '30': { // Clock - rotace ručičky (imitace)
        rotate: [0, 360],
        transition: { duration: 10, repeat: Infinity, ease: "linear" }
    },
    '31': { // Hourglass - přesýpání (otáčení)
        rotate: [0, 180, 180, 360, 360],
        transition: { duration: 3, repeat: Infinity, ease: "easeInOut" }
    },
    '35': { // PackageSearch - "hledání"
        rotate: [-5, 5, -5],
        transition: { duration: 1, repeat: Infinity, ease: "easeInOut" }
    },
    '40': { // Package - "zavírání"
        y: [0, -2, 0],
        transition: { duration: 1.2, repeat: Infinity, ease: "easeInOut" }
    },
    '50': { // CheckCircle - potvrzení
        scale: [1, 1.2, 1],
        transition: { duration: 0.5, ease: "easeOut" }
    },
    '60': { // Anchor - "ukotvení"
         y: [0, -2, 0],
         transition: { duration: 2, repeat: Infinity, ease: "easeInOut" }
    },
    '70': { // Truck - jízda
        x: [-2, 2, -2],
        transition: { duration: 1.5, repeat: Infinity, ease: "easeInOut" }
    },
     '80': { // Truck
        x: [-2, 2, -2],
        transition: { duration: 1.5, repeat: Infinity, ease: "easeInOut" }
    },
     '90': { // Truck
        x: [-2, 2, -2],
        transition: { duration: 1.5, repeat: Infinity, ease: "easeInOut" }
    },
    'default': { // AlertCircle - blikání
        opacity: [0.5, 1, 0.5],
        transition: { duration: 1.5, repeat: Infinity, ease: "easeInOut" }
    }
};

// UPRAVENO: Přidán prop `size` pro nastavení velikosti
const AnimatedStatusIcon = ({ status, size = 'small' }) => {
    const config = statusConfig[String(status)] || statusConfig['default'];
    const { Icon, color, label } = config;
    const animation = iconVariants[String(status)] || iconVariants['default'];

    const sizeClasses = {
        small: { icon: "w-4 h-4", text: "font-semibold" },
        large: { icon: "w-20 h-20", text: "text-5xl font-bold mt-4" }
    };

    const currentSize = sizeClasses[size] || sizeClasses.small;

    return (
        <div 
            className={`flex items-center ${size === 'large' ? 'flex-col' : 'gap-2'}`} 
            title={label}
        >
            <motion.div animate={animation}>
                <Icon className={currentSize.icon} style={{ color: color }} />
            </motion.div>
            <span className={currentSize.text} style={{ color: color }}>
                {status}
            </span>
        </div>
    );
};

export default AnimatedStatusIcon;