// src/components/charts/Warehouse3DMap.jsx
"use client";
import React, { useMemo, useState, Suspense, useRef, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Html, Stats } from '@react-three/drei';
import * as THREE from 'three';

// --- Konfigurace Skladu ---
const WAREHOUSE_DIMS = { minRow: 13, maxRow: 18, minCol: 1, maxCol: 37, minLevel: 1, maxLevel: 5 };

// --- Konfigurace Rozměrů ---
const BEAM_THICKNESS = 0.08;
const PALLET_HEIGHT = 0.5;
const PALLET_WIDTH = 0.9;
const PALLET_DEPTH = 0.9;
const LEVEL_HEIGHT = 1.2;
const COLUMN_WIDTH = 1.2;
const ROW_DEPTH = 1.2;

// --- Komponenty ---

// Tooltip při najetí myší
const Tooltip = ({ data }) => {
    if (!data) return null;
    return (
        <div className="bg-slate-800 text-white p-2 rounded-md border border-slate-600 text-xs w-48 shadow-lg pointer-events-none">
            <p><strong>Pozice:</strong> {data['Storage Bin']}</p>
            <p><strong>Materiál:</strong> {data.Material}</p>
            <p><strong>Množství:</strong> {data['Available stock']}</p>
            <p><strong>Stáří:</strong> {data.ageInDays} dní</p>
        </div>
    );
};

// Komponenta pro vykreslení všech palet pomocí instancí
const Pallets = ({ grid, onBinClick, setHoveredData, filteredMaterials }) => {
    const meshRef = useRef();
    const tempObject = new THREE.Object3D();
    const tempColor = new THREE.Color();
    const isFiltered = filteredMaterials !== null;

    const pallets = useMemo(() => grid.filter(cell => cell.data), [grid]);

    useEffect(() => {
        let i = 0;
        for (const { position, data } of pallets) {
            const [x, y, z] = position;
            tempObject.position.set(x, y - (LEVEL_HEIGHT / 2) + (PALLET_HEIGHT / 2) + BEAM_THICKNESS, z);
            tempObject.updateMatrix();
            meshRef.current.setMatrixAt(i, tempObject.matrix);

            const isFilteredOut = isFiltered && !filteredMaterials.has(data['Storage Bin']);
            
            let color;
            if (data.ageInDays > 180) color = '#e11d48';
            else if (data.ageInDays > 90) color = '#f59e0b';
            else color = '#22c55e';
            
            meshRef.current.setColorAt(i, tempColor.set(color));
            
            // Nastavení alphy pro filtrování
            const alpha = isFilteredOut ? 0.1 : 1.0;
            const instanceColor = new THREE.Color();
            meshRef.current.getColorAt(i, instanceColor);
            // Kód pro nastavení alphy se liší podle verze Three.js, pro jednoduchost necháváme
            // Pokud byste potřeboval průhlednost, bylo by nutné použít vlastní shader.

            i++;
        }
        meshRef.current.instanceMatrix.needsUpdate = true;
        if (meshRef.current.instanceColor) {
            meshRef.current.instanceColor.needsUpdate = true;
        }
    }, [pallets, filteredMaterials]);

    return (
        <instancedMesh
            ref={meshRef}
            args={[null, null, pallets.length]}
            onClick={(e) => { e.stopPropagation(); onBinClick(pallets[e.instanceId].data); }}
            onPointerMove={(e) => { e.stopPropagation(); setHoveredData(pallets[e.instanceId].data); }}
            onPointerOut={() => setHoveredData(null)}
            castShadow
        >
            <boxGeometry args={[PALLET_WIDTH, PALLET_HEIGHT, PALLET_DEPTH]} />
            <meshStandardMaterial vertexColors />
        </instancedMesh>
    );
};


// --- Hlavní komponenta ---
export default function Warehouse3DMap({ stockData, onBinClick }) {
    const [hoveredData, setHoveredData] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');

    const { grid, dimensions } = useMemo(() => {
        const dims = WAREHOUSE_DIMS;
        const grid = [];
        const stockMap = new Map((stockData || []).map(item => [String(item['Storage Bin']), item]));

        for (let r = dims.minRow; r <= dims.maxRow; r++) {
            for (let c = dims.minCol; c <= dims.maxCol; c++) {
                for (let l = dims.minLevel; l <= dims.maxLevel; l++) {
                    const binId = `${String(r).padStart(2, '0')}${String(c).padStart(2, '0')}${String(l).padStart(2, '0')}1`;
                    const position = [
                        (r - dims.minRow) * COLUMN_WIDTH,
                        (l - dims.minLevel) * LEVEL_HEIGHT,
                        (c - dims.minCol) * ROW_DEPTH
                    ];
                    grid.push({ id: binId, position, data: stockMap.get(binId) || null });
                }
            }
        }
        return { grid, dimensions: dims };
    }, [stockData]);

    const filteredMaterials = useMemo(() => {
        if (!searchTerm) return null;
        const lowerCaseSearch = searchTerm.toLowerCase();
        const found = new Set();
        for (const cell of grid) {
            if (cell.data && (
                String(cell.data.Material).toLowerCase().includes(lowerCaseSearch) ||
                String(cell.data['Storage Bin']).includes(lowerCaseSearch)
            )) {
                found.add(cell.data['Storage Bin']);
            }
        }
        return found;
    }, [grid, searchTerm]);

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
             {hoveredData && (
                <div className="absolute top-2 right-2 z-10 pointer-events-none">
                    <Tooltip data={hoveredData} />
                </div>
            )}
            <Canvas shadows camera={{ position: [20, 20, 40], fov: 50 }}>
                <ambientLight intensity={1.5} />
                <directionalLight position={[10, 20, 5]} intensity={2.5} castShadow shadow-mapSize={[2048, 2048]} />
                <OrbitControls makeDefault />
                
                <mesh rotation={[-Math.PI / 2, 0, 0]} position={[
                    ((dimensions.maxRow - dimensions.minRow) * COLUMN_WIDTH) / 2, 
                    -LEVEL_HEIGHT / 2, 
                    ((dimensions.maxCol - dimensions.minCol) * ROW_DEPTH) / 2
                ]} receiveShadow>
                    <planeGeometry args={[ (dimensions.maxRow - dimensions.minRow + 2) * COLUMN_WIDTH, (dimensions.maxCol - dimensions.minCol + 2) * ROW_DEPTH ]} />
                    <meshStandardMaterial color="#475569" />
                </mesh>
                
                {grid.map(({ id, position }) => {
                    const [x, y, z] = position;
                    return (
                        <group key={id}>
                            <HorizontalBeam position={[x, y - (LEVEL_HEIGHT / 2), z - (ROW_DEPTH / 2) + BEAM_THICKNESS]} />
                            <HorizontalBeam position={[x, y - (LEVEL_HEIGHT / 2), z + (ROW_DEPTH / 2) - BEAM_THICKNESS]} />
                        </group>
                    )
                })}

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
                
                <Suspense fallback={null}>
                    <Pallets 
                        grid={grid} 
                        onBinClick={onBinClick} 
                        setHoveredData={setHoveredData}
                        filteredMaterials={filteredMaterials}
                    />
                </Suspense>

            </Canvas>
        </div>
    );
}