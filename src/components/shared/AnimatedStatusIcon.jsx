// src/components/shared/AnimatedStatusIcon.jsx
"use client";
import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, Clock, Hourglass, Truck, Package, Anchor } from 'lucide-react';

// Mapování statusů na ikony a barvy
const statusConfig = {
    '10': { Icon: Hourglass, color: '#5B9BD5', label: 'Nové' },
    '30': { Icon: Clock, color: '#FBBF24', label: 'Připraveno' },
    '31': { Icon: Hourglass, color: '#F97316', label: 'V procesu' },
    '35': { Icon: Hourglass, color: '#F59E0B', label: 'Pickování' },
    '40': { Icon: Package, color: '#FBBF24', label: 'Dopickováno' },
    '50': { Icon: CheckCircle, color: '#10B981', label: 'Hotovo' },
    '60': { Icon: Anchor, color: '#059669', label: 'Připraveno pro dopravce' },
    '70': { Icon: Truck, color: '#047857', label: 'Na cestě' },
    '80': { Icon: Truck, color: '#047857', label: 'Na cestě' },
    '90': { Icon: Truck, color: '#047857', label: 'Na cestě' },
    'default': { Icon: Hourglass, color: '#64748B', label: 'Neznámý' }
};

// Definice animací pro jednotlivé ikony
const iconVariants = {
    '10': { // Hourglass
        rotate: [0, 360],
        transition: { duration: 2, repeat: Infinity, ease: "linear" }
    },
    '31': { // Hourglass
        rotate: [0, 360],
        transition: { duration: 2, repeat: Infinity, ease: "linear" }
    },
    '35': { // Hourglass
        rotate: [0, 360],
        transition: { duration: 2, repeat: Infinity, ease: "linear" }
    },
    '40': { // Package
        scale: [1, 1.05, 1],
        transition: { duration: 1.5, repeat: Infinity, ease: "easeInOut" }
    },
    '50': { // CheckCircle
        scale: [1, 1.2, 1],
        transition: { duration: 0.5, ease: "easeOut" }
    },
    '60': { // Anchor
         y: [0, -2, 0],
         transition: { duration: 2, repeat: Infinity, ease: "easeInOut" }
    },
    '70': { // Truck
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
    'default': {
        opacity: [0.7, 1, 0.7],
        transition: { duration: 2, repeat: Infinity, ease: "easeInOut" }
    }
};

const AnimatedStatusIcon = ({ status }) => {
    const config = statusConfig[String(status)] || statusConfig['default'];
    const { Icon, color } = config;
    const animation = iconVariants[String(status)] || iconVariants['default'];

    return (
        <div className="flex items-center gap-2" title={config.label}>
            <motion.div
                animate={animation}
            >
                <Icon className="w-4 h-4" style={{ color: color }} />
            </motion.div>
            <span className="font-semibold" style={{ color: color }}>{status}</span>
        </div>
    );
};

export default AnimatedStatusIcon;