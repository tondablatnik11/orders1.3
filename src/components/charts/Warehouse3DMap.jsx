"use client";
import React, { useMemo, useState, Suspense, useEffect } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { OrbitControls, Html, Box } from '@react-three/drei';

// Komponenta pro automatické nastavení kamery
const CameraController = ({ dimensions }) => {
    const { camera, controls } = useThree();
    useEffect(() => {
        if (controls && dimensions && dimensions.center && dimensions.size) {
            const [centerX, centerY, centerZ] = dimensions.center;
            const [sizeX, sizeY, sizeZ] = dimensions.size;
            const maxDim = Math.max(sizeX, sizeY, sizeZ);
            const cameraDistance = maxDim * 1.5;

            camera.position.set(centerX + cameraDistance, centerY + cameraDistance, centerZ + cameraDistance);
            controls.target.set(centerX, centerY, centerZ);
            controls.update();
        }
    }, [camera, controls, dimensions]);
    return null;
};

const Tooltip = ({ data }) => {
    if (!data) return null;
    return (
        <Html position={[data.position[0], data.position[1] + 0.8, data.position[2]]} center>
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

const Bin = ({ data, isFilteredOut, onBinClick, onPointerOver, onPointerOut }) => {
    const color = useMemo(() => {
        return data.status === 'occupied' ? '#ef4444' : '#22c55e';
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
                opacity={isFilteredOut ? 0.05 : 0.75}
                metalness={0.3}
                roughness={0.4}
            />
        </Box>
    );
};

export const Warehouse3DMap = ({ data, filteredIds, onBinClick, dimensions }) => {
    const [hoveredBin, setHoveredBin] = useState(null);
    return (
        <div className="w-full h-full rounded-lg shadow-2xl">
            <Canvas>
                <color attach="background" args={['#111827']} />
                <ambientLight intensity={1.8} />
                <directionalLight position={[40, 50, 30]} intensity={2.5} />
                <gridHelper args={[200, 200, '#374151', '#4b5563']} />
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
                <OrbitControls makeDefault minDistance={5} maxDistance={200} />
                <CameraController dimensions={dimensions} />
            </Canvas>
        </div>
    );
};