// src/components/charts/Warehouse3DMap.jsx
import React, { useMemo, useRef, useEffect } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { MapControls, Text } from '@react-three/drei';
import * as THREE from 'three';

const BOX_DEPTH = 1.2;
const BOX_WIDTH = 1.2;
const PALLET_HEIGHT = 0.8;
const KLT_HEIGHT = 0.7;

const Bin = ({ data, isVisible, onClick }) => {
    const { position, status, type } = data;
    const color = status === 'occupied' ? '#EF4444' : '#22C55E';
    const height = type === 'KLT' ? KLT_HEIGHT : PALLET_HEIGHT;

    if (!isVisible) return null;

    return (
        <mesh position={[position[0] + BOX_WIDTH / 2, position[1] + height / 2, position[2] + BOX_DEPTH / 2]} onClick={() => onClick(data)}>
            <boxGeometry args={[BOX_WIDTH, height, BOX_DEPTH]} />
            <meshStandardMaterial color={color} transparent opacity={status === 'occupied' ? 0.85 : 0.3} roughness={0.5} metalness={0.1} />
        </mesh>
    );
};

const RackStructure = ({ data, dimensions }) => {
    if (!data.length || !dimensions?.rackLayout) return null;

    const structure = useMemo(() => {
        const racks = {};
        data.forEach(bin => {
            const [regal, dum] = bin.address.split('-').map(Number);
            const key = `${regal}-${dum}`;
            if (!racks[key]) {
                racks[key] = { minLevelY: bin.position[1], maxLevelY: bin.position[1], x: bin.position[0], z: bin.position[2] };
            } else {
                racks[key].minLevelY = Math.min(racks[key].minLevelY, bin.position[1]);
                racks[key].maxLevelY = Math.max(racks[key].maxLevelY, bin.position[1]);
            }
        });
        return Object.values(racks);
    }, [data]);

    const { RACK_DEPTH } = dimensions.rackLayout;
    const beamHeight = 0.1;

    return (
        <group>
            {structure.map((rack, index) => (
                <group key={index}>
                    {/* Svislé stojiny */}
                    <mesh position={[rack.x, rack.maxLevelY / 2, rack.z]}>
                        <boxGeometry args={[0.1, rack.maxLevelY, 0.1]} />
                        <meshStandardMaterial color="#64748B" roughness={0.6} />
                    </mesh>
                     <mesh position={[rack.x + BOX_WIDTH, rack.maxLevelY / 2, rack.z]}>
                        <boxGeometry args={[0.1, rack.maxLevelY, 0.1]} />
                        <meshStandardMaterial color="#64748B" roughness={0.6} />
                    </mesh>
                     <mesh position={[rack.x, rack.maxLevelY / 2, rack.z + RACK_DEPTH]}>
                        <boxGeometry args={[0.1, rack.maxLevelY, 0.1]} />
                        <meshStandardMaterial color="#64748B" roughness={0.6} />
                    </mesh>
                     <mesh position={[rack.x + BOX_WIDTH, rack.maxLevelY / 2, rack.z + RACK_DEPTH]}>
                        <boxGeometry args={[0.1, rack.maxLevelY, 0.1]} />
                        <meshStandardMaterial color="#64748B" roughness={0.6} />
                    </mesh>
                </group>
            ))}
        </group>
    );
};


const CameraSetup = ({ dimensions, focusedPosition }) => {
    const { camera } = useThree();
    useEffect(() => {
        if (dimensions) {
            if (focusedPosition) {
                 camera.position.set(focusedPosition[0], focusedPosition[1] + 15, focusedPosition[2] + 15);
                 camera.lookAt(focusedPosition[0], focusedPosition[1], focusedPosition[2]);
            } else {
                const { center, size } = dimensions;
                camera.position.set(center[0], size[1] + 20, size[2] + 30);
                camera.lookAt(center[0], center[1], center[2]);
            }
            camera.updateProjectionMatrix();
        }
    }, [dimensions, focusedPosition, camera]);
    return null;
};

export const Warehouse3DMap = ({ data, filteredIds, onBinClick, dimensions, focusedPosition, labels }) => {
    return (
        <Canvas shadows>
            <CameraSetup dimensions={dimensions} focusedPosition={focusedPosition} />
            <ambientLight intensity={1.5} />
            <directionalLight
                position={[50, 50, 50]}
                intensity={2}
                castShadow
                shadow-mapSize-width={2048}
                shadow-mapSize-height={2048}
            />
            <hemisphereLight skyColor={"#a1c4fd"} groundColor={"#6b7280"} intensity={0.8} />

            <group>
                {data.map(bin => (
                    <Bin key={bin.id} data={bin} isVisible={filteredIds.has(bin.id)} onClick={onBinClick} />
                ))}
            </group>

            <RackStructure data={data} dimensions={dimensions} />
            
            {labels.map((label, index) => (
                <Text
                    key={index}
                    position={label.position}
                    fontSize={3}
                    color="black"
                    anchorX="center"
                    anchorY="middle"
                    rotation={[-Math.PI / 2, 0, 0]}
                >
                    {label.text}
                </Text>
            ))}

            <MapControls makeDefault />

            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[dimensions.center[0], -0.1, dimensions.center[2]]} receiveShadow>
                <planeGeometry args={[dimensions.size[0]*2, dimensions.size[2]*2]} />
                <shadowMaterial opacity={0.3} />
            </mesh>
             <gridHelper args={[500, 100]} position={[0,-0.05,0]}/>
        </Canvas>
    );
};