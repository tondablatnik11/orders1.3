"use client";
import React, { useMemo, useState, Suspense, useEffect } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { OrbitControls, Html, Box } from '@react-three/drei';

// --- Konfigurace rozměrů podle reálného skladu ---
const LEVEL_HEIGHT = 1.8;
const BEAM_THICKNESS = 0.1;
const PALLET_WIDTH = 1.2;
const PALLET_DEPTH = 1.0;
const PALLET_VISUAL_HEIGHT = 1.4; // Jak vysoká se má paleta zobrazit

// --- Komponenty pro stavbu regálu ---
const VerticalBeam = ({ position, height }) => (
    <Box position={position} args={[BEAM_THICKNESS * 2, height, BEAM_THICKNESS * 2]}>
        <meshStandardMaterial color="#3b82f6" metalness={0.6} roughness={0.4} />
    </Box>
);

const HorizontalBeam = ({ position, length }) => (
    <Box position={position} args={[length, BEAM_THICKNESS, BEAM_THICKNESS * 2]}>
        <meshStandardMaterial color="#f97316" metalness={0.4} roughness={0.5} />
    </Box>
);

const Pallet = ({ position, status, onClick, onPointerOver, onPointerOut, isFilteredOut }) => {
    const color = useMemo(() => (status === 'occupied' ? '#ef4444' : '#22c55e'), [status]);
    // Paleta sedí na nosníku, takže její střed je polovina její VIZUÁLNÍ výšky nad ním
    const y_pos = position[1] + BEAM_THICKNESS / 2 + PALLET_VISUAL_HEIGHT / 2;
    return (
        <Box
            args={[PALLET_WIDTH, PALLET_VISUAL_HEIGHT, PALLET_DEPTH]}
            position={[position[0], y_pos, position[2]]}
            onClick={onClick}
            onPointerOver={onPointerOver}
            onPointerOut={onPointerOut}
        >
            <meshStandardMaterial
                color={color}
                transparent
                opacity={isFilteredOut ? 0.05 : (status === 'occupied' ? 0.85 : 0.4)}
                metalness={0.1}
                roughness={0.8}
            />
        </Box>
    );
};

// Komponenta pro automatické nastavení kamery
const CameraController = ({ dimensions }) => {
    const { camera, controls } = useThree();
    useEffect(() => {
        if (controls && dimensions && dimensions.center && dimensions.size) {
            const [centerX, centerY, centerZ] = dimensions.center;
            const [sizeX, sizeY, sizeZ] = dimensions.size;
            const maxDim = Math.max(sizeX, sizeY, sizeZ);
            const cameraDistance = maxDim * 1.2;

            camera.position.set(centerX + cameraDistance, centerY + cameraDistance, centerZ + cameraDistance);
            controls.target.set(centerX, centerY, centerZ);
            controls.update();
        }
    }, [camera, controls, dimensions]);
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
export const Warehouse3DMap = ({ data, filteredIds, onBinClick, dimensions }) => {
    const [hoveredBin, setHoveredBin] = useState(null);

    const structure = useMemo(() => {
        if (!data || data.length === 0) return { beams: [], verticals: [] };

        const verticals = new Map();
        const beams = new Map();
        const rackLayout = new Map();

        // Seskupení pozic do sloupců regálů
        data.forEach(bin => {
            const key = `${bin.position[0]}-${bin.position[2]}`; // Klíč pro sloupec (X, Z)
            if (!rackLayout.has(key)) {
                rackLayout.set(key, []);
            }
            rackLayout.get(key).push(bin.position[1]);
        });

        // Generování konstrukce pro každý sloupec
        rackLayout.forEach((levels, key) => {
            const [x, z] = key.split('-').map(Number);
            const minLevelY = Math.min(...levels);
            const maxLevelY = Math.max(...levels);
            const totalHeight = maxLevelY - minLevelY + LEVEL_HEIGHT;

            // Vertikální stojiny
            verticals.set(`${key}-1`, <VerticalBeam key={`v-${key}-1`} position={[x - PALLET_WIDTH / 2, totalHeight / 2 - LEVEL_HEIGHT / 2 + minLevelY, z]} height={totalHeight} />);
            verticals.set(`${key}-2`, <VerticalBeam key={`v-${key}-2`} position={[x + PALLET_WIDTH / 2, totalHeight / 2 - LEVEL_HEIGHT / 2 + minLevelY, z]} height={totalHeight} />);

            // Horizontální nosníky
            levels.forEach(y => {
                const beamKey = `${key}-${y}`;
                if (!beams.has(beamKey)) {
                    beams.set(beamKey, <>
                        <HorizontalBeam key={`h-${beamKey}-1`} position={[x, y, z - PALLET_DEPTH / 2]} length={PALLET_WIDTH} />
                        <HorizontalBeam key={`h-${beamKey}-2`} position={[x, y, z + PALLET_DEPTH / 2]} length={PALLET_WIDTH} />
                    </>);
                }
            });
        });

        return { beams: Array.from(beams.values()), verticals: Array.from(verticals.values()) };
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
                            onPointerOver={(e) => { e.stopPropagation(); document.body.style.cursor = 'pointer'; setHoveredBin(bin); }}
                            onPointerOut={() => { document.body.style.cursor = 'default'; setHoveredBin(null); }}
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