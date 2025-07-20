// src/components/tabs/TicketsTab.jsx
"use client";
import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useUI } from '@/hooks/useUI';
import { Card, CardContent } from '../ui/Card';
import { Ticket, PlusCircle, User, Filter } from 'lucide-react';
import { collection, query, onSnapshot, orderBy, doc, updateDoc, where } from 'firebase/firestore';
import TicketDetailsModal from '@/components/modals/TicketDetailsModal';
import { DragDropContext } from 'react-beautiful-dnd';
import TicketColumn from '../shared/TicketColumn';
import NewTicketModal from '../modals/NewTicketModal';

export default function TicketsTab() {
    const { t } = useUI();
    const { user, db, appId } = useAuth();
    const [tickets, setTickets] = useState([]);
    const [selectedTicket, setSelectedTicket] = useState(null);
    const [isNewTicketModalOpen, setNewTicketModalOpen] = useState(false);
    
    // Filtry
    const [filter, setFilter] = useState('all'); // 'all', 'mine'

    useEffect(() => {
        if (!db || !appId || !user) return;
        
        const ticketsColRef = collection(db, `artifacts/${appId}/public/data/tickets`);
        let q;
        if (filter === 'mine') {
            q = query(ticketsColRef, where("assignedTo", "==", user.uid), orderBy('createdAt', 'desc'));
        } else {
            q = query(ticketsColRef, orderBy('createdAt', 'desc'));
        }
        
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const ticketData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setTickets(ticketData);
        });
        return () => unsubscribe();
    }, [db, appId, user, filter]);

    const onDragEnd = async (result) => {
        const { destination, source, draggableId } = result;
        if (!destination || (destination.droppableId === source.droppableId && destination.index === source.index)) {
            return;
        }

        const ticketRef = doc(db, `artifacts/${appId}/public/data/tickets`, draggableId);
        try {
            await updateDoc(ticketRef, { status: destination.droppableId });
            // Optimistická aktualizace UI
            setTickets(prevTickets =>
                prevTickets.map(ticket =>
                    ticket.id === draggableId ? { ...ticket, status: destination.droppableId } : ticket
                )
            );
        } catch (error) {
            console.error("Chyba při aktualizaci statusu ticketu:", error);
        }
    };
    
    const columns = useMemo(() => {
        const statuses = ["Vytvořeno", "V řešení", "Hotovo"];
        const groupedTickets = statuses.reduce((acc, status) => {
            acc[status] = tickets.filter(ticket => ticket.status === status);
            return acc;
        }, {});
        return groupedTickets;
    }, [tickets]);

    return (
        <>
            <Card>
                <CardContent>
                    <div className="flex flex-wrap justify-between items-center mb-6 gap-4">
                        <h2 className="text-2xl font-semibold flex items-center gap-2 text-purple-400">
                            <Ticket className="w-6 h-6" /> {t.ticketsTab}
                        </h2>
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2 bg-slate-700/50 p-1 rounded-lg">
                                <button onClick={() => setFilter('all')} className={`px-3 py-1 text-sm rounded-md ${filter === 'all' ? 'bg-blue-600 text-white' : 'text-slate-300'}`}>
                                    Všechny
                                </button>
                                <button onClick={() => setFilter('mine')} className={`px-3 py-1 text-sm rounded-md ${filter === 'mine' ? 'bg-blue-600 text-white' : 'text-slate-300'}`}>
                                    <User className="w-4 h-4 inline-block mr-1" /> Moje
                                </button>
                            </div>
                            <button onClick={() => setNewTicketModalOpen(true)} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg shadow hover:bg-blue-700">
                                <PlusCircle className="w-5 h-5" /> {t.createTicket}
                            </button>
                        </div>
                    </div>

                    <DragDropContext onDragEnd={onDragEnd}>
                        <div className="flex gap-4 overflow-x-auto pb-4">
                            {Object.entries(columns).map(([status, ticketsInStatus]) => (
                                <TicketColumn
                                    key={status}
                                    status={status}
                                    tickets={ticketsInStatus}
                                    onTicketClick={setSelectedTicket}
                                />
                            ))}
                        </div>
                    </DragDropContext>
                </CardContent>
            </Card>

            {selectedTicket && <TicketDetailsModal ticket={selectedTicket} onClose={() => setSelectedTicket(null)} />}
            {isNewTicketModalOpen && <NewTicketModal onClose={() => setNewTicketModalOpen(false)} />}
        </>
    );
}