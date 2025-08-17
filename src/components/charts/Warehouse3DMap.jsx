// src/components/charts/Warehouse3DMap.jsx
"use client";
import React, { useMemo, useState, Suspense, useEffect, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Html, Box, Instances, Instance, Text, Grid } from '@react-three/drei';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import * as THREE from 'three';

// --- Konfigurace Vzhledu ---
const LEVEL_HEIGHT = 1.5;
const PALLET_WIDTH = 1.2;
const PALLET_DEPTH = 1.0;
const PALLET_VISUAL_HEIGHT = 1.3;
const BEAM_THICKNESS = 0.1;

// --- Komponenty pro stavbu ---
const VerticalBeam = ({ position, height }) => (
    <Box position={position} args={[BEAM_THICKNESS, height, BEAM_THICKNESS]}>
        <meshStandardMaterial color="#555" metalness={0.8} roughness={0.2} />
    </Box>
);

const Pallet = ({ position, status, onClick, onPointerOver, onPointerOut, isFilteredOut }) => {
    const color = useMemo(() => (status === 'occupied' ? '#ff4d4d' : '#00aaff'), [status]);
    const y_pos = position[1] + PALLET_VISUAL_HEIGHT / 2;
    return (
        <Box
            args={[PALLET_WIDTH * 0.9, PALLET_VISUAL_HEIGHT, PALLET_DEPTH * 0.9]}
            position={[position[0], y_pos, position[2]]}
            onClick={onClick} onPointerOver={onPointerOver} onPointerOut={onPointerOut}>
            <meshStandardMaterial
                color={color}
                emissive={color} // Klíčové pro "glow" efekt
                emissiveIntensity={status === 'occupied' ? 0.8 : 0.5}
                toneMapped={false} // Zajistí, že barvy zůstanou syté
                transparent
                opacity={isFilteredOut ? 0.05 : (status === 'occupied' ? 0.9 : 0.7)}
            />
        </Box>
    );
};

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

const Tooltip = ({ data }) => { /* ... (beze změny) ... */ };

// --- Hlavní komponenta ---
export const Warehouse3DMap = ({ data, filteredIds, onBinClick, dimensions, focusedPosition, labels }) => {
    const [hoveredBin, setHoveredBin] = useState(null);

    const structure = useMemo(() => {
        if (!data || data.length === 0 || !dimensions) return { verticals: [], pallets: [] };

        const verticalsMap = new Map();
        const pallets = data;
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
        });

        return { verticals: Array.from(verticalsMap.values()), pallets };
    }, [data, dimensions]);

    return (
        <div className="w-full h-full rounded-lg shadow-2xl">
            <Canvas camera={{ fov: 50 }}>
                <color attach="background" args={['#101010']} />
                <fog attach="fog" args={['#101010', 50, 200]} />
                <ambientLight intensity={1.0} />
                <directionalLight position={[50, 50, 50]} intensity={1.5} />
                
                <Grid
                    position={[dimensions?.center[0] || 0, 0, dimensions?.center[2] || 0]}
                    args={[300, 300]} cellSize={2} cellThickness={1} cellColor={"#6f6f6f"}
                    sectionSize={10} sectionThickness={1.5} sectionColor={"#00aaff"}
                    fadeDistance={150} fadeStrength={1} infiniteGrid
                />
                
                <Suspense fallback={null}>
                    <Instances limit={structure.verticals.length} range={structure.verticals.length}>
                        <boxGeometry args={[BEAM_THICKNESS, 1, BEAM_THICKNESS]} />
                        <meshStandardMaterial color="#555" metalness={0.8} roughness={0.2} />
                        {structure.verticals.map((v, i) => <Instance key={i} scale-y={v.height} position={v.position} />)}
                    </Instances>

                    {structure.pallets.map((bin) => (
                        <Pallet
                            key={bin.id} position={bin.position} status={bin.status}
                            onClick={(e) => { e.stopPropagation(); onBinClick(bin); }}
                            onPointerOver={(e) => { e.stopPropagation(); document.body.style.cursor = 'pointer'; setHoveredBin(bin); }}
                            onPointerOut={() => { document.body.style.cursor = 'default'; setHoveredBin(null); }}
                            isFilteredOut={!filteredIds.has(bin.id)}
                        />
                    ))}

                    {labels && labels.map((label, index) => (
                        <Text
                            key={index} position={label.position} rotation={[-Math.PI / 2, 0, 0]}
                            fontSize={2} color="#00aaff" anchorX="center" anchorY="middle"
                        >
                            {label.text}
                        </Text>
                    ))}
                </Suspense>
                
                {hoveredBin && <Tooltip data={hoveredBin} />}
                <OrbitControls makeDefault minDistance={5} maxDistance={150} enableDamping dampingFactor={0.1} />
                <CameraController focusedPosition={focusedPosition} initialDimensions={dimensions} />

                <EffectComposer>
                    <Bloom luminanceThreshold={0.5} intensity={1.2} mipmapBlur />
                </EffectComposer>
            </Canvas>
        </div>
    );
};