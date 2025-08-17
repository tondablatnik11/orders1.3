"use client";
import React, { useMemo, useState, Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Html, Box } from '@react-three/drei';

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

export const Warehouse3DMap = ({ data, filteredIds, onBinClick }) => {
    const [hoveredBin, setHoveredBin] = useState(null);
    return (
        <div className="w-full h-full rounded-lg shadow-2xl">
            <Canvas camera={{ position: [25, 25, 25], fov: 50 }}>
                <color attach="background" args={['#111827']} />
                <ambientLight intensity={1.8} />
                <directionalLight position={[10, 15, 5]} intensity={2.5} />
                <directionalLight position={[-10, -5, -10]} intensity={1} />
                <pointLight position={[0, 20, 0]} intensity={2} color="#3b82f6" distance={50} />
                <OrbitControls makeDefault minDistance={5} maxDistance={100} enablePan={true} panSpeed={0.8} />
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
            </Canvas>
        </div>
    );
};