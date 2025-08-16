// src/components/charts/Warehouse3DMap.jsx
"use client";
import React, { useMemo, useState, Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Html } from '@react-three/drei';
import * as THREE from 'three';

// --- Konfigurace ---
const BEAM_THICKNESS = 0.08;
const PALLET_HEIGHT = 0.5;
const PALLET_WIDTH = 0.9;
const PALLET_DEPTH = 0.9;

const LEVEL_HEIGHT = 1.2;
const COLUMN_WIDTH = 1.2;
const ROW_DEPTH = 1.2;

// --- Komponenty pro stavbu ---

const HorizontalBeam = ({ position }) => (
    <mesh position={position}>
        <boxGeometry args={[COLUMN_WIDTH, BEAM_THICKNESS, BEAM_THICKNESS]} />
        <meshStandardMaterial color="#f97316" />
    </mesh>
);

const VerticalBeam = ({ position, height }) => (
    <mesh position={position}>
        <boxGeometry args={[BEAM_THICKNESS, height, BEAM_THICKNESS]} />
        <meshStandardMaterial color="#3b82f6" />
    </mesh>
);

const Pallet = ({ position, data, onClick, onPointerOver, onPointerOut, isFilteredOut }) => {
    const color = useMemo(() => {
        if (!data) return '#ffffff'; // Fallback
        if (data.ageInDays > 180) return '#e11d48';
        if (data.ageInDays > 90) return '#f59e0b';
        return '#22c55e';
    }, [data]);

    return (
        <mesh
            position={position}
            onClick={(e) => { e.stopPropagation(); onClick(data); }}
            onPointerOver={(e) => { e.stopPropagation(); onPointerOver(data); }}
            onPointerOut={(e) => { e.stopPropagation(); onPointerOut(); }}
            castShadow
        >
            <boxGeometry args={[PALLET_WIDTH, PALLET_HEIGHT, PALLET_DEPTH]} />
            <meshStandardMaterial color={color} opacity={isFilteredOut ? 0.1 : 1} transparent />
        </mesh>
    );
};

const RackCell = ({ data, position, onClick, onPointerOver, onPointerOut, isFilteredOut }) => {
    const [x, y, z] = position;
    return (
        <group>
            {/* Vykreslíme nosníky pro každou buňku */}
            <HorizontalBeam position={[x, y - (LEVEL_HEIGHT / 2), z - (ROW_DEPTH / 2) + BEAM_THICKNESS]} />
            <HorizontalBeam position={[x, y - (LEVEL_HEIGHT / 2), z + (ROW_DEPTH / 2) - BEAM_THICKNESS]} />
            
            {/* A paletu, POUZE pokud na pozici existují data */}
            {data && (
                <Pallet 
                    position={[x, y - (LEVEL_HEIGHT / 2) + (PALLET_HEIGHT / 2) + BEAM_THICKNESS, z]} 
                    data={data} 
                    onClick={onClick}
                    onPointerOver={onPointerOver}
                    onPointerOut={onPointerOut}
                    isFilteredOut={isFilteredOut}
                />
            )}
        </group>
    );
};

const Tooltip = ({ data, position }) => {
    if (!data || !position) return null;
    return (
        <Html position={new THREE.Vector3(...position)}>
            <div className="bg-slate-800 text-white p-2 rounded-md border border-slate-600 text-xs w-48 shadow-lg pointer-events-none">
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

    // ======================== KLÍČOVÁ OPRAVA ZDE ========================
    const { grid, dimensions } = useMemo(() => {
        // Pevně definujeme rozměry skladu podle zadání
        const dims = { minRow: 13, maxRow: 18, minCol: 1, maxCol: 37, minLevel: 1, maxLevel: 5 };
        const grid = new Map();
        
        // Vytvoříme mapu existujících dat pro rychlé vyhledávání
        const stockMap = new Map((stockData || []).map(item => [String(item['Storage Bin']), item]));

        // Projdeme VŠECHNY možné pozice a vytvoříme pro ně záznam
        for (let r = dims.minRow; r <= dims.maxRow; r++) {
            for (let c = dims.minCol; c <= dims.maxCol; c++) {
                for (let l = dims.minLevel; l <= dims.maxLevel; l++) {
                    // Sestavíme ID pozice (předpokládáme formát AABBCCDD, kde DD je '01')
                    const binId = `${String(r).padStart(2, '0')}${String(c).padStart(2, '0')}${String(l).padStart(2, '0')}1`;
                    
                    const position = [
                        (r - dims.minRow) * COLUMN_WIDTH,
                        (l - dims.minLevel) * LEVEL_HEIGHT,
                        (c - dims.minCol) * ROW_DEPTH
                    ];

                    grid.set(binId, {
                        id: binId,
                        position,
                        data: stockMap.get(binId) || null // Pokud data existují, přiřadíme je, jinak null
                    });
                }
            }
        }
        return { grid, dimensions: dims };
    }, [stockData]);
    // ====================================================================

    const filteredMaterials = useMemo(() => {
        if (!searchTerm) return null;
        const lowerCaseSearch = searchTerm.toLowerCase();
        const found = new Set();
        for (const cell of grid.values()) {
            if (cell.data && (
                String(cell.data.Material).toLowerCase().includes(lowerCaseSearch) ||
                String(cell.data['Storage Bin']).includes(lowerCaseSearch)
            )) {
                found.add(cell.data['Storage Bin']);
            }
        }
        return found;
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
                        isFilteredOut={isFiltered && (!data || !filteredMaterials.has(data['Storage Bin']))}
                    />
                ))}

                {/* Vykreslení vertikálních stojin */}
                {(() => {
                    const beams = [];
                    const { minRow, maxRow, minCol, maxCol, minLevel, maxLevel } = dimensions;
                    const height = (maxLevel - minLevel + 1) * LEVEL_HEIGHT;
                    if (!isFinite(height)) return null;

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
                         <Tooltip data={hoveredData} position={grid.get(String(hoveredData['Storage Bin']))?.position} />
                    </Suspense>
                )}
            </Canvas>
        </div>
    );
}