'use client';import React, { useState, useEffect, useCallback, useMemo } from 'react';import { getSupabase } from '@/lib/supabaseClient';import { useAuth } from '@/hooks/useAuth';import { useData } from '@/hooks/useData';import { Modal } from '@/components/ui/Modal';import { Button } from '@/components/ui/button';import toast from 'react-hot-toast';import { format, formatDistanceToNow, parseISO } from 'date-fns';import { cs } from 'date-fns/locale';import { Package, User, Calendar, Globe, MapPin, MessageSquare, Tag, Send, PlusCircle, History, Search } from 'lucide-react';import { debounce } from 'lodash';import DOMPurify from 'dompurify';
// --- Status Constants ---const LABEL_STATUSES = {    NEW: 'Nové',    IN_PROGRESS: 'V řešení',    RESOLVED: 'Vyřešeno'};
// --- Detail Item Component ---const DetailItem = ({ icon: Icon, label, value }) => (                                {label}            {value || 'N/A'}            );
// --- Enhanced FaultyLabelDetailsModal ---const FaultyLabelDetailsModal = ({ label, onClose }) => {    const [activeTab, setActiveTab] = useState('details');    const [newComment, setNewComment] = useState('');    const [comments, setComments] = useState(label.comments || []);    const [logs, setLogs] = useState([]);    const [isLoadingComments, setIsLoadingComments] = useState(false);    const [isLoadingLogs, setIsLoadingLogs] = useState(false);    const [error, setError] = useState(null);    const { userProfile } = useAuth();    const supabase = getSupabase();
const fetchComments = useCallback(async () => {
    setIsLoadingComments(true);
    setError(null);
    const { data, error } = await supabase
        .from('label_comments')
        .select('*')
        .eq('faulty_label_id', label.id)
        .order('created_at', { ascending: false });
    if (error) {
        setError('Nepodařilo se načíst komentáře.');
        toast.error('Chyba při načítání komentářů.');
    } else {
        setComments(data || []);
    }
    setIsLoadingComments(false);
}, [label.id, supabase]);

const fetchLogs = useCallback(async () => {
    setIsLoadingLogs(true);
    setError(null);
    const { data, error } = await supabase
        .from('faulty_label_logs')
        .select('*')
        .eq('faulty_label_id', label.id)
        .order('created_at', { ascending: false });
    if (error) {
        setError('Nepodařilo se načíst logy.');
        toast.error('Chyba při načítání logů.');
    } else {
        setLogs(data || []);
    }
    setIsLoadingLogs(false);
}, [label.id, supabase]);

useEffect(() => {
    fetchComments();
    fetchLogs();
}, [fetchComments, fetchLogs]);

const createLog = async (description) => {
    const { error } = await supabase.from('faulty_label_logs').insert({
        faulty_label_id: label.id,
        user_name: userProfile?.full_name || 'Uživatel',
        change_description: description
    });
    if (error) {
        toast.error('Chyba při vytváření logu.');
    }
};

const handleStatusChange = async (newStatus) => {
    if (!window.confirm(`Opravdu chcete změnit status na "${newStatus}"?`)) return;
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
    if (!newComment.trim() || !userProfile) {
        toast.error('Prosím zadejte komentář.');
        return;
    }
    const sanitizedComment = DOMPurify.sanitize(newComment);
    const commentData = {
        faulty_label_id: label.id,
        comment_text: sanitizedComment,
        author_id: userProfile.id,
        author_name: userProfile.full_name || 'Uživatel'
    };
    const { data, error } = await supabase.from('label_comments').insert(commentData).select().single();
    if (error) {
        toast.error('Chyba při přidávání komentáře.');
    } else {
        await createLog(`Přidal komentář: "${sanitizedComment}"`);
        setComments(prev => [...prev, data]);
        fetchLogs();
        fetchComments();
        setNewComment('');
        toast.success('Komentář byl přidán.');
    }
};

return (
    <Modal
        title={`Detail chyby pro zakázku ${label.delivery_no}`}
        onClose={() => onClose(false)}
        className="max-w-3xl"
        aria-labelledby="modal-title"
    >
        <div className="flex border-b border-slate-700 bg-slate-800">
            {['details', 'comments', 'logs'].map(tab => (
                <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-6 py-3 text-sm font-medium transition-colors duration-200 ${
                        activeTab === tab
                            ? 'border-b-2 border-sky-400 text-white'
                            : 'text-slate-400 hover:text-white'
                    }`}
                    aria-selected={activeTab === tab}
                    role="tab"
                >
                    {tab === 'details' ? 'Detaily' : tab === 'comments' ? 'Komentáře' : 'Log změn'}
                </button>
            ))}
        </div>

        <div className="p-6 bg-slate-900 rounded-b-lg">
            {error && <p className="text-red-500 mb-4">{error}</p>}
            {activeTab === 'details' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-6">
                        <h3 className="text-lg font-bold text-sky-300">Informace o zakázce</h3>
                        <DetailItem icon={Package} label="Číslo zakázky" value={label.delivery_no} />
                        <DetailItem icon={User} label="Příjemce" value={label.order_details?.["Name of ship-to party"]} />
                        <DetailItem
                            icon={Calendar}
                            label="Datum nakládky"
                            value={label.order_details?.["Loading Date"] ? format(parseISO(label.order_details["Loading Date"]), 'dd.MM.yyyy') : 'N/A'}
                        />
                        <DetailItem icon={Globe} label="Země doručení" value={label.order_details?.["Country ship-to prty"]} />
                    </div>
                    <div className="space-y-6">
                        <h3 className="text-lg font-bold text-sky-300">Detaily o chybě</h3>
                        <DetailItem icon={Tag} label="Typ zakázky" value={label.order_type} />
                        <DetailItem icon={MapPin} label="Umístění" value={label.location} />
                        <DetailItem icon={User} label="Vytvořil" value={label.created_by_name} />
                        <DetailItem icon={Calendar} label="Vytvořeno" value={format(new Date(label.created_at), 'dd.MM.yyyy HH:mm')} />
                        <DetailItem icon={MessageSquare} label="Poznámka" value={label.notes} />
                        <div>
                            <h4 className="font-semibold text-slate-300 mb-3 mt-6">Změnit Status</h4>
                            <div className="flex flex-wrap gap-3">
                                {Object.values(LABEL_STATUSES).map(status => (
                                    <Button
                                        key={status}
                                        onClick={() => handleStatusChange(status)}
                                        variant={label.status === status ? 'default' : 'secondary'}
                                        size="sm"
                                        className="transition-colors duration-200"
                                    >
                                        {status}
                                    </Button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}
            {activeTab === 'comments' && (
                <div className="flex flex-col h-96">
                    {isLoadingComments ? (
                        <p className="text-center text-slate-400 py-6">Načítám komentáře...</p>
                    ) : comments.length === 0 ? (
                        <p className="text-center text-slate-400 py-6">Žádné komentáře k dispozici.</p>
                    ) : (
                        <div className="flex-grow overflow-y-auto space-y-4 pr-2">
                            {comments.map(c => (
                                <div key={c.id} className="flex gap-3">
                                    <div className="w-10 h-10 rounded-full bg-slate-600 flex items-center justify-center text-sky-300 font-bold text-sm flex-shrink-0">
                                        {c.author_name?.charAt(0) || '?'}
                                    </div>
                                    <div className="flex-grow">
                                        <div className="flex items-center gap-3 mb-1">
                                            <p className="font-semibold text-sm text-sky-300">{c.author_name}</p>
                                            <p className="text-xs text-slate-400">{format(new Date(c.created_at), 'dd.MM HH:mm')}</p>
                                        </div>
                                        <p className="bg-slate-800 p-3 rounded-lg text-sm whitespace-pre-wrap break-words shadow-sm">{c.comment_text}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                    <div className="flex gap-3 mt-4 pt-4 border-t border-slate-700 flex-shrink-0">
                        <input
                            value={newComment}
                            onChange={e => setNewComment(e.target.value)}
                            placeholder="Napište komentář..."
                            className="flex-grow p-3 rounded-lg bg-slate-800 border border-slate-600 text-sm focus:ring-2 focus:ring-sky-400 focus:outline-none"
                            aria-label="Komentář"
                        />
                        <Button onClick={handleAddComment} size="sm" className="flex items-center gap-2">
                            <Send size={16} /> Odeslat
                        </Button>
                    </div>
                </div>
            )}
            {activeTab === 'logs' && (
                <div className="space-y-4 max-h-96 overflow-y-auto">
                    {isLoadingLogs ? (
                        <p className="text-center text-slate-400 py-6">Načítám logy...</p>
                    ) : logs.length === 0 ? (
                        <p className="text-center text-slate-400 py-6">Žádné logy k dispozici.</p>
                    ) : (
                        logs.map(log => (
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
                        ))
                    )}
                </div>
            )}
        </div>
    </Modal>
);

};
// --- NewFaultyLabelModal with Validation ---const NewFaultyLabelModal = ({ onClose, onCreated }) => {    const [formData, setFormData] = useState({ delivery_no: '', order_type: '', country: '', location: '', notes: '' });    const [errors, setErrors] = useState({});    const { userProfile } = useAuth();    const supabase = getSupabase();
const validateForm = () => {
    const newErrors = {};
    if (!formData.delivery_no.trim()) newErrors.delivery_no = 'Číslo zakázky je povinné.';
    if (!formData.order_type.trim()) newErrors.order_type = 'Typ zakázky je povinný.';
    if (!formData.location.trim()) newErrors.location = 'Umístění je povinné.';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
};

const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setErrors(prev => ({ ...prev, [name]: '' }));
};

const handleSubmit = async () => {
    if (!validateForm()) {
        toast.error('Prosím vyplňte všechny povinné údaje.');
        return;
    }

    const { data, error } = await supabase.from('faulty_labels').insert({
        ...formData,
        status: LABEL_STATUSES.NEW,
        created_by: userProfile.id,
        created_by_name: userProfile.full_name || 'Uživatel'
    }).select().single();

    if (error) {
        toast.error('Chyba při vytváření záznamu.');
    } else {
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
    <Modal title="Přidat chybějící etiketu" onClose={onClose} className="max-w-lg">
        <div className="p-6 space-y-5">
            <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Číslo zakázky</label>
                <input
                    name="delivery_no"
                    value={formData.delivery_no}
                    onChange={handleChange}
                    className={`w-full p-2 rounded-lg bg-slate-800 border ${errors.delivery_no ? 'border-red-500' : 'border-slate-600'} focus:ring-2 focus:ring-sky-400 focus:outline-none`}
                    aria-invalid={!!errors.delivery_no}
                    aria-label="Číslo zakázky"
                />
                {errors.delivery_no && <p className="text-red-500 text-xs mt-1">{errors.delivery_no}</p>}
            </div>
            <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Typ zakázky</label>
                <input
                    name="order_type"
                    value={formData.order_type}
                    onChange={handleChange}
                    className={`w-full p-2 rounded-lg bg-slate-800 border ${errors.order_type ? 'border-red-500' : 'border-slate-600'} focus:ring-2 focus:ring-sky-400 focus:outline-none`}
                    aria-invalid={!!errors.order_type}
                    aria-label="Typ zakázky"
                />
                {errors.order_type && <p className="text-red-500 text-xs mt-1">{errors.order_type}</p>}
            </div>
            <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Země doručení</label>
                <input
                    name="country"
                    value={formData.country}
                    onChange={handleChange}
                    className="w-full p-2 rounded-lg bg-slate-800 border border-slate-600 focus:ring-2 focus:ring-sky-400 focus:outline-none"
                    aria-label="Země doručení"
                />
            </div>
            <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Umístění</label>
                <input
                    name="location"
                    value={formData.location}
                    onChange={handleChange}
                    className={`w-full p-2 rounded-lg bg-slate-800 border ${errors.location ? 'border-red-500' : 'border-slate-600'} focus:ring-2 focus:ring-sky-400 focus:outline-none`}
                    aria-invalid={!!errors.location}
                    aria-label="Umístění"
                />
                {errors.location && <p className="text-red-500 text-xs mt-1">{errors.location}</p>}
            </div>
            <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Poznámka</label>
                <textarea
                    name="notes"
                    value={formData.notes}
                    onChange={handleChange}
                    className="w-full p-2 rounded-lg bg-slate-800 border border-slate-600 focus:ring-2 focus:ring-sky-400 focus:outline-none"
                    rows="3"
                    aria-label="Poznámka"
                />
            </div>
            <div className="flex justify-end gap-3 pt-4">
                <Button onClick={onClose} variant="secondary">Zrušit</Button>
                <Button onClick={handleSubmit}>Vytvořit</Button>
            </div>
        </div>
    </Modal>
);

};
// --- Main Component ---const FaultyLabelsTab = () => {    const [labels, setLabels] = useState([]);    const [loading, setLoading] = useState(true);    const [error, setError] = useState(null);    const [selectedLabel, setSelectedLabel] = useState(null);    const [showNewModal, setShowNewModal] = useState(false);    const [filters, setFilters] = useState({ query: '', status: 'all' });    const [page, setPage] = useState(1);    const [sortConfig, setSortConfig] = useState({ key: 'created_at', direction: 'desc' });    const pageSize = 20;    const supabase = getSupabase();    const { allOrdersData, pickingData, setSelectedOrderDetails } = useData();
const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    const { data, error } = await supabase
        .from('faulty_labels')
        .select(`*, comments:label_comments(*)`)
        .order('created_at', { ascending: false })
        .range((page - 1) * pageSize, page * pageSize - 1);

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
}, [supabase, allOrdersData, page]);

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

const sortedLabels = useMemo(() => {
    const sorted = [...filteredLabels];
    sorted.sort((a, b) => {
        const aValue = a[sortConfig.key] || '';
        const bValue = b[sortConfig.key] || '';
        if (sortConfig.direction === 'asc') {
            return aValue > bValue ? 1 : -1;
        }
        return aValue < bValue ? 1 : -1;
    });
    return sorted;
}, [filteredLabels, sortConfig]);

const handleCloseModal = (refresh) => {
    setSelectedLabel(null);
    if (refresh) fetchData();
};

const handleOpenOrderDetails = useCallback((deliveryNo) => {
    const orderDetails = allOrdersData.find(order => String(order['Delivery No']) === String(deliveryNo));
    if (orderDetails) {
        const relatedPicking = pickingData.filter(p => String(p.delivery_no) === String(deliveryNo));
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

const handleSort = (key) => {
    setSortConfig(prev => ({
        key,
        direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
};

return (
    <div className="p-4 space-y-6">
        <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-white">Přehled chybných etiket</h1>
            <Button onClick={() => setShowNewModal(true)} className="flex items-center gap-2">
                <PlusCircle size={16} /> Přidat chybějící etiketu
            </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-slate-800 border border-slate-700 rounded-lg">
            <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-300 mb-1">Hledat...</label>
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                        defaultValue={filters.query}
                        onChange={e => handleSearchChange(e.target.value)}
                        className="w-full p-2 pl-10 bg-slate-800 border border-slate-600 rounded-md text-white focus:ring-2 focus:ring-sky-400 focus:outline-none"
                        placeholder="Zakázka, země, umístění, vytvořil..."
                        aria-label="Vyhledávání"
                    />
                </div>
            </div>
            <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Status</label>
                <select
                    value={filters.status}
                    onChange={e => setFilters(prev => ({ ...prev, status: e.target.value }))}
                    className="w-full p-2 bg-slate-800 border border-slate-600 rounded-md text-white focus:ring-2 focus:ring-sky-400 focus:outline-none"
                    aria-label="Filtrovat podle statusu"
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
        ) : sortedLabels.length === 0 ? (
            <p className="text-center text-slate-400 py-6">Žádné záznamy neodpovídají zadaným filtrům.</p>
        ) : (
            <div className="space-y-4">
                <div className="hidden md:block bg-slate-800 border border-slate-700 rounded-lg overflow-hidden">
                    <table className="min-w-full divide-y divide-slate-700">
                        <thead className="bg-slate-700/50">
                            <tr>
                                <th
                                    onClick={() => handleSort('status')}
                                    className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase cursor-pointer hover:text-white"
                                >
                                    Status {sortConfig.key === 'status' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                                </th>
                                <th
                                    onClick={() => handleSort('delivery_no')}
                                    className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase cursor-pointer hover:text-white"
                                >
                                    Číslo zakázky {sortConfig.key === 'delivery_no' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                                </th>
                                <th
                                    onClick={() => handleSort('order_details.Country ship-to prty')}
                                    className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase cursor-pointer hover:text-white"
                                >
                                    Země doručení {sortConfig.key === 'order_details.Country ship-to prty' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                                </th>
                                <th
                                    onClick={() => handleSort('location')}
                                    className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase cursor-pointer hover:text-white"
                                >
                                    Umístění {sortConfig.key === 'location' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                                </th>
                                <th
                                    onClick={() => handleSort('created_by_name')}
                                    className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase cursor-pointer hover:text-white"
                                >
                                    Vytvořil {sortConfig.key === 'created_by_name' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                                </th>
                                <th
                                    onClick={() => handleSort('created_at')}
                                    className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase cursor-pointer hover:text-white"
                                >
                                    Vytvořeno {sortConfig.key === 'created_at' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">Akce</th>
                            </tr>
                        </thead>
                        <tbody className="bg-slate-800 divide-y divide-slate-700">
                            {sortedLabels.map(label => (
                                <tr key={label.id} className="hover:bg-slate-700/50">
                                    <td className="px-4 py-3 whitespace-nowrap text-sm">
                                        <span className={`px-2 py-1 rounded-full text-xs font-semibold text-white ${getStatusColorClass(label.status)}`}>
                                            {label.status}
                                        </span>
                                    </td>
                                    <td
                                        className="px-4 py-3 whitespace-nowrap text-sm font-semibold text-sky-400 hover:underline cursor-pointer"
                                        onClick={() => handleOpenOrderDetails(label.delivery_no)}
                                    >
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
                <div className="md:hidden space-y-4">
                    {sortedLabels.map(label => (
                        <div key={label.id} className="bg-slate-800 p-4 rounded-lg border border-slate-700 shadow-sm">
                            <div className="flex justify-between items-center">
                                <span className={`px-2 py-1 rounded-full text-xs font-semibold text-white ${getStatusColorClass(label.status)}`}>
                                    {label.status}
                                </span>
                                <Button onClick={() => setSelectedLabel(label)} size="sm">Detail</Button>
                            </div>
                            <p
                                className="text-sm font-semibold text-sky-400 mt-3 hover:underline cursor-pointer"
                                onClick={() => handleOpenOrderDetails(label.delivery_no)}
                            >
                                {label.delivery_no}
                            </p>
                            <p className="text-sm text-slate-300">Země: {label.order_details?.["Country ship-to prty"] || 'N/A'}</p>
                            <p className="text-sm text-slate-300">Umístění: {label.location || 'N/A'}</p>
                            <p className="text-sm text-slate-300">Vytvořil: {label.created_by_name}</p>
                            <p className="text-sm text-slate-300">Vytvořeno: {format(new Date(label.created_at), 'dd.MM.yyyy HH:mm')}</p>
                        </div>
                    ))}
                </div>
                <div className="flex justify-between items-center mt-4">
                    <Button
                        onClick={() => setPage(prev => Math.max(prev - 1, 1))}
                        disabled={page === 1}
                        variant="secondary"
                    >
                        Předchozí
                    </Button>
                    <span className="text-sm text-slate-300">Strana {page}</span>
                    <Button
                        onClick={() => setPage(prev => prev + 1)}
                        disabled={sortedLabels.length < pageSize}
                        variant="secondary"
                    >
                        Další
                    </Button>
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