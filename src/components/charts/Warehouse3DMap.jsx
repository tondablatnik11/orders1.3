// src/components/charts/Warehouse3DMap.jsx
"use client";
import React, { useRef, useMemo, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Text, Html } from '@react-three/drei';
import * as THREE from 'three';

// Pomocná komponenta pro jednu skladovou pozici (regál)
const Bin = ({ position, data, onClick, onPointerOver, onPointerOut, isHighlighted, isFiltered }) => {
    const meshRef = useRef();

    // Barva podle stáří zásob
    const color = useMemo(() => {
        if (!data) return '#555'; // Prázdná pozice
        if (data.ageInDays > 180) return '#e11d48'; // Červená (staré)
        if (data.ageInDays > 90) return '#f59e0b'; // Oranžová (starší)
        return '#22c55e'; // Zelená (nové)
    }, [data]);
    
    // Zprůhlednění, pokud je pozice filtrovaná nebo zvýrazněná
    const opacity = isHighlighted ? 1.0 : isFiltered ? 0.15 : 0.7;

    return (
        <mesh
            ref={meshRef}
            position={position}
            onClick={(e) => { e.stopPropagation(); onClick(data); }}
            onPointerOver={(e) => { e.stopPropagation(); onPointerOver(data); }}
            onPointerOut={(e) => { e.stopPropagation(); onPointerOut(); }}
        >
            <boxGeometry args={[0.9, 0.9, 0.9]} />
            <meshStandardMaterial color={color} transparent opacity={opacity} />
        </mesh>
    );
};

// Tooltip, který se zobrazí při najetí myší
const Tooltip = ({ data }) => {
    if (!data) return null;
    return (
        <Html position={[0, 1, 0]}>
            <div className="bg-slate-800 text-white p-2 rounded-md border border-slate-600 text-xs w-48">
                <p><strong>Pozice:</strong> {data['Storage Bin']}</p>
                <p><strong>Materiál:</strong> {data.Material}</p>
                <p><strong>Množství:</strong> {data['Available stock']}</p>
                <p><strong>Stáří:</strong> {data.ageInDays} dní</p>
            </div>
        </Html>
    );
};

export default function Warehouse3DMap({ stockData, onBinClick }) {
    const [hoveredBin, setHoveredBin] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');

    // Převod dat ze skladu na 3D pozice a vytvoření mapy pro rychlý přístup
    const bins = useMemo(() => {
        const binMap = new Map();
        stockData.forEach(item => {
            const binId = String(item['Storage Bin']);
            const row = parseInt(binId.substring(0, 2));
            const col = parseInt(binId.substring(2, 4));
            const level = parseInt(binId.substring(4, 6));

            const position = new THREE.Vector3(
                (row - 13) * 1.2, // Odsazení řad od sebe
                (level - 1) * 1.2, // Patra nad sebou
                (col - 1) * 1.2  // Sloupce za sebou
            );
            binMap.set(binId, { position, data: item });
        });
        return binMap;
    }, [stockData]);

    const filteredBins = useMemo(() => {
        if (!searchTerm) return Array.from(bins.values());
        const lowerCaseSearch = searchTerm.toLowerCase();
        return Array.from(bins.values()).filter(bin => 
            String(bin.data.Material).toLowerCase().includes(lowerCaseSearch) ||
            String(bin.data['Storage Bin']).includes(lowerCaseSearch)
        );
    }, [bins, searchTerm]);
    
    return (
        <div className="relative h-[70vh] bg-slate-900 rounded-lg">
             <div className="absolute top-2 left-2 z-10">
                <input
                    type="text"
                    placeholder="Hledat materiál nebo pozici..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="bg-slate-800 text-white p-2 rounded-md border border-slate-600"
                />
            </div>
            <Canvas camera={{ position: [15, 15, 30], fov: 50 }}>
                <ambientLight intensity={0.8} />
                <directionalLight position={[10, 10, 5]} intensity={1} />
                <OrbitControls />

                <group>
                    {filteredBins.map(({ position, data }) => (
                        <Bin
                            key={data['Storage Bin']}
                            position={position}
                            data={data}
                            onClick={onBinClick}
                            onPointerOver={setHoveredBin}
                            onPointerOut={() => setHoveredBin(null)}
                            isHighlighted={hoveredBin?.['Storage Bin'] === data['Storage Bin']}
                            isFiltered={searchTerm !== ''}
                        />
                    ))}
                </group>

                {hoveredBin && <Tooltip data={hoveredBin} />}
            </Canvas>
        </div>
    );
}