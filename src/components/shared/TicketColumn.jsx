// src/components/shared/TicketColumn.jsx
"use client";
import React from 'react';
import { Droppable } from 'react-beautiful-dnd';
import TicketCard from './TicketCard';

const TicketColumn = ({ status, tickets, onTicketClick }) => {
    const statusConfig = {
        "Vytvořeno": { color: "bg-blue-500" },
        "V řešení": { color: "bg-yellow-500" },
        "Hotovo": { color: "bg-green-500" },
    };

    return (
        <div className="bg-slate-800/50 rounded-xl w-80 flex-shrink-0">
            <div className="p-4 border-b border-slate-700">
                <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${statusConfig[status]?.color || 'bg-gray-500'}`}></div>
                    <h3 className="font-semibold text-white">{status}</h3>
                    <span className="text-sm text-slate-400 bg-slate-700 rounded-full px-2 py-0.5">{tickets.length}</span>
                </div>
            </div>
            <Droppable droppableId={status}>
                {(provided, snapshot) => (
                    <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className={`p-2 transition-colors min-h-[400px] ${snapshot.isDraggingOver ? 'bg-slate-700/50' : ''}`}
                    >
                        {tickets.map((ticket, index) => (
                            <TicketCard 
                                key={ticket.id} 
                                ticket={ticket} 
                                index={index} 
                                onClick={() => onTicketClick(ticket)} 
                            />
                        ))}
                        {provided.placeholder}
                    </div>
                )}
            </Droppable>
        </div>
    );
};

export default TicketColumn;