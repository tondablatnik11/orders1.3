// src/components/charts/Warehouse3DMap.jsx
"use client";
import React, { useMemo, useState, Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Html, Box } from '@react-three/drei';
import * as THREE from 'three';

// --- Tooltip Komponenta ---
const Tooltip = ({ data }) => {
    if (!data) return null;
    return (
        <Html position={[data.position[0], data.position[1] + 0.8, data.position[2]]} center>
            <div className="bg-white p-2 rounded shadow-lg text-xs w-48">
                <p className="font-bold">{data.address}</p>
                <p>{data.status === 'occupied' ? 'Obsazeno' : 'Volné'}</p>
                {data.stockData && (
                     <p>Materiál: {data.stockData[0].Material}</p>
                )}
            </div>
        </Html>
    );
};

// --- Komponenta pro jednu pozici (paletu/box) ---
const Bin = ({ data, isFilteredOut, onBinClick, onPointerOver, onPointerOut }) => {
    const color = useMemo(() => {
        return data.status === 'occupied' ? '#ef4444' : '#22c55e'; // Červená pro obsazené, zelená pro volné
    }, [data.status]);

    const handlePointerOver = (e) => {
        e.stopPropagation();
        document.body.style.cursor = 'pointer';
        onPointerOver(data);
    };

    const handlePointerOut = (e) => {
        e.stopPropagation();
        document.body.style.cursor = 'default';
        onPointerOut();
    };
    
    return (
        <Box
            args={data.size}
            position={data.position}
            onClick={(e) => { e.stopPropagation(); onBinClick(data); }}
            onPointerOver={handlePointerOver}
            onPointerOut={handlePointerOut}
        >
            <meshStandardMaterial
                color={color}
                transparent
                opacity={isFilteredOut ? 0.05 : 0.7} // Zvýraznění filtrovaných
                metalness={0.2}
                roughness={0.5}
            />
        </Box>
    );
};


// --- Hlavní komponenta 3D mapy ---
export const Warehouse3DMap = ({ data, filteredIds, onBinClick }) => {
    const [hoveredBin, setHoveredBin] = useState(null);

    return (
        <div className="w-full h-full bg-gray-900">
            <Canvas camera={{ position: [20, 20, 20], fov: 50 }}>
                <ambientLight intensity={1.5} />
                <directionalLight position={[10, 15, 5]} intensity={2} />
                <directionalLight position={[-10, 15, -5]} intensity={1} />

                <OrbitControls 
                    makeDefault 
                    minDistance={5} 
                    maxDistance={100} 
                    enablePan={true}
                    panSpeed={0.8}
                />

                <gridHelper args={[200, 200, '#444444', '#888888']} />

                <Suspense fallback={null}>
                    {data.map((bin) => (
                        <Bin
                            key={bin.id}
                            data={bin}
                            isFilteredOut={!filteredIds.has(bin.id)}
                            onBinClick={onBinClick}
                            onPointerOver={setHoveredBin}
                            onPointerOut={() => setHoveredBin(null)}
                        />
                    ))}
                </Suspense>

                {hoveredBin && <Tooltip data={hoveredBin} />}
            </Canvas>
        </div>
    );
};