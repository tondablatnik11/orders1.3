// src/components/charts/Warehouse3DMap.jsx
"use client";
import React, { useMemo, useState, Suspense, useEffect, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Html, Box, Instances, Instance, Text, Grid } from '@react-three/drei';
import * as THREE from 'three';

// --- Konfigurace Vzhledu ---
const LEVEL_HEIGHT = 1.6;
const BIN_WIDTH = 1.2;
const BIN_DEPTH = 1.0;
const BIN_VISUAL_HEIGHT = 1.5; // Výška jednoho bloku pozice

// --- Komponenty pro stavbu ---
const CameraController = ({ focusedPosition, initialDimensions }) => {
    const { camera, controls } = useThree();
    const initialTarget = useRef(new THREE.Vector3());
    const initialPosition = useRef(new THREE.Vector3());

    useEffect(() => {
        if (controls && initialDimensions && initialDimensions.center && initialDimensions.size) {
            const [centerX, centerY, centerZ] = initialDimensions.center;
            const [sizeX, sizeY, sizeZ] = initialDimensions.size;
            const maxDim = Math.max(sizeX, sizeY, sizeZ);
            const cameraDistance = maxDim * 1.2;
            
            initialTarget.current.set(centerX, centerY > 0 ? centerY : 0, centerZ);
            initialPosition.current.set(centerX + cameraDistance, centerY + cameraDistance, centerZ + cameraDistance);

            camera.position.copy(initialPosition.current);
            controls.target.copy(initialTarget.current);
            controls.update();
        }
    }, [camera, controls, initialDimensions]);
    
    useFrame(() => {
        const targetPos = focusedPosition 
            ? new THREE.Vector3(focusedPosition[0], focusedPosition[1], focusedPosition[2]) 
            : initialTarget.current;
            
        const cameraPos = focusedPosition
            ? new THREE.Vector3(targetPos.x + 10, targetPos.y + 10, targetPos.z + 10)
            : initialPosition.current;

        if (controls.target.distanceTo(targetPos) > 0.01) {
            controls.target.lerp(targetPos, 0.05);
            camera.position.lerp(cameraPos, 0.05);
        }
        controls.update();
    });

    return null;
};

const Tooltip = ({ data }) => {
    if (!data) return null;
    return (
        <Html position={[data.position[0], data.position[1] + BIN_VISUAL_HEIGHT, data.position[2]]} center>
            <div className="bg-wh-card text-wh-text-primary p-2 rounded-md shadow-lg text-xs w-48 border border-wh-border">
                <p className="font-bold text-wh-brand-blue">{data.address}</p>
                <p>{data.status === 'occupied' ? 'Obsazeno' : 'Volné'}</p>
                {data.stockData && data.stockData.map((item, index) => (
                    <div key={index} className="mt-1 pt-1 border-t border-wh-border">
                        <p><span className="font-semibold">Materiál:</span> {item.Material}</p>
                        <p><span className="font-semibold">Paleta:</span> {item['Storage Unit']}</p>
                    </div>
                ))}
            </div>
        </Html>
    );
};

// --- Hlavní komponenta ---
export const Warehouse3DMap = ({ data, filteredIds, onBinClick, dimensions, focusedPosition, labels }) => {
    const [hoveredBin, setHoveredBin] = useState(null);

    return (
        <div className="w-full h-full rounded-lg shadow-2xl">
            <Canvas camera={{ fov: 50 }}>
                <color attach="background" args={['#1a202c']} />
                <fog attach="fog" args={['#1a202c', 60, 250]} />
                <ambientLight intensity={2.5} />
                <directionalLight position={[50, 50, 50]} intensity={3.5} />
                
                <Grid
                    position={[dimensions?.center[0] || 0, -0.01, dimensions?.center[2] || 0]}
                    args={[300, 300]} cellSize={2} cellThickness={1} cellColor={"#6f6f6f"}
                    sectionSize={10} sectionThickness={1.5} sectionColor={"#3b82f6"}
                    fadeDistance={180} fadeStrength={1} infiniteGrid
                />
                
                <Suspense fallback={null}>
                    {/* Skladové pozice (Instanced) */}
                    <Instances limit={data.length} range={data.length}>
                        <boxGeometry args={[BIN_WIDTH, BIN_VISUAL_HEIGHT, BIN_DEPTH]} />
                        <meshStandardMaterial />
                        {data.map((bin) => {
                            const isFilteredOut = !filteredIds.has(bin.id);
                            const y_pos = bin.position[1] + BIN_VISUAL_HEIGHT / 2;
                            return (
                                <Instance 
                                    key={bin.id} 
                                    position={[bin.position[0], y_pos, bin.position[2]]}
                                    color={bin.status === 'occupied' ? '#ef4444' : '#22c55e'}
                                    scale={isFilteredOut ? 0.001 : 1}
                                    onClick={(e) => { e.stopPropagation(); onBinClick(bin); }}
                                    onPointerOver={(e) => { e.stopPropagation(); document.body.style.cursor = 'pointer'; setHoveredBin(bin); }}
                                    onPointerOut={() => { document.body.style.cursor = 'default'; setHoveredBin(null); }}
                                />
                            );
                        })}
                    </Instances>

                    {/* Popisky na podlaze */}
                    {labels && labels.map((label, index) => (
                        <Text
                            key={index} position={label.position} rotation={[-Math.PI / 2, 0, 0]}
                            fontSize={3} color="#f9fafb" anchorX="center" anchorY="middle"
                        >
                            {label.text}
                        </Text>
                    ))}
                </Suspense>
                
                {hoveredBin && <Tooltip data={hoveredBin} />}
                <OrbitControls makeDefault minDistance={10} maxDistance={200} enableDamping dampingFactor={0.1} />
                <CameraController focusedPosition={focusedPosition} initialDimensions={dimensions} />
            </Canvas>
        </div>
    );
};