'use client';
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { getSupabase } from '@/lib/supabaseClient';
import { useAuth } from '@/hooks/useAuth';
import { useData } from '@/hooks/useData';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/button';
import toast from 'react-hot-toast';
import { format, formatDistanceToNow, parseISO } from 'date-fns';
import { cs } from 'date-fns/locale';
import { Package, User, Calendar, Globe, MapPin, MessageSquare, Tag, Send, PlusCircle, History, Info, Search } from 'lucide-react';

// --- Vylepšené modální okno ---
const DetailItem = ({ icon: Icon, label, value }) => (
    <div className="flex items-start gap-3">
        <Icon className="w-5 h-5 text-slate-400 mt-1 flex-shrink-0" />
        <div>
            <p className="text-sm text-slate-400">{label}</p>
            <p className="text-md text-white font-semibold">{value || 'N/A'}</p>
        </div>
    </div>
);

const FaultyLabelDetailsModal = ({ label, onClose }) => {
    const [activeTab, setActiveTab] = useState('details');
    const [newComment, setNewComment] = useState('');
    const { userProfile } = useAuth();
    const supabase = getSupabase();
    const [comments, setComments] = useState(label.comments || []);
    const [logs, setLogs] = useState([]);

    useEffect(() => {
        const fetchLogs = async () => {
            const { data, error } = await supabase
                .from('faulty_label_logs')
                .select('*')
                .eq('faulty_label_id', label.id)
                .order('created_at', { ascending: false });
            if (!error) setLogs(data);
        };
        fetchLogs();
    }, [label.id, supabase]);

    const createLog = async (description) => {
        await supabase.from('faulty_label_logs').insert({
            faulty_label_id: label.id,
            user_name: userProfile?.full_name || 'Systém',
            change_description: description
        });
    };

    const handleStatusChange = async (newStatus) => {
        const oldStatus = label.status;
        const { error } = await supabase.from('faulty_labels').update({ status: newStatus }).eq('id', label.id);
        if (error) {
            toast.error('Chyba při změně statusu.');
        } else {
            await createLog(`Změnil status z "${oldStatus}" na "${newStatus}"`);
            toast.success(`Status byl změněn na: ${newStatus}`);
            onClose(true);
        }
    };

    const handleAddComment = async () => {
        if (!newComment.trim() || !userProfile) return;
        const commentData = { faulty_label_id: label.id, comment_text: newComment, author_id: userProfile.id, author_name: userProfile.full_name || 'Uživatel' };
        const { data, error } = await supabase.from('label_comments').insert(commentData).select().single();
        if (error) {
            toast.error('Chyba při přidávání komentáře.');
        } else {
            await createLog(`Přidal komentář: "${newComment}"`);
            setComments(prev => [...prev, data]);
            setLogs(prev => [{ created_at: new Date().toISOString(), user_name: userProfile.full_name, change_description: `Přidal komentář: "${newComment}"` }, ...prev]);
            setNewComment('');
            toast.success('Komentář byl přidán.');
        }
    };

    return (
        <Modal title={`Detail chyby: ${label.label_number}`} onClose={() => onClose(false)}>
            <div className="flex border-b border-slate-700">
                <button onClick={() => setActiveTab('details')} className={`px-4 py-2 text-sm font-medium ${activeTab === 'details' ? 'border-b-2 border-sky-400 text-white' : 'text-slate-400'}`}>Detaily</button>
                <button onClick={() => setActiveTab('comments')} className={`px-4 py-2 text-sm font-medium ${activeTab === 'comments' ? 'border-b-2 border-sky-400 text-white' : 'text-slate-400'}`}>Komentáře</button>
                <button onClick={() => setActiveTab('logs')} className={`px-4 py-2 text-sm font-medium ${activeTab === 'logs' ? 'border-b-2 border-sky-400 text-white' : 'text-slate-400'}`}>Log změn</button>
            </div>

            <div className="p-6">
                {activeTab === 'details' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                            <h3 className="text-lg font-bold text-sky-300">Informace o zakázce</h3>
                            <DetailItem icon={Package} label="Číslo zakázky" value={label.delivery_no} />
                            <DetailItem icon={User} label="Příjemce" value={label.order_details?.["Name of ship-to party"]} />
                            <DetailItem icon={Calendar} label="Datum nakládky" value={label.order_details?.["Loading Date"] ? format(parseISO(label.order_details["Loading Date"]), 'dd.MM.yyyy') : 'N/A'} />
                            <DetailItem icon={Globe} label="Země doručení" value={label.order_details?.["Country ship-to prty"]} />
                        </div>
                        <div className="space-y-4">
                            <h3 className="text-lg font-bold text-sky-300">Detaily o chybě</h3>
                            <DetailItem icon={MapPin} label="Umístění" value={label.location} />
                            <DetailItem icon={User} label="Vytvořil" value={label.profiles?.full_name || label.created_by_name} />
                            <DetailItem icon={Calendar} label="Vytvořeno" value={format(new Date(label.created_at), 'dd.MM.yyyy HH:mm')} />
                             <div>
                                <h4 className="font-semibold text-slate-300 mb-2 mt-4">Změnit Status</h4>
                                <div className="flex flex-wrap gap-2">
                                    <Button onClick={() => handleStatusChange('Nové')} variant={label.status === 'Nové' ? 'default' : 'secondary'} size="sm">Nové</Button>
                                    <Button onClick={() => handleStatusChange('V řešení')} variant={label.status === 'V řešení' ? 'default' : 'secondary'} size="sm">V řešení</Button>
                                    <Button onClick={() => handleStatusChange('Vyřešeno')} variant={label.status === 'Vyřešeno' ? 'default' : 'secondary'} size="sm">Vyřešeno</Button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
                {activeTab === 'comments' && (
                    <div className="flex flex-col h-80">
                         <div className="flex-grow overflow-y-auto space-y-4 pr-2">
                            {comments.map(c => (
                                <div key={c.id} className="flex gap-3">
                                    <div className="w-8 h-8 rounded-full bg-slate-600 flex items-center justify-center text-sky-300 font-bold text-sm flex-shrink-0">{c.author_name?.charAt(0) || '?'}</div>
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <p className="font-semibold text-sm text-sky-300">{c.author_name}</p>
                                            <p className="text-xs text-slate-400">{format(new Date(c.created_at), 'dd.MM HH:mm')}</p>
                                        </div>
                                        <p className="bg-slate-700 p-2 rounded-lg text-sm whitespace-pre-wrap break-words">{c.comment_text}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="flex gap-2 mt-4 pt-4 border-t border-slate-700 flex-shrink-0">
                            <input value={newComment} onChange={e => setNewComment(e.target.value)} placeholder="Napište komentář..." className="flex-grow p-2 rounded-lg bg-slate-700 border border-slate-600 text-sm" />
                            <Button onClick={handleAddComment} size="sm"><Send size={14} /></Button>
                        </div>
                    </div>
                )}
                 {activeTab === 'logs' && (
                    <div className="space-y-4 max-h-96 overflow-y-auto">
                        {logs.map(log => (
                            <div key={log.id} className="flex items-center gap-3 text-sm">
                                <History size={16} className="text-slate-500 flex-shrink-0" />
                                <div className="flex-grow">
                                    <span className="font-semibold text-slate-300">{log.user_name}</span>
                                    <span className="text-slate-400"> {log.change_description}</span>
                                </div>
                                <div className="text-xs text-slate-500 flex-shrink-0" title={format(new Date(log.created_at), 'dd.MM.yyyy HH:mm:ss')}>
                                    {formatDistanceToNow(new Date(log.created_at), { addSuffix: true, locale: cs })}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </Modal>
    );
};

const NewFaultyLabelModal = ({ onClose, onCreated }) => {
    const [deliveryNo, setDeliveryNo] = useState('');
    const [location, setLocation] = useState('');
    const { userProfile } = useAuth();
    const supabase = getSupabase();

    const handleSubmit = async () => {
        if (!deliveryNo.trim() || !location.trim()) {
            toast.error('Vyplňte prosím všechna pole.');
            return;
        }

        const { data, error } = await supabase.from('faulty_labels').insert({
            delivery_no: deliveryNo.trim(),
            location: location.trim(),
            status: 'Nové',
            created_by: userProfile.id,
            created_by_name: userProfile.full_name || 'Uživatel'
        }).select().single();

        if (error) {
            toast.error('Chyba při vytváření záznamu.');
        } else {
            // Log a comment for creation
            await supabase.from('faulty_label_logs').insert({
                faulty_label_id: data.id,
                user_name: userProfile.full_name,
                change_description: 'Vytvořil(a) nový záznam'
            });
            toast.success('Nový záznam byl úspěšně vytvořen.');
            onCreated();
        }
    };

    return (
        <Modal title="Přidat chybějící etiketu" onClose={onClose}>
            <div className="p-6 space-y-4">
                <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">Číslo zakázky</label>
                    <input value={deliveryNo} onChange={e => setDeliveryNo(e.target.value)} className="w-full p-2 rounded-lg bg-slate-700 border border-slate-600" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">Umístění</label>
                    <input value={location} onChange={e => setLocation(e.target.value)} className="w-full p-2 rounded-lg bg-slate-700 border border-slate-600" />
                </div>
                <div className="flex justify-end gap-2 pt-4">
                    <Button onClick={onClose} variant="secondary">Zrušit</Button>
                    <Button onClick={handleSubmit}>Vytvořit</Button>
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
    const [showNewModal, setShowNewModal] = useState(false);
    const [filters, setFilters] = useState({ query: '', status: 'all', location: 'all' });
    const supabase = getSupabase();
    const { allOrdersData, setSelectedOrderDetails } = useData();

    const fetchData = useCallback(async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('faulty_labels')
            .select(`*, comments:label_comments(*), profiles(full_name)`)
            .order('created_at', { ascending: false });
        
        if (error) { toast.error('Chyba při načítání dat.'); console.error(error); } 
        else { 
            const labelsWithOrderData = data.map(label => {
                const order_details = allOrdersData.find(order => String(order['Delivery No']) === String(label.delivery_no));
                return { ...label, order_details };
            });
            setLabels(labelsWithOrderData || []); 
        }
        setLoading(false);
    }, [supabase, allOrdersData]);

    useEffect(() => {
        if(allOrdersData.length > 0) fetchData();
    }, [fetchData, allOrdersData]);
    
    const filteredLabels = useMemo(() => {
        return labels.filter(label => {
            const queryMatch = label.delivery_no.toLowerCase().includes(filters.query.toLowerCase()) ||
                               label.profiles?.full_name?.toLowerCase().includes(filters.query.toLowerCase());
            const statusMatch = filters.status === 'all' || label.status === filters.status;
            const locationMatch = filters.location === 'all' || label.location === filters.location;
            return queryMatch && statusMatch && locationMatch;
        });
    }, [labels, filters]);

    const uniqueLocations = useMemo(() => [...new Set(labels.map(l => l.location).filter(Boolean))], [labels]);

    const handleCloseModal = (refresh) => {
        setSelectedLabel(null);
        if (refresh) fetchData();
    };

    const handleOpenOrderDetails = (deliveryNo) => {
        const orderDetails = allOrdersData.find(order => String(order['Delivery No']) === String(deliveryNo));
        if (orderDetails) {
            setSelectedOrderDetails(orderDetails);
        } else {
            toast.error(`Zakázka ${deliveryNo} nenalezena.`);
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
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold">Přehled chybných etiket</h1>
                <Button onClick={() => setShowNewModal(true)}><PlusCircle size={16} className="mr-2" />Přidat chybějící etiketu</Button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-slate-800 border border-slate-700 rounded-lg">
                <div className="md:col-span-2">
                    <label className="text-sm font-medium text-slate-400">Hledat (zakázka, vytvořil)</label>
                    <input 
                        value={filters.query}
                        onChange={e => setFilters(prev => ({...prev, query: e.target.value}))}
                        className="w-full mt-1 p-2 bg-slate-700 border border-slate-600 rounded-md text-white" 
                    />
                </div>
                <div>
                     <label className="text-sm font-medium text-slate-400">Status</label>
                    <select value={filters.status} onChange={e => setFilters(prev => ({...prev, status: e.target.value}))} className="w-full mt-1 p-2 bg-slate-700 border border-slate-600 rounded-md text-white">
                        <option value="all">Všechny</option>
                        <option value="Nové">Nové</option>
                        <option value="V řešení">V řešení</option>
                        <option value="Vyřešeno">Vyřešeno</option>
                    </select>
                </div>
                 <div>
                     <label className="text-sm font-medium text-slate-400">Umístění</label>
                    <select value={filters.location} onChange={e => setFilters(prev => ({...prev, location: e.target.value}))} className="w-full mt-1 p-2 bg-slate-700 border border-slate-600 rounded-md text-white">
                        <option value="all">Všechna</option>
                        {uniqueLocations.map(loc => <option key={loc} value={loc}>{loc}</option>)}
                    </select>
                </div>
            </div>

            {loading ? (
                <p>Načítám data...</p>
            ) : (
                <div className="bg-slate-800 border border-slate-700 rounded-lg overflow-hidden">
                    <table className="min-w-full divide-y divide-slate-700">
                        <thead className="bg-slate-700/50">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">Status</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">Číslo zakázky</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">Země doručení</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">Umístění</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">Vytvořil</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">Vytvořeno</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">Akce</th>
                            </tr>
                        </thead>
                        <tbody className="bg-slate-800 divide-y divide-slate-700">
                            {filteredLabels.map(label => (
                                <tr key={label.id} className="hover:bg-slate-700/50">
                                    <td className="px-4 py-3 whitespace-nowrap text-sm">
                                        <span className={`px-2 py-1 rounded-full text-xs font-semibold text-white ${getStatusColorClass(label.status)}`}>
                                            {label.status}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 whitespace-nowrap text-sm font-semibold text-sky-400 hover:underline cursor-pointer" onClick={() => handleOpenOrderDetails(label.delivery_no)}>{label.delivery_no}</td>
                                    <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-300">{label.order_details?.["Country ship-to prty"] || 'N/A'}</td>
                                    <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-300">{label.location || 'N/A'}</td>
                                    <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-300">{label.profiles?.full_name || label.created_by_name}</td>
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
            {showNewModal && (
                <NewFaultyLabelModal 
                    onClose={() => setShowNewModal(false)} 
                    onCreated={() => { setShowNewModal(false); fetchData(); }}
                />
            )}
        </div>
    );
};

export default FaultyLabelsTab;