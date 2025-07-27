'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { getSupabase } from '@/lib/supabaseClient';
import { useAuth } from '@/hooks/useAuth';
import { useData } from '@/hooks/useData';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/button';
import toast from 'react-hot-toast';
import { format, parseISO } from 'date-fns';
import { Package, User, Calendar, Globe, MapPin, MessageSquare, Tag, Send } from 'lucide-react';

// --- Vylepšené modální okno ---
const DetailItem = ({ icon: Icon, label, value, children }) => (
    <div className="flex items-start gap-3">
        <Icon className="w-5 h-5 text-slate-400 mt-1 flex-shrink-0" />
        <div>
            <p className="text-sm text-slate-400">{label}</p>
            {children || <p className="text-md text-white font-semibold">{value || 'N/A'}</p>}
        </div>
    </div>
);

const FaultyLabelDetailsModal = ({ label, onClose }) => {
    const [newComment, setNewComment] = useState('');
    const { userProfile } = useAuth();
    const supabase = getSupabase();

    const [comments, setComments] = useState(label.comments || []);

    const handleStatusChange = async (newStatus) => {
        const { error } = await supabase.from('faulty_labels').update({ status: newStatus }).eq('id', label.id);
        if (error) {
            toast.error('Chyba při změně statusu.');
        } else {
            toast.success(`Status byl změněn na: ${newStatus}`);
            onClose(true); // Zavřít a signalizovat, že se data mají znovu načíst
        }
    };

    const handleAddComment = async () => {
        if (!newComment.trim() || !userProfile) return;
        const commentData = {
            faulty_label_id: label.id,
            comment_text: newComment,
            author_id: userProfile.id,
            author_name: userProfile.full_name || 'Uživatel'
        };
        // ZDE BYLA OPRAVA: Použit správný název tabulky 'label_comments'
        const { data, error } = await supabase.from('label_comments').insert(commentData).select().single();
        if (error) {
            toast.error('Chyba při přidávání komentáře.');
        } else {
            setComments(prev => [...prev, data]);
            setNewComment('');
            toast.success('Komentář byl přidán.');
        }
    };

    return (
        <Modal title={`Detail chyby: ${label.label_number}`} onClose={() => onClose(false)}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-6">
                <div className="md:col-span-2 space-y-4 border-r border-slate-700 pr-6">
                    <h3 className="text-lg font-bold text-sky-300 border-b border-slate-700 pb-2">Informace o zakázce</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <DetailItem icon={Package} label="Číslo zakázky" value={label.delivery_no} />
                        <DetailItem icon={User} label="Příjemce" value={label.order_details?.["Name of ship-to party"]} />
                        <DetailItem icon={Calendar} label="Datum nakládky" value={label.order_details?.["Loading Date"] ? format(parseISO(label.order_details["Loading Date"]), 'dd.MM.yyyy') : 'N/A'} />
                        <DetailItem icon={Globe} label="Země doručení" value={label.order_details?.["Country ship-to prty"]} />
                    </div>
                    <h3 className="text-lg font-bold text-sky-300 border-b border-slate-700 pb-2 mt-6">Detaily o chybě</h3>
                     <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <DetailItem icon={Tag} label="Chybná etiketa" value={label.label_number} />
                        <DetailItem icon={MapPin} label="Umístění" value={label.location} />
                        <DetailItem icon={User} label="Vytvořil" value={label.created_by_name} />
                        <DetailItem icon={Calendar} label="Vytvořeno" value={format(new Date(label.created_at), 'dd.MM.yyyy HH:mm')} />
                    </div>
                </div>
                <div className="md:col-span-1 flex flex-col space-y-4">
                     <div>
                        <h4 className="font-semibold text-slate-300 mb-2">Status</h4>
                        <div className="flex flex-wrap gap-2">
                            <Button onClick={() => handleStatusChange('Nové')} variant={label.status === 'Nové' ? 'default' : 'secondary'} size="sm">Nové</Button>
                            <Button onClick={() => handleStatusChange('V řešení')} variant={label.status === 'V řešení' ? 'default' : 'secondary'} size="sm">V řešení</Button>
                            <Button onClick={() => handleStatusChange('Vyřešeno')} variant={label.status === 'Vyřešeno' ? 'default' : 'secondary'} size="sm">Vyřešeno</Button>
                        </div>
                    </div>
                    <div className="flex flex-col flex-grow h-64 bg-slate-900 rounded-lg p-3">
                        <h4 className="font-semibold mb-2 flex-shrink-0 flex items-center gap-2"><MessageSquare size={16} /> Komentáře</h4>
                        <div className="flex-grow overflow-y-auto space-y-3 pr-2">
                            {comments.map(c => (
                                <div key={c.id}>
                                    <div className="flex items-center gap-2 mb-1">
                                        <p className="font-semibold text-xs text-sky-300">{c.author_name}</p>
                                        <p className="text-xs text-slate-400">{format(new Date(c.created_at), 'dd.MM HH:mm')}</p>
                                    </div>
                                    <p className="bg-slate-800 p-2 rounded-lg text-sm whitespace-pre-wrap break-words">{c.comment_text}</p>
                                </div>
                            ))}
                        </div>
                        <div className="flex gap-2 mt-2 pt-2 border-t border-slate-700 flex-shrink-0">
                            <input value={newComment} onChange={e => setNewComment(e.target.value)} placeholder="Napište komentář..." className="flex-grow p-2 rounded-lg bg-slate-700 border border-slate-600 text-sm" />
                            <Button onClick={handleAddComment} size="sm"><Send size={14} /></Button>
                        </div>
                    </div>
                </div>
            </div>
        </Modal>
    );
};


// --- Hlavní komponenta ---
const FaultyLabelsTab = () => {
    const [labels, setLabels] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedLabel, setSelectedLabel] = useState(null);
    const supabase = getSupabase();
    const { allOrdersData } = useData();

    const fetchData = useCallback(async () => {
        setLoading(true);
        // ZDE BYLA OPRAVA: Použit správný název tabulky 'label_comments'
        const { data, error } = await supabase
            .from('faulty_labels')
            .select(`
                *,
                comments:label_comments(*)
            `)
            .order('created_at', { ascending: false });
        
        if (error) { 
            toast.error('Chyba při načítání dat.'); 
            console.error(error);
        } else { 
            const labelsWithOrderData = data.map(label => {
                const order_details = allOrdersData.find(order => String(order['Delivery No']) === String(label.delivery_no));
                return { ...label, order_details };
            });
            setLabels(labelsWithOrderData || []); 
        }
        setLoading(false);
    }, [supabase, allOrdersData]);

    useEffect(() => {
        if(allOrdersData.length > 0) {
            fetchData();
        }
    }, [fetchData, allOrdersData]);

    const handleCloseModal = (refresh) => {
        setSelectedLabel(null);
        if (refresh) {
            fetchData();
        }
    };
    
    const getStatusColorClass = (status) => {
        switch(status) {
            case 'Nové': return 'bg-red-500';
            case 'V řešení': return 'bg-yellow-500';
            case 'Vyřešeno': return 'bg-green-500';
            default: return 'bg-slate-500';
        }
    };

    return (
        <div className="p-4 space-y-4">
            <h1 className="text-2xl font-bold">Přehled chybných etiket</h1>
            {loading ? (
                <p>Načítám data...</p>
            ) : (
                <div className="bg-slate-800 border border-slate-700 rounded-lg overflow-hidden">
                    <table className="min-w-full divide-y divide-slate-700">
                        <thead className="bg-slate-700/50">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">Status</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">Číslo etikety</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">Číslo zakázky</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">Země doručení</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">Umístění</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">Vytvořil</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">Vytvořeno</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">Akce</th>
                            </tr>
                        </thead>
                        <tbody className="bg-slate-800 divide-y divide-slate-700">
                            {labels.map(label => (
                                <tr key={label.id} className="hover:bg-slate-700/50">
                                    <td className="px-4 py-3 whitespace-nowrap text-sm">
                                        <span className={`px-2 py-1 rounded-full text-xs font-semibold text-white ${getStatusColorClass(label.status)}`}>
                                            {label.status}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 whitespace-nowrap text-sm font-semibold text-white">{label.label_number}</td>
                                    <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-300">{label.delivery_no}</td>
                                    <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-300">{label.order_details?.["Country ship-to prty"] || 'N/A'}</td>
                                    <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-300">{label.location || 'N/A'}</td>
                                    <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-300">{label.created_by_name}</td>
                                    <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-300">{format(new Date(label.created_at), 'dd.MM.yyyy HH:mm')}</td>
                                    <td className="px-4 py-3 whitespace-nowrap text-sm">
                                        <Button onClick={() => setSelectedLabel(label)} size="sm">Detail</Button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
            {selectedLabel && (
                <FaultyLabelDetailsModal 
                    label={selectedLabel}
                    onClose={handleCloseModal}
                />
            )}
        </div>
    );
};

export default FaultyLabelsTab;