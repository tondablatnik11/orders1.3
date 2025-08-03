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
import { debounce } from 'lodash';
import Image from 'next/image';


// --- Status Constants ---
const LABEL_STATUSES = {
    NEW: 'Nové',
    IN_PROGRESS: 'V řešení',
    RESOLVED: 'Vyřešeno'
};

// --- Detail Item Component ---
const DetailItem = ({ icon: Icon, label, value }) => (
    <div className="flex items-start gap-3">
        <Icon className="w-5 h-5 text-slate-400 mt-1 flex-shrink-0" />
        <div>
            <p className="text-sm text-slate-400">{label}</p>
            <p className="text-md text-white font-semibold">{value || 'N/A'}</p>
        </div>
    </div>
);

// --- Enhanced FaultyLabelDetailsModal ---
const FaultyLabelDetailsModal = ({ label, onClose }) => {
    const [activeTab, setActiveTab] = useState('details');
    const [newComment, setNewComment] = useState('');
    const [comments, setComments] = useState([]);
    const [logs, setLogs] = useState([]);
    const { userProfile } = useAuth();
    const supabase = getSupabase();

    const fetchComments = useCallback(async () => {
        const { data } = await supabase
            .from('label_comments')
            .select('*')
            .eq('faulty_label_id', label.id)
            .order('created_at', { ascending: true });
        setComments(data || []);
    }, [label.id, supabase]);

    const fetchLogs = useCallback(async () => {
        const { data } = await supabase
            .from('faulty_label_logs')
            .select('*')
            .eq('faulty_label_id', label.id)
            .order('created_at', { ascending: false });
        setLogs(data || []);
    }, [label.id, supabase]);

    useEffect(() => {
        fetchComments();
        fetchLogs();
    }, [fetchComments, fetchLogs]);

    const createLog = async (description) => {
        if (!userProfile) return;
        await supabase.from('faulty_label_logs').insert({
            faulty_label_id: label.id,
            user_name: userProfile?.displayName || 'Uživatel',
            change_description: description
        });
    };

    const handleStatusChange = async (newStatus) => {
        const oldStatus = label.status;
        label.status = newStatus; // Optimistic update
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
        const commentData = { faulty_label_id: label.id, comment_text: newComment, author_id: userProfile.uid, author_name: userProfile.displayName || 'Uživatel' };
        const { data, error } = await supabase.from('label_comments').insert(commentData).select().single();
        if (error) {
            toast.error('Chyba při přidávání komentáře.');
        } else {
            await createLog(`Přidal komentář: "${newComment}"`);
            setComments(prev => [...prev, data]);
            fetchLogs();
            setNewComment('');
            toast.success('Komentář byl přidán.');
        }
    };

    return (
        <Modal title={`Detail chyby pro zakázku ${label.delivery_no}`} onClose={() => onClose(false)}>
            <div className="flex border-b border-slate-700 bg-slate-800/50">
                {['details', 'comments', 'logs'].map(tab => (
                    <button key={tab} onClick={() => setActiveTab(tab)} className={`px-4 sm:px-6 py-3 text-sm font-medium transition-colors duration-200 ${activeTab === tab ? 'border-b-2 border-sky-400 text-white' : 'text-slate-400 hover:text-white'}`}>
                        {tab === 'details' ? 'Detaily' : tab === 'comments' ? 'Komentáře' : 'Log změn'}
                    </button>
                ))}
            </div>

            <div className="p-4 sm:p-6 bg-slate-900/50 rounded-b-lg">
                {activeTab === 'details' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                         {/* ... kód pro záložku "Detaily" zůstává beze změny ... */}
                    </div>
                )}
                {activeTab === 'comments' && (
                    <div className="flex flex-col h-96">
                        {/* ... kód pro záložku "Komentáře" zůstává beze změny ... */}
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
    const [formData, setFormData] = useState({ delivery_no: '', order_type: '', country: '', location: '', notes: '' });
    const { userProfile } = useAuth();
    const supabase = getSupabase();

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async () => {
        if (!formData.delivery_no.trim() || !formData.location.trim()) {
            toast.error('Vyplňte prosím alespoň Číslo zakázky a Umístění.');
            return;
        }

        const { data, error } = await supabase.from('faulty_labels').insert({
            ...formData,
            status: LABEL_STATUSES.NEW,
            created_by: userProfile.uid,
            created_by_name: userProfile.displayName || 'Uživatel'
        }).select().single();

        if (error) {
            toast.error('Chyba při vytváření záznamu.');
        } else {
            await supabase.from('faulty_label_logs').insert({
                faulty_label_id: data.id,
                user_name: userProfile.displayName,
                change_description: 'Vytvořil(a) nový záznam'
            });
            toast.success('Nový záznam byl úspěšně vytvořen.');
            onCreated();
        }
    };
    
    return (
        <Modal title="Přidat chybějící etiketu" onClose={onClose}>
            {/* ... kód formuláře pro nový ticket zůstává beze změny ... */}
        </Modal>
    );
};


// --- Hlavní komponenta ---
const FaultyLabelsTab = () => {
    const [labels, setLabels] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedLabel, setSelectedLabel] = useState(null);
    const [showNewModal, setShowNewModal] = useState(false);
    const [filters, setFilters] = useState({ query: '', status: 'all' });
    const supabase = getSupabase();
    const { allOrdersData, pickingData, setSelectedOrderDetails } = useData();

    const fetchData = useCallback(async () => {
        setLoading(true);
        setError(null);
        const { data, error } = await supabase
            .from('faulty_labels')
            .select(`*, comments:label_comments(*)`)
            .order('created_at', { ascending: false });

        if (error) {
            setError('Nepodařilo se načíst data. Zkuste to prosím znovu.');
            toast.error('Chyba při načítání dat.');
            console.error(error);
        } else {
            const labelsWithOrderData = data.map(label => ({
                ...label,
                order_details: allOrdersData.find(order => String(order['Delivery No']) === String(label.delivery_no))
            }));
            setLabels(labelsWithOrderData || []);
        }
        setLoading(false);
    }, [supabase, allOrdersData]);

    useEffect(() => {
        if (allOrdersData.length > 0) fetchData();
    }, [fetchData, allOrdersData]);

    const handleSearchChange = debounce((value) => {
        setFilters(prev => ({ ...prev, query: value }));
    }, 300);

    const filteredLabels = useMemo(() => {
        return labels.filter(label => {
            const query = filters.query.toLowerCase();
            const queryMatch = !query ||
                (label.delivery_no?.toLowerCase()?.includes(query) ?? false) ||
                (label.order_details?.["Country ship-to prty"]?.toLowerCase()?.includes(query) ?? false) ||
                (label.location?.toLowerCase()?.includes(query) ?? false) ||
                (label.created_by_name?.toLowerCase()?.includes(query) ?? false);
            const statusMatch = filters.status === 'all' || label.status === filters.status;
            return queryMatch && statusMatch;
        });
    }, [labels, filters]);

    const handleCloseModal = (refresh) => {
        setSelectedLabel(null);
        if (refresh) fetchData();
    };

    const handleOpenOrderDetails = useCallback((deliveryNo) => {
        const orderDetails = allOrdersData.find(order => String(order['Delivery No']) === String(deliveryNo));
        if (orderDetails) {
            const relatedPicking = (pickingData || []).filter(p => String(p.delivery_no) === String(deliveryNo));
            setSelectedOrderDetails({ ...orderDetails, picking_details: relatedPicking });
        } else {
            toast.error(`Zakázka ${deliveryNo} nenalezena.`);
        }
    }, [allOrdersData, pickingData, setSelectedOrderDetails]);

    const getStatusColorClass = (status) => {
        switch (status) {
            case LABEL_STATUSES.NEW: return 'bg-red-500';
            case LABEL_STATUSES.IN_PROGRESS: return 'bg-yellow-500';
            case LABEL_STATUSES.RESOLVED: return 'bg-green-500';
            default: return 'bg-slate-500';
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                <h1 className="text-2xl font-bold text-white">Přehled chybných etiket</h1>
                <Button onClick={() => setShowNewModal(true)} className="flex items-center gap-2 w-full sm:w-auto">
                    <PlusCircle size={16} /> Přidat chybějící etiketu
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 glass-card rounded-lg">
                <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-slate-300 mb-1">Hledat...</label>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                        <input
                            defaultValue={filters.query}
                            onChange={e => handleSearchChange(e.target.value)}
                            className="w-full p-2 pl-10 bg-slate-800 border border-slate-600 rounded-md text-white focus:ring-2 focus:ring-sky-400 focus:outline-none"
                            placeholder="Zakázka, země, umístění, vytvořil..."
                        />
                    </div>
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">Status</label>
                    <select
                        value={filters.status}
                        onChange={e => setFilters(prev => ({ ...prev, status: e.target.value }))}
                        className="w-full p-2 bg-slate-800 border border-slate-600 rounded-md text-white focus:ring-2 focus:ring-sky-400 focus:outline-none"
                    >
                        <option value="all">Všechny</option>
                        {Object.values(LABEL_STATUSES).map(status => (
                            <option key={status} value={status}>{status}</option>
                        ))}
                    </select>
                </div>
            </div>

            {loading ? (
                <p className="text-center text-slate-400 py-6">Načítám data...</p>
            ) : error ? (
                <p className="text-center text-red-500 py-6">{error}</p>
            ) : filteredLabels.length === 0 ? (
                <p className="text-center text-slate-400 py-6">Žádné záznamy neodpovídají zadaným filtrům.</p>
            ) : (
                <div className="glass-card rounded-lg overflow-hidden">
                    {/* Desktop Table View */}
                    <div className="hidden md:block">
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
                            <tbody className="bg-transparent divide-y divide-slate-700">
                                {filteredLabels.map(label => (
                                    <tr key={label.id} className="hover:bg-slate-700/50">
                                        <td className="px-4 py-3 whitespace-nowrap text-sm">
                                            <span className={`px-2 py-1 rounded-full text-xs font-semibold text-white ${getStatusColorClass(label.status)}`}>
                                                {label.status}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap text-sm font-semibold text-sky-400 hover:underline cursor-pointer" onClick={() => handleOpenOrderDetails(label.delivery_no)}>
                                            {label.delivery_no}
                                        </td>
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

                    {/* Mobile Card View */}
                    <div className="block md:hidden space-y-3 p-3">
                        {filteredLabels.map(label => (
                            <div key={label.id} className="bg-slate-800/70 p-4 rounded-lg border border-slate-700" onClick={() => setSelectedLabel(label)}>
                                <div className="flex justify-between items-start mb-3">
                                    <p className="font-bold text-lg text-sky-400 hover:underline" onClick={(e) => {e.stopPropagation(); handleOpenOrderDetails(label.delivery_no);}}>{label.delivery_no}</p>
                                    <span className={`px-2 py-1 rounded-full text-xs font-semibold text-white ${getStatusColorClass(label.status)}`}>
                                        {label.status}
                                    </span>
                                </div>
                                <div className="space-y-2 text-sm">
                                    <div className="flex items-center gap-2"><MapPin size={14} className="text-slate-400"/><span>{label.location || 'N/A'}</span></div>
                                    <div className="flex items-center gap-2"><Globe size={14} className="text-slate-400"/><span>{label.order_details?.["Country ship-to prty"] || 'N/A'}</span></div>
                                    <div className="flex items-center gap-2"><User size={14} className="text-slate-400"/><span>{label.created_by_name}</span></div>
                                    <div className="flex items-center gap-2"><Calendar size={14} className="text-slate-400"/><span>{format(new Date(label.created_at), 'dd.MM.yy HH:mm')}</span></div>
                                </div>
                            </div>
                        ))}
                    </div>
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