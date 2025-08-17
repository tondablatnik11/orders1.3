"use client";
import React, { useState } from 'react';
import { Search } from 'lucide-react';
import { Warehouse3DMap } from '../../charts/Warehouse3DMap';

// Komponenta modálu zůstává stejná, protože je specifická pro 3D pohled
const BinDetailModal = ({ data, onClose }) => {
    if (!data) return null;
    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50 animate-fadeInUp" onClick={onClose}>
            <div className="bg-card text-foreground p-6 rounded-xl shadow-2xl max-w-lg w-full border border-border" onClick={e => e.stopPropagation()}>
                <h2 className="text-2xl font-bold mb-4 text-primary">Detail Pozice: {data.address}</h2>
                <div className="space-y-3">
                    <p className="bg-background p-2 rounded-md"><strong>Status:</strong> <span className={data.status === 'occupied' ? 'text-red-400' : 'text-green-400'}>{data.status === 'occupied' ? 'Obsazeno' : 'Volno'}</span></p>
                    {data.stockData && data.stockData.map((item, index) => (
                        <div key={index} className="border-t border-border pt-3 mt-3">
                            <p><strong>Paleta (SU):</strong> {item['Storage Unit']}</p>
                            <p><strong>Materiál:</strong> {item.Material}</p>
                            <p><strong>Množství:</strong> {item['Available stock']} {item['Base Unit of Measure']}</p>
                            <p><strong>Stáří (dny):</strong> {item['Durat.']}</p>
                        </div>
                    ))}
                </div>
                <button onClick={onClose} className="mt-6 w-full bg-primary text-white font-semibold py-2 rounded-lg hover:bg-opacity-80 transition-all">
                    Zavřít
                </button>
            </div>
        </div>
    );
};


export const Warehouse3DViewTab = ({ gridData, dimensions, labels }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedBin, setSelectedBin] = useState(null);
    const [focusedPosition, setFocusedPosition] = useState(null);

    const filteredGrid = React.useMemo(() => {
        if (!gridData) return [];
        const gridArray = Array.from(gridData.values());

        if (!searchTerm.trim()) {
            setFocusedPosition(null);
            return gridArray;
        }

        const lowerCaseSearch = searchTerm.toLowerCase();
        const result = gridArray.filter(bin => {
            if (lowerCaseSearch === 'empty' || lowerCaseSearch === 'volné') return bin.status === 'empty';
            return (
                bin.address.toLowerCase().includes(lowerCaseSearch) ||
                (bin.stockData && bin.stockData.some(item =>
                    String(item.Material)?.toLowerCase().includes(lowerCaseSearch) ||
                    String(item['Storage Unit'])?.toLowerCase().includes(lowerCaseSearch)
                ))
            );
        });
        
        if (result.length === 1) setFocusedPosition(result[0].position);
        else setFocusedPosition(null);

        return result;
    }, [gridData, searchTerm]);

    return (
        <div className="w-full h-full flex flex-col">
            <div className="p-2 border-b border-border">
                 <div className="relative w-full">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <input
                        type="text"
                        placeholder="Hledat pozici, materiál, paletu (SU) nebo 'empty'..."
                        className="w-full bg-background p-2 pl-10 border-none rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>
            <div className="flex-grow w-full h-full min-h-0">
                {gridData && 
                    <Warehouse3DMap
                        data={Array.from(gridData.values())}
                        filteredIds={new Set(filteredGrid.map(bin => bin.id))}
                        onBinClick={(bin) => setSelectedBin(bin)}
                        dimensions={dimensions}
                        focusedPosition={focusedPosition}
                        labels={labels}
                    />
                }
            </div>
            <BinDetailModal data={selectedBin} onClose={() => setSelectedBin(null)} />
        </div>
    );
};