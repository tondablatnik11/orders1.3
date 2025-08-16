// src/components/charts/Warehouse3DMap.jsx
"use client";
import React, { useRef, useMemo, useState, Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Text, Html } from '@react-three/drei';
import * as THREE from 'three';

// --- Konfigurace rozměrů ---
const BEAM_THICKNESS = 0.08;
const PALLET_HEIGHT = 0.5;
const PALLET_WIDTH = 0.9;
const PALLET_DEPTH = 0.9;

const LEVEL_HEIGHT = 1.2;
const COLUMN_WIDTH = 1.2;
const ROW_DEPTH = 1.2;

// --- Komponenty pro stavbu regálu ---

// Oranžový nosník, na kterém leží paleta
const HorizontalBeam = ({ position }) => (
    <mesh position={position}>
        <boxGeometry args={[COLUMN_WIDTH, BEAM_THICKNESS, BEAM_THICKNESS]} />
        <meshStandardMaterial color="#f97316" />
    </mesh>
);

// Modrá vertikální stojina regálu
const VerticalBeam = ({ position, height }) => (
    <mesh position={position}>
        <boxGeometry args={[BEAM_THICKNESS, height, BEAM_THICKNESS]} />
        <meshStandardMaterial color="#3b82f6" />
    </mesh>
);

// Paleta reprezentující obsazenou pozici
const Pallet = ({ position, data, onClick, onPointerOver, onPointerOut, isFiltered }) => {
    const color = useMemo(() => {
        if (data.ageInDays > 180) return '#e11d48'; // Červená
        if (data.ageInDays > 90) return '#f59e0b'; // Oranžová
        return '#22c55e'; // Zelená
    }, [data.ageInDays]);

    return (
        <mesh
            position={position}
            onClick={(e) => { e.stopPropagation(); onClick(data); }}
            onPointerOver={(e) => { e.stopPropagation(); onPointerOver(data); }}
            onPointerOut={(e) => { e.stopPropagation(); onPointerOut(); }}
            castShadow
        >
            <boxGeometry args={[PALLET_WIDTH, PALLET_HEIGHT, PALLET_DEPTH]} />
            <meshStandardMaterial color={color} opacity={isFiltered ? 0.25 : 1} transparent />
        </mesh>
    );
};

// Celá regálová buňka (stojiny, nosníky a případně paleta)
const RackCell = ({ data, position, onClick, onPointerOver, onPointerOut, isFiltered }) => {
    const [x, y, z] = position;

    return (
        <group>
            {/* Oranžové nosníky */}
            <HorizontalBeam position={[x, y - (LEVEL_HEIGHT / 2), z - (ROW_DEPTH / 2) + BEAM_THICKNESS]} />
            <HorizontalBeam position={[x, y - (LEVEL_HEIGHT / 2), z + (ROW_DEPTH / 2) - BEAM_THICKNESS]} />
            
            {/* Paleta, pokud je pozice obsazená */}
            {data && (
                <Pallet 
                    position={[x, y - (LEVEL_HEIGHT / 2) + (PALLET_HEIGHT / 2) + BEAM_THICKNESS, z]} 
                    data={data} 
                    onClick={onClick}
                    onPointerOver={onPointerOver}
                    onPointerOut={onPointerOut}
                    isFiltered={isFiltered}
                />
            )}
        </group>
    );
};

// Tooltip při najetí myší
const Tooltip = ({ data, position }) => {
    if (!data) return null;
    return (
        <Html position={position}>
            <div className="bg-slate-800 text-white p-2 rounded-md border border-slate-600 text-xs w-48 shadow-lg">
                <p><strong>Pozice:</strong> {data['Storage Bin']}</p>
                <p><strong>Materiál:</strong> {data.Material}</p>
                <p><strong>Množství:</strong> {data['Available stock']}</p>
                <p><strong>Stáří:</strong> {data.ageInDays} dní</p>
            </div>
        </Html>
    );
};

// --- Hlavní komponenta ---
export default function Warehouse3DMap({ stockData, onBinClick }) {
    const [hoveredData, setHoveredData] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');

    // Generování kompletní mřížky skladu, včetně prázdných pozic
    const { grid, dimensions } = useMemo(() => {
        if (!stockData || stockData.length === 0) return { grid: new Map(), dimensions: {} };

        const stockMap = new Map(stockData.map(item => [String(item['Storage Bin']), item]));
        const grid = new Map();

        let minRow = Infinity, maxRow = -Infinity, minCol = Infinity, maxCol = -Infinity, minLevel = Infinity, maxLevel = -Infinity;

        stockData.forEach(item => {
            const binId = String(item['Storage Bin']);
            const row = parseInt(binId.substring(0, 2));
            const col = parseInt(binId.substring(2, 4));
            const level = parseInt(binId.substring(4, 6));

            if (row < minRow) minRow = row;
            if (row > maxRow) maxRow = row;
            if (col < minCol) minCol = col;
            if (col > maxCol) maxCol = col;
            if (level < minLevel) minLevel = level;
            if (level > maxLevel) maxLevel = level;
        });

        for (let r = minRow; r <= maxRow; r++) {
            for (let c = minCol; c <= maxCol; c++) {
                for (let l = minLevel; l <= maxLevel; l++) {
                    const binId = `${String(r).padStart(2, '0')}${String(c).padStart(2, '0')}${String(l).padStart(2, '0')}1`; // Předpokládáme pozici 1
                    
                    const position = [
                        (r - minRow) * COLUMN_WIDTH,
                        (l - minLevel) * LEVEL_HEIGHT,
                        (c - minCol) * ROW_DEPTH
                    ];

                    grid.set(binId, {
                        id: binId,
                        position,
                        data: stockMap.get(binId) || null
                    });
                }
            }
        }

        return { grid, dimensions: { minRow, maxRow, minCol, maxCol, minLevel, maxLevel } };
    }, [stockData]);

    const filteredGrid = useMemo(() => {
        if (!searchTerm) return Array.from(grid.values());
        const lowerCaseSearch = searchTerm.toLowerCase();
        return Array.from(grid.values()).filter(cell =>
            cell.data && (
                String(cell.data.Material).toLowerCase().includes(lowerCaseSearch) ||
                String(cell.data['Storage Bin']).includes(lowerCaseSearch)
            )
        );
    }, [grid, searchTerm]);

    const isFiltered = searchTerm !== '';

    return (
        <div className="relative h-[70vh] bg-slate-900 rounded-lg border border-slate-700">
            <div className="absolute top-2 left-2 z-10">
                <input
                    type="text"
                    placeholder="Hledat materiál nebo pozici..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="bg-slate-800 text-white p-2 rounded-md border border-slate-600"
                />
            </div>
            <Canvas shadows camera={{ position: [20, 20, 40], fov: 50 }}>
                <ambientLight intensity={0.7} />
                <directionalLight position={[10, 20, 5]} intensity={1.5} castShadow />
                <OrbitControls makeDefault />
                
                {/* Podlaha */}
                <mesh rotation={[-Math.PI / 2, 0, 0]} position={[
                    ((dimensions.maxRow - dimensions.minRow) * COLUMN_WIDTH) / 2, 
                    -LEVEL_HEIGHT/2, 
                    ((dimensions.maxCol - dimensions.minCol) * ROW_DEPTH) / 2
                ]} receiveShadow>
                    <planeGeometry args={[ (dimensions.maxRow - dimensions.minRow + 2) * COLUMN_WIDTH, (dimensions.maxCol - dimensions.minCol + 2) * ROW_DEPTH ]} />
                    <meshStandardMaterial color="#475569" />
                </mesh>
                
                {/* Vykreslení všech buněk (obsazených i prázdných) */}
                {Array.from(grid.values()).map(({ id, position, data }) => (
                    <RackCell
                        key={id}
                        data={data}
                        position={position}
                        onClick={onBinClick}
                        onPointerOver={setHoveredData}
                        onPointerOut={() => setHoveredData(null)}
                        isFiltered={isFiltered && !filteredGrid.some(cell => cell.id === id)}
                    />
                ))}

                {/* Vykreslení vertikálních stojin */}
                {(() => {
                    const beams = [];
                    const { minRow, maxRow, minCol, maxCol, minLevel, maxLevel } = dimensions;
                    const height = (maxLevel - minLevel + 1) * LEVEL_HEIGHT;
                    for (let r = minRow; r <= maxRow + 1; r++) {
                        for (let c = minCol; c <= maxCol + 1; c++) {
                            beams.push(
                                <VerticalBeam 
                                    key={`vbeam-${r}-${c}`}
                                    position={[
                                        (r - minRow - 0.5) * COLUMN_WIDTH, 
                                        height/2 - LEVEL_HEIGHT/2, 
                                        (c - minCol - 0.5) * ROW_DEPTH
                                    ]}
                                    height={height}
                                />
                            );
                        }
                    }
                    return beams;
                })()}

                {hoveredData && (
                    <Suspense fallback={null}>
                         <Tooltip data={hoveredData} position={grid.get(hoveredData['Storage Bin'])?.position} />
                    </Suspense>
                )}
            </Canvas>
        </div>
    );
}