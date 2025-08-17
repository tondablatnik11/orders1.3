"use client";
import React, { useMemo, useState, Suspense, useEffect } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { OrbitControls, Html, Box } from '@react-three/drei';

// --- Konfigurace rozměrů ---
const LEVEL_HEIGHT = 1.8;
const BEAM_THICKNESS = 0.1;
const PALLET_SIZE = [1.2, 1.4, 1.0]; // Šířka, Výška, Hloubka reálné palety

// --- Komponenty pro stavbu regálu ---
const VerticalBeam = ({ position, height }) => (
    <Box position={position} args={[BEAM_THICKNESS, height, BEAM_THICKNESS]}>
        <meshStandardMaterial color="#3b82f6" metalness={0.6} roughness={0.4} />
    </Box>
);

const HorizontalBeam = ({ position, length }) => (
    <Box position={position} args={[length, BEAM_THICKNESS, BEAM_THICKNESS]}>
        <meshStandardMaterial color="#f97316" metalness={0.4} roughness={0.5} />
    </Box>
);

const Pallet = ({ position, status, onClick, onPointerOver, onPointerOut, isFilteredOut }) => {
    const color = useMemo(() => (status === 'occupied' ? '#ef4444' : '#22c55e'), [status]);
    return (
        <Box
            args={PALLET_SIZE}
            position={[position[0], position[1] + PALLET_SIZE[1] / 2, position[2]]}
            onClick={onClick}
            onPointerOver={onPointerOver}
            onPointerOut={onPointerOut}
        >
            <meshStandardMaterial
                color={color}
                transparent
                opacity={isFilteredOut ? 0.1 : (status === 'occupied' ? 0.85 : 0.6)}
                metalness={0.1}
                roughness={0.8}
            />
        </Box>
    );
};

// Komponenta pro automatické nastavení kamery
const CameraController = ({ dimensions }) => { /* ... (beze změny) ... */ };
const Tooltip = ({ data }) => { /* ... (beze změny) ... */ };

// --- Hlavní komponenta ---
export const Warehouse3DMap = ({ data, filteredIds, onBinClick, dimensions }) => {
    const [hoveredBin, setHoveredBin] = useState(null);

    const structure = useMemo(() => {
        if (!data || data.length === 0) return { beams: [], verticals: [] };

        const verticals = new Map();
        const beams = [];
        const uniqueLevels = new Set();
        const uniqueX = new Set();
        const uniqueZ = new Set();

        data.forEach(bin => {
            const [x, y, z] = bin.position;
            uniqueLevels.add(y - BEAM_THICKNESS / 2);
            uniqueX.add(x);
            uniqueZ.add(z);
        });

        const levels = Array.from(uniqueLevels).sort((a, b) => a - b);
        const xCoords = Array.from(uniqueX).sort((a, b) => a - b);
        const zCoords = Array.from(uniqueZ).sort((a, b) => a - b);
        const totalHeight = (levels.length) * LEVEL_HEIGHT;

        // Vytvoření vertikálních stojin
        xCoords.forEach(x => {
            zCoords.forEach(z => {
                const key = `${x.toFixed(2)}-${z.toFixed(2)}`;
                if (!verticals.has(key)) {
                    verticals.set(key, 
                        <VerticalBeam 
                            key={`v-${key}`}
                            position={[x - PALLET_SIZE[0]/2, totalHeight/2 - LEVEL_HEIGHT, z]}
                            height={totalHeight}
                        />
                    );
                    verticals.set(`${(x + PALLET_SIZE[0]).toFixed(2)}-${z.toFixed(2)}`,
                         <VerticalBeam 
                            key={`v-${(x + PALLET_SIZE[0]).toFixed(2)}-${z}`}
                            position={[x + PALLET_SIZE[0]/2, totalHeight/2 - LEVEL_HEIGHT, z]}
                            height={totalHeight}
                        />
                    );
                }
            });
        });
        
        // Vytvoření horizontálních nosníků
        data.forEach(bin => {
            const [x, y, z] = bin.position;
            const beamY = y - BEAM_THICKNESS / 2;
            beams.push(<HorizontalBeam key={`h-${bin.id}-1`} position={[x, beamY, z - PALLET_SIZE[2]/2]} length={PALLET_SIZE[0]} />);
            beams.push(<HorizontalBeam key={`h-${bin.id}-2`} position={[x, beamY, z + PALLET_SIZE[2]/2]} length={PALLET_SIZE[0]} />);
        });

        return { beams, verticals: Array.from(verticals.values()) };
    }, [data]);

    return (
        <div className="w-full h-full rounded-lg shadow-2xl">
            <Canvas>
                <color attach="background" args={['#111827']} />
                <ambientLight intensity={1.8} />
                <directionalLight position={[40, 50, 30]} intensity={2.5} />
                <gridHelper args={[200, 200, '#374151', '#4b5563']} />
                <Suspense fallback={null}>
                    {/* Vykreslení struktury */}
                    {structure.verticals}
                    {structure.beams}

                    {/* Vykreslení palet */}
                    {data.map((bin) => (
                        <Pallet
                            key={bin.id}
                            position={bin.position}
                            status={bin.status}
                            onClick={(e) => { e.stopPropagation(); onBinClick(bin); }}
                            onPointerOver={(e) => { e.stopPropagation(); setHoveredBin(bin); }}
                            onPointerOut={() => setHoveredBin(null)}
                            isFilteredOut={!filteredIds.has(bin.id)}
                        />
                    ))}
                </Suspense>
                {hoveredBin && <Tooltip data={hoveredBin} />}
                <OrbitControls makeDefault minDistance={5} maxDistance={200} />
                <CameraController dimensions={dimensions} />
            </Canvas>
        </div>
    );
};