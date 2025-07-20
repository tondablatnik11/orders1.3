"use client";
import React from 'react';
import { Draggable } from 'react-beautiful-dnd';
import { useAuth } from '@/hooks/useAuth';
import { Paperclip, MessageSquare } from 'lucide-react';
import Image from 'next/image';

const TicketCard = ({ ticket, index, onClick }) => {
    const { allUsers } = useAuth();
    const assignee = allUsers.find(u => u.uid === ticket.assignedTo);
    const categoryColors = {
        "Inbound": "bg-blue-500/20 text-blue-300",
        "Outbound": "bg-green-500/20 text-green-300",
        "Picking": "bg-yellow-500/20 text-yellow-300",
        "Packing": "bg-orange-500/20 text-orange-300",
        "Admins": "bg-purple-500/20 text-purple-300",
        "IT/Údržba": "bg-red-500/20 text-red-300",
    };

    return (
        <Draggable draggableId={ticket.id} index={index}>
            {(provided, snapshot) => (
                <div
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    {...provided.dragHandleProps}
                    onClick={onClick}
                    className={`bg-slate-700 p-3 rounded-lg mb-2 shadow-md hover:bg-slate-600 transition-all cursor-pointer border-l-4 ${snapshot.isDragging ? 'border-blue-500 scale-105 shadow-xl' : 'border-slate-600'}`}
                >
                    <p className="font-semibold text-white mb-2">{ticket.title}</p>
                    
                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-600/50">
                        <div className="flex items-center gap-2">
                            {assignee ? (
                                <Image
                                    src={assignee.avatar_url || '/profile-avatar.png'}
                                    alt={assignee.displayName || 'Avatar'}
                                    width={24}
                                    height={24}
                                    className="rounded-full"
                                    title={`Přiřazeno: ${assignee.displayName}`}
                                />
                            ) : <div className="w-6 h-6 bg-slate-600 rounded-full" title="Nepřiřazeno"></div>}
                            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${categoryColors[ticket.category] || 'bg-gray-500/20 text-gray-300'}`}>
                                {ticket.category}
                            </span>
                        </div>
                        <div className="flex items-center gap-3 text-slate-400">
                           {ticket.attachmentUrl && <Paperclip className="w-4 h-4" />}
                           {(ticket.commentCount || 0) > 0 && 
                                <div className="flex items-center gap-1">
                                    <MessageSquare className="w-4 h-4" />
                                    <span className="text-xs">{ticket.commentCount}</span>
                                </div>
                           }
                        </div>
                    </div>
                </div>
            )}
        </Draggable>
    );
};

export default TicketCard;