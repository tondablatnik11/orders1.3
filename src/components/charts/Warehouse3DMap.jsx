// src/components/charts/Warehouse3DMap.jsx
import React, { useMemo, useEffect } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { MapControls, Text } from '@react-three/drei';
import * as THREE from 'three';
import { binTypeToHeightMap } from '../../lib/warehouseProcessor'; // Importujeme mapu výšek

const BOX_WIDTH = 1.2;
const BOX_DEPTH = 1.2;

const Bin = ({ data, isVisible, onClick }) => {
    const { position, status, type } = data;
    const color = status === 'occupied' ? '#EF4444' : '#22C55E';
    
    // ZMĚNA: Výška se bere dynamicky podle typu pozice
    const height = binTypeToHeightMap[type] || 1.0; // Fallback na 1.0m

    if (!isVisible) return null;

    return (
        <mesh 
            position={[position[0] + BOX_WIDTH / 2, position[1] + height / 2, position[2] + BOX_DEPTH / 2]} 
            onClick={() => onClick(data)}
        >
            <boxGeometry args={[BOX_WIDTH, height, BOX_DEPTH]} />
            <meshStandardMaterial 
                color={color} 
                transparent 
                opacity={status === 'occupied' ? 0.9 : 0.4} 
                roughness={0.5} 
                metalness={0.1} 
            />
        </mesh>
    );
};

const RackStructure = ({ data }) => {
    const structure = useMemo(() => {
        const racks = {};
        data.forEach(bin => {
            const [regal, dum] = bin.address.split('-').map(Number);
            const key = `${regal}-${dum}`;
            if (!racks[key]) {
                racks[key] = { maxY: 0, x: bin.position[0], z: bin.position[2] };
            }
            const binHeight = binTypeToHeightMap[bin.type] || 0;
            racks[key].maxY = Math.max(racks[key].maxY, bin.position[1] + binHeight);
        });
        return Object.values(racks);
    }, [data]);

    return (
        <group>
            {structure.map((rack, index) => (
                <group key={index}>
                    {[0, BOX_WIDTH].map(xOffset => 
                        [0, BOX_DEPTH].map(zOffset => (
                            <mesh key={`${xOffset}-${zOffset}`} position={[rack.x + xOffset, rack.maxY / 2, rack.z + zOffset]}>
                                <boxGeometry args={[0.1, rack.maxY, 0.1]} />
                                <meshStandardMaterial color="#64748B" roughness={0.6} />
                            </mesh>
                        ))
                    )}
                </group>
            ))}
        </group>
    );
};

const CameraSetup = ({ dimensions, focusedPosition }) => {
    const { camera, controls } = useThree();
    useEffect(() => {
        if (!dimensions) return;
        const target = new THREE.Vector3();

        if (focusedPosition) {
             camera.position.set(focusedPosition[0], focusedPosition[1] + 15, focusedPosition[2] + 15);
             target.set(focusedPosition[0], focusedPosition[1], focusedPosition[2]);
        } else {
            const { center, size } = dimensions;
            camera.position.set(center[0], size[1] > 0 ? size[1] + 20 : 20, center[2] + size[2] * 1.5 + 20);
            target.set(center[0], center[1], center[2]);
        }
        
        if (controls) {
            controls.target.copy(target);
        } else {
            camera.lookAt(target);
        }
        
        camera.updateProjectionMatrix();

    }, [dimensions, focusedPosition, camera, controls]);
    return null;
};

export const Warehouse3DMap = ({ data, filteredIds, onBinClick, dimensions, focusedPosition, labels }) => {
    if(!dimensions) return null;
    return (
        <Canvas shadows camera={{ fov: 50, near: 0.5, far: 2000 }}>
            <CameraSetup dimensions={dimensions} focusedPosition={focusedPosition} />
            <ambientLight intensity={1.2} />
            <directionalLight position={[80, 80, 50]} intensity={1.5} castShadow shadow-mapSize-width={2048} shadow-mapSize-height={2048} />
            <hemisphereLight skyColor={"#a1c4fd"} groundColor={"#6b7280"} intensity={0.7} />
            
            <group>
                {data.map(bin => (<Bin key={bin.id} data={bin} isVisible={filteredIds.has(bin.id)} onClick={onBinClick} />))}
            </group>

            <RackStructure data={data} />
            
            {labels.map((label, index) => (
                <Text key={index} position={label.position} fontSize={3.5} color="black" anchorX="center" anchorY="middle" rotation={[-Math.PI / 2, 0, 0]}>
                    {label.text}
                </Text>
            ))}

            <MapControls makeDefault enableDamping dampingFactor={0.1} />
            
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[dimensions.center[0], -0.1, dimensions.center[2]]} receiveShadow>
                <planeGeometry args={[dimensions.size[0] * 2 + 100, dimensions.size[2] * 2 + 100]} />
                <shadowMaterial opacity={0.3} />
            </mesh>
            <gridHelper args={[500, 100]} position={[dimensions.center[0],-0.05,dimensions.center[2]]}/>
        </Canvas>
    );
};