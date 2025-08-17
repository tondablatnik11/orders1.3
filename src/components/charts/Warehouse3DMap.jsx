"use client";
import React, { useMemo, useState, Suspense, useEffect, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Html, Box, Instances, Instance } from '@react-three/drei';
import * as THREE from 'three';

// --- Finální Konfigurace Rozměrů ---
const LEVEL_HEIGHT = 1.5;
const BEAM_THICKNESS = 0.1;
const PALLET_WIDTH = 1.2;
const PALLET_DEPTH = 1.0;
const PALLET_VISUAL_HEIGHT = 1.3;

// --- Komponenta pro plynulý pohyb a zoom kamery ---
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
            
            initialTarget.current.set(centerX, centerY, centerZ);
            initialPosition.current.set(centerX + cameraDistance, centerY + cameraDistance, centerZ + cameraDistance);

            camera.position.copy(initialPosition.current);
            controls.target.copy(initialTarget.current);
            controls.update();
        }
    }, [camera, controls, initialDimensions]);
    
    useFrame(() => {
        const targetPos = focusedPosition 
            ? new THREE.Vector3(focusedPosition[0], focusedPosition[1] + 1, focusedPosition[2]) 
            : initialTarget.current;
            
        const cameraPos = focusedPosition
            ? new THREE.Vector3(focusedPosition[0] + 10, focusedPosition[1] + 10, focusedPosition[2] + 10)
            : initialPosition.current;

        controls.target.lerp(targetPos, 0.05);
        camera.position.lerp(cameraPos, 0.05);
        controls.update();
    });

    return null;
};

const Tooltip = ({ data }) => {
    if (!data) return null;
    const y_pos = data.position[1] + BEAM_THICKNESS / 2 + PALLET_VISUAL_HEIGHT;
    return (
        <Html position={[data.position[0], y_pos, data.position[2]]} center>
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
export const Warehouse3DMap = ({ data, filteredIds, onBinClick, dimensions, focusedPosition }) => {
    const [hoveredBin, setHoveredBin] = useState(null);

    const structure = useMemo(() => {
        if (!data || data.length === 0 || !dimensions) return { verticals: [], horizontals: [], pallets: [] };

        const verticalsMap = new Map();
        const horizontalsMap = new Map();
        const pallets = data; // Palety už máme
        const rackLayout = new Map();

        data.forEach(bin => {
            const key = `${bin.position[0]}-${bin.position[2]}`;
            if (!rackLayout.has(key)) rackLayout.set(key, []);
            rackLayout.get(key).push(bin.position[1]);
        });
        
        const maxWarehouseY = dimensions.maxLevelY || 0;
        const totalUnifiedHeight = maxWarehouseY + LEVEL_HEIGHT;

        rackLayout.forEach((levels, key) => {
            const [x, z] = key.split('-').map(Number);
            const y_center = totalUnifiedHeight / 2 - LEVEL_HEIGHT / 2;
            verticalsMap.set(`${key}-1`, { position: [x - PALLET_WIDTH / 2, y_center, z], height: totalUnifiedHeight });
            verticalsMap.set(`${key}-2`, { position: [x + PALLET_WIDTH / 2, y_center, z], height: totalUnifiedHeight });
            levels.forEach(y => {
                const beamKey = `${key}-${y}`;
                if (!horizontalsMap.has(beamKey)) {
                    horizontalsMap.set(beamKey, [
                        { position: [x, y, z - PALLET_DEPTH / 2] },
                        { position: [x, y, z + PALLET_DEPTH / 2] },
                    ]);
                }
            });
        });

        return { 
            verticals: Array.from(verticalsMap.values()), 
            horizontals: Array.from(horizontalsMap.values()).flat(), 
            pallets 
        };
    }, [data, dimensions]);

    return (
        <div className="w-full h-full rounded-lg shadow-2xl">
            <Canvas camera={{ fov: 50 }}>
                <color attach="background" args={['#111827']} />
                <ambientLight intensity={1.8} />
                <directionalLight position={[50, 50, 50]} intensity={2.5} />
                <gridHelper args={[300, 300, '#374151', '#4b5563']} />
                
                <Suspense fallback={null}>
                    {/* Vertikální nosníky (Instanced) */}
                    <Instances limit={structure.verticals.length} range={structure.verticals.length}>
                        <boxGeometry args={[BEAM_THICKNESS * 2, 1, BEAM_THICKNESS * 2]} />
                        <meshStandardMaterial color="#3b82f6" metalness={0.6} roughness={0.4} />
                        {structure.verticals.map((v, i) => <Instance key={i} scale-y={v.height} position={v.position} />)}
                    </Instances>

                    {/* Horizontální nosníky (Instanced) */}
                    <Instances limit={structure.horizontals.length} range={structure.horizontals.length}>
                        <boxGeometry args={[PALLET_WIDTH, BEAM_THICKNESS, BEAM_THICKNESS * 2]} />
                        <meshStandardMaterial color="#f97316" metalness={0.4} roughness={0.5} />
                        {structure.horizontals.map((h, i) => <Instance key={i} position={h.position} />)}
                    </Instances>

                    {/* Palety (Instanced) */}
                    <Instances limit={structure.pallets.length} range={structure.pallets.length}>
                        <boxGeometry args={[PALLET_WIDTH, PALLET_VISUAL_HEIGHT, PALLET_DEPTH]} />
                        <meshStandardMaterial transparent />
                        {structure.pallets.map((bin) => {
                            const isFilteredOut = !filteredIds.has(bin.id);
                            const y_pos = bin.position[1] + BEAM_THICKNESS / 2 + PALLET_VISUAL_HEIGHT / 2;
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
                </Suspense>
                
                {hoveredBin && <Tooltip data={hoveredBin} />}
                <OrbitControls makeDefault minDistance={5} maxDistance={300} enableDamping dampingFactor={0.1} />
                <CameraController focusedPosition={focusedPosition} initialDimensions={dimensions} />
            </Canvas>
        </div>
    );
};