'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { getSupabase } from '@/lib/supabaseClient';
import { useAuth } from '@/hooks/useAuth';
import { useData } from '@/hooks/useData';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/button';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

const FaultyLabelsTab = () => {
    const [labels, setLabels] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedLabel, setSelectedLabel] = useState(null);
    const [newComment, setNewComment] = useState('');
    const supabase = getSupabase();
    const { userProfile } = useAuth();
    // ZÍSKÁME DATA Z KONTEXTU
    const { allOrdersData, pickingData, setSelectedOrderDetails } = useData();

    const fetchData = useCallback(async () => {
        setLoading(true);
        const { data, error } = await supabase.from('faulty_labels').select('*').order('created_at', { ascending: false });
        if (error) { toast.error('Chyba při načítání dat.'); } 
        else { setLabels(data || []); }
        setLoading(false);
    }, [supabase]);

    useEffect(() => { fetchData(); }, [fetchData]);

    const openOrderDetails = (deliveryNo) => {
        const orderDetails = allOrdersData.find(order => order['Delivery No'] === deliveryNo);
        const relatedPicking = (pickingData || []).filter(p => p.delivery_no === deliveryNo);
        if (orderDetails) {
            setSelectedOrderDetails({ ...orderDetails, picking_details: relatedPicking });
        } else {
            toast.error(`Zakázka ${deliveryNo} nebyla nalezena.`);
        }
    };
    
    const openDetails = async (label) => {
        const { data: comments } = await supabase.from('label_comments').select('*').eq('label_id', label.id).order('created_at');
        const orderDetails = allOrdersData.find(order => order['Delivery No'] === label.delivery_no);
        const relatedPicking = (pickingData || []).filter(p => p.delivery_no === label.delivery_no);
        setSelectedLabel({
            ...label, 
            comments: comments || [],
            orderDetails: orderDetails,
            pickingDetails: relatedPicking
        });
    };
    
    const handleAddLabel = async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const newLabel = {
            delivery_no: formData.get('delivery_no'),
            error_description: formData.get('error_description'),
            country: formData.get('country'),
            location: formData.get('location'),
            reporter_name: userProfile?.full_name || 'Neznámý',
        };
        const { error } = await supabase.from('faulty_labels').insert(newLabel);
        if (error) { toast.error('Nepodařilo se přidat záznam.'); } 
        else {
            toast.success('Záznam úspěšně přidán.');
            e.target.reset();
            fetchData();
        }
    };
    
    const handleStatusChange = async (newStatus) => {
        const { error } = await supabase.from('faulty_labels').update({ status: newStatus, updated_at: new Date() }).eq('id', selectedLabel.id);
        if (error) toast.error('Chyba při změně stavu.');
        else {
            toast.success('Stav aktualizován.');
            setSelectedLabel(prev => ({...prev, status: newStatus}));
            fetchData();
        }
    };

    const handleAddComment = async () => {
        if (!newComment.trim()) return;
        const comment = {
            label_id: selectedLabel.id,
            author_name: userProfile?.full_name || 'Neznámý',
            comment_text: newComment
        };
        const { error } = await supabase.from('label_comments').insert(comment);
        if (error) toast.error('Nepodařilo se přidat komentář.');
        else {
            setNewComment('');
            const { data } = await supabase.from('label_comments').select('*').eq('label_id', selectedLabel.id).order('created_at');
            setSelectedLabel(prev => ({...prev, comments: data || []}));
        }
    };

    return (
        <div className="space-y-8">
            <div className="bg-slate-800 p-6 rounded-lg border border-slate-700">
                <h2 className="text-xl font-semibold text-white mb-4">Nahlásit chybou etiketu</h2>
                <form onSubmit={handleAddLabel} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                    <input name="delivery_no" required placeholder="Číslo zakázky" className="p-2 bg-slate-700 rounded border border-slate-600 text-white" />
                    <input name="error_description" required placeholder="Popis chyby" className="p-2 bg-slate-700 rounded border border-slate-600 text-white" />
                    <input name="country" placeholder="Země doručení" className="p-2 bg-slate-700 rounded border border-slate-600 text-white" />
                    <input name="location" placeholder="Umístění" className="p-2 bg-slate-700 rounded border border-slate-600 text-white" />
                    <Button type="submit" className="bg-sky-500 hover:bg-sky-600">Přidat záznam</Button>
                </form>
            </div>

            <div className="bg-slate-800 rounded-lg border border-slate-700 overflow-hidden">
                 <div className="p-6"><h2 className="text-xl font-semibold text-white">Přehled chybných etiket</h2></div>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-700">
                        <thead className="bg-slate-700/50">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">Zakázka</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">Popis</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">Stav</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">Nahlásil</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">Datum</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">Akce</th>
                            </tr>
                        </thead>
                        <tbody className="bg-slate-800 divide-y divide-slate-700">
                            {labels.map(label => (
                                <tr key={label.id} className="hover:bg-slate-700/50">
                                    <td className="px-4 py-4 text-sm text-sky-400 font-semibold hover:underline cursor-pointer" onClick={() => openOrderDetails(label.delivery_no)}>{label.delivery_no}</td>
                                    <td className="px-4 py-4 text-sm text-slate-300">{label.error_description}</td>
                                    <td className="px-4 py-4 text-sm text-slate-300">
                                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                                            label.status === 'Nové' ? 'bg-red-900 text-red-200' :
                                            label.status === 'V řešení' ? 'bg-amber-900 text-amber-200' :
                                            'bg-green-900 text-green-200'
                                        }`}>{label.status}</span>
                                    </td>
                                    <td className="px-4 py-4 text-sm text-slate-400">{label.reporter_name}</td>
                                    <td className="px-4 py-4 text-sm text-slate-400">{format(new Date(label.created_at), 'dd.MM.yyyy HH:mm')}</td>
                                    <td className="px-4 py-4 text-sm"><Button onClick={() => openDetails(label)} variant="outline">Detail chyby</Button></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
            
            {selectedLabel && (
                <Modal isOpen={!!selectedLabel} onClose={() => setSelectedLabel(null)} title={`Detail chyby etikety: ${selectedLabel.delivery_no}`}>
                    <div className="p-6 space-y-4 text-white bg-slate-800">
                        <div><strong>Popis chyby:</strong> {selectedLabel.error_description}</div>
                        {selectedLabel.pickingDetails?.map((p, i) => <div key={i}><strong>Picker:</strong> {p.user_name} ({new Date(p.confirmation_date).toLocaleDateString()} {p.confirmation_time})</div>)}
                        {selectedLabel.orderDetails && <div><strong>Příjemce:</strong> {selectedLabel.orderDetails['Name of ship-to party']} ({selectedLabel.orderDetails['Country ship-to prty']})</div>}
                        <div className="flex items-center gap-4">
                            <strong>Stav:</strong>
                            <Button onClick={() => handleStatusChange('V řešení')} variant={selectedLabel.status === 'V řešení' ? 'default' : 'secondary'}>V řešení</Button>
                            <Button onClick={() => handleStatusChange('Vyřešeno')} variant={selectedLabel.status === 'Vyřešeno' ? 'default' : 'secondary'}>Vyřešeno</Button>
                        </div>
                        <hr className="border-slate-700"/>
                        <h4 className="font-semibold">Komentáře:</h4>
                        <div className="space-y-2 max-h-48 overflow-y-auto bg-slate-900 p-2 rounded">
                            {selectedLabel.comments.map(c => (
                                <div key={c.id} className="text-sm bg-slate-700 p-2 rounded">
                                    <span className="font-semibold">{c.author_name}:</span> {c.comment_text}
                                    <div className="text-xs text-slate-400">{format(new Date(c.created_at), 'dd.MM.yyyy HH:mm')}</div>
                                </div>
                            ))}
                        </div>
                        <div className="flex gap-2">
                            <input value={newComment} onChange={e => setNewComment(e.target.value)} placeholder="Napište komentář..." className="flex-grow p-2 border rounded bg-slate-700 border-slate-600"/>
                            <Button onClick={handleAddComment}>Přidat</Button>
                        </div>
                    </div>
                </Modal>
            )}
        </div>
    );
};

export default FaultyLabelsTab;