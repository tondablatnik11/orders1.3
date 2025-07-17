import { format, parseISO } from 'date-fns';
import toast from 'react-hot-toast';

const exportToXLSX = (data, fileName = 'export', t) => {
    if (typeof window === 'undefined' || typeof window.XLSX === 'undefined') {
        if (typeof window !== 'undefined') {
            toast.error(t.xlsxLibNotLoaded || "Knihovna pro export není připravena.");
        }
        return;
    }

    if (!data || data.length === 0) {
        toast.error(t.noDataAvailable || "Nejsou k dispozici žádná data pro export.");
        return;
    }

    try {
        const ws = window.XLSX.utils.json_to_sheet(data);
        const wb = window.XLSX.utils.book_new();
        window.XLSX.utils.book_append_sheet(wb, ws, "Data");
        window.XLSX.writeFile(wb, `${fileName.replace(/ /g, '_')}_${format(new Date(), 'yyyyMMdd')}.xlsx`);
    } catch (error) {
        toast.error("Při exportu došlo k chybě.");
        console.error("XLSX Export Error:", error);
    }
};

export const exportCustomOrdersToXLSX = (orders, title, t) => {
    if (!orders || orders.length === 0) {
        toast.error(t.noDataAvailable || "Nejsou k dispozici žádná data pro export.");
        return;
    }
    const formattedData = orders.map(order => ({
        [t.deliveryNo]: order["Delivery No"],
        [t.status]: order.Status,
        [t.deliveryType]: order["del.type"],
        [t.loadingDate]: order["Loading Date"] ? format(parseISO(order["Loading Date"]), 'dd/MM/yyyy') : 'N/A',
        [t.forwardingAgent]: order["Forwarding agent name"],
        [t.shipToPartyName]: order["Name of ship-to party"],
        [t.totalWeight]: order["Total Weight"],
        [t.billOfLading]: order["Bill of lading"],
        [t.note]: order.Note,
    }));
    exportToXLSX(formattedData, title, t);
};

// ... (zbytek exportovacích funkcí beze změny)
export const exportDelayedOrdersXLSX = (delayedOrders, t) => {
    if (!delayedOrders || delayedOrders.length === 0) {
        toast.error(t.noDataAvailable || "Nejsou žádné zpožděné zakázky k exportu.");
        return;
    }
    const formattedData = delayedOrders.map(item => ({
        [t.deliveryNo]: item.delivery,
        [t.status]: item.status,
        [t.deliveryType]: item.delType,
        [t.loadingDate]: item.loadingDate ? format(parseISO(item.loadingDate), 'dd.MM.yyyy') : 'N/A',
        [t.delay]: item.delayDays,
        [t.billOfLading]: item["Bill of lading"],
        [t.note]: item.note,
    }));
    exportToXLSX(formattedData, t.delayed, t);
};


export const exportSearchResultsToXLSX = (searchData, t) => {
    const formattedData = searchData.map(order => ({
        [t.deliveryNo]: order["Delivery No"],
        [t.status]: order.Status,
        [t.deliveryType]: order["del.type"],
        [t.loadingDate]: order["Loading Date"] ? format(parseISO(order["Loading Date"]), 'dd/MM/yyyy') : 'N/A',
        [t.forwardingAgent]: order["Forwarding agent name"],
        [t.shipToPartyName]: order["Name of ship-to party"],
        [t.totalWeight]: order["Total Weight"],
        [t.billOfLading]: order["Bill of lading"],
        [t.note]: order.Note,
    }));
    exportToXLSX(formattedData, t.searchOrders, t);
};

export const exportTicketsToXLSX = (tickets, allUsers, t) => {
    const formattedData = tickets.map(ticket => ({
        [t.ticketTitle]: ticket.title,
        [t.ticketDescription]: ticket.description,
        [t.assignedTo]: allUsers.find(u => u.uid === ticket.assignedTo)?.displayName || ticket.assignedTo,
        [t.statusTicket]: ticket.status,
        [t.createdBy]: ticket.createdByName,
        [t.createdAt]: format(parseISO(ticket.createdAt), 'dd/MM/yyyy HH:mm'),
        [t.attachment]: ticket.attachmentName || 'N/A'
    }));
    exportToXLSX(formattedData, t.ticketsTab, t);
};