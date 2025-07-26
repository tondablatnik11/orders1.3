'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { getSupabase } from '@/lib/supabaseClient';
import { useAuth } from '@/hooks/useAuth';
import Modal from '@/components/ui/Modal';
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

    // --- KONTROLNÍ KROK ---
    // Tento kód se spustí jen jednou a vypíše nám do konzole prohlížeče,
    // jestli se klíče správně načetly.
    useEffect(() => {
        console.log("KONTROLA HODNOT Z .ENV.LOCAL");
        console.log("Supabase URL:", process.env.NEXT_PUBLIC_SUPABASE_URL);
        console.log("Supabase Anon Key:", !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? "NAČTEN" : "CHYBÍ NEBO JE PRAZDNÝ");
    }, []);

    const fetchData = useCallback(async () => {
        setLoading(true);
        const { data, error } = await supabase.from('faulty_labels').select('*').order('created_at', { ascending: false });
        if (error) {
            toast.error('Chyba při načítání dat.');
            console.error(error);
        } else {
            setLabels(data);
        }
        setLoading(false);
    }, [supabase]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

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
        if (error) {
            toast.error('Nepodařilo se přidat záznam.');
        } else {
            toast.success('Záznam úspěšně přidán.');
            e.target.reset();
            fetchData();
        }
    };
    
    const handleStatusChange = async (newStatus) => {
        const { error } = await supabase.from('faulty_labels').update({ status: newStatus, updated_at: new Date() }).eq('id', selectedLabel.id);
        if (error) {
            toast.error('Chyba při změně stavu.');
        } else {
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
        if (error) {
            toast.error('Nepodařilo se přidat komentář.');
        } else {
            setNewComment('');
            const { data } = await supabase.from('label_comments').select('*').eq('label_id', selectedLabel.id).order('created_at');
            setSelectedLabel(prev => ({...prev, comments: data}));
        }
    };

    const openDetails = async (label) => {
        const { data: comments, error } = await supabase.from('label_comments').select('*').eq('label_id', label.id).order('created_at');
        if(error) toast.error("Chyba při načítání komentářů.");
        setSelectedLabel({...label, comments: comments || []});
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
                 <div className="p-6">
                    <h2 className="text-xl font-semibold text-white">Přehled chybných etiket</h2>
                </div>
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
                                    <td className="px-4 py-4 text-sm text-sky-400 font-semibold">{label.delivery_no}</td>
                                    <td className="px-4 py-4 text-sm text-slate-300">{label.error_description}</td>
                                    <td className="px-4 py-4 text-sm text-slate-300">
                                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                                            label.status === 'Nové' ? 'bg-red-900 text-red-200' :
                                            label.status === 'V řešení' ? 'bg-amber-900 text-amber-200' :
                                            'bg-green-900 text-green-200'
                                        }`}>
                                            {label.status}
                                        </span>
                                    </td>
                                    <td className="px-4 py-4 text-sm text-slate-400">{label.reporter_name}</td>
                                    <td className="px-4 py-4 text-sm text-slate-400">{format(new Date(label.created_at), 'dd.MM.yyyy HH:mm')}</td>
                                    <td className="px-4 py-4 text-sm">
                                        <Button onClick={() => openDetails(label)} variant="outline">Detail</Button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
            
            {selectedLabel && (
                <Modal isOpen={!!selectedLabel} onClose={() => setSelectedLabel(null)} title={`Detail etikety: ${selectedLabel.delivery_no}`}>
                    <div className="p-6 space-y-4">
                        <div><strong>Popis:</strong> {selectedLabel.error_description}</div>
                        <div><strong>Země:</strong> {selectedLabel.country}</div>
                        <div><strong>Umístění:</strong> {selectedLabel.location}</div>
                        <div className="flex items-center gap-4">
                            <strong>Stav:</strong>
                            <Button onClick={() => handleStatusChange('V řešení')} variant={selectedLabel.status === 'V řešení' ? 'default' : 'secondary'}>V řešení</Button>
                            <Button onClick={() => handleStatusChange('Vyřešeno')} variant={selectedLabel.status === 'Vyřešeno' ? 'default' : 'secondary'}>Vyřešeno</Button>
                        </div>
                        <hr className="border-slate-200"/>
                        <h4 className="font-semibold">Komentáře:</h4>
                        <div className="space-y-2 max-h-48 overflow-y-auto">
                            {selectedLabel.comments.map(c => (
                                <div key={c.id} className="text-sm bg-slate-100 p-2 rounded">
                                    <span className="font-semibold">{c.author_name}:</span> {c.comment_text}
                                    <div className="text-xs text-slate-500">{format(new Date(c.created_at), 'dd.MM.yyyy HH:mm')}</div>
                                </div>
                            ))}
                        </div>
                        <div className="flex gap-2">
                            <input value={newComment} onChange={e => setNewComment(e.target.value)} placeholder="Napište komentář..." className="flex-grow p-2 border rounded"/>
                            <Button onClick={handleAddComment}>Přidat</Button>
                        </div>
                    </div>
                </Modal>
            )}
        </div>
    );
};

export default FaultyLabelsTab;