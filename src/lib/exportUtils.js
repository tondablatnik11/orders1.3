import { format, parseISO } from 'date-fns';

const exportToXLSX = (data, t, fileName = 'export') => {
    if (typeof window.XLSX === 'undefined') {
        console.error("XLSX library not loaded.");
        alert(t.xlsxLibNotLoaded || "XLSX library not loaded. Please try refreshing the page.");
        return;
    }
    if (!data || data.length === 0) {
        alert(t.noDataAvailable || "No data to export.");
        return;
    }

    const ws = window.XLSX.utils.json_to_sheet(data);
    const wb = window.XLSX.utils.book_new();
    window.XLSX.utils.book_append_sheet(wb, ws, "Data");
    window.XLSX.writeFile(wb, `${fileName}_${format(new Date(), 'yyyyMMdd')}.xlsx`);
};

export const exportDelayedOrdersXLSX = (delayedOrders, t) => {
    const formattedData = delayedOrders.map(item => ({
        [t.deliveryNo]: item.delivery,
        [t.status]: item.status,
        [t.deliveryType]: item.delType,
        [t.loadingDate]: item.loadingDate ? format(parseISO(item.loadingDate), 'dd.MM.yyyy') : 'N/A',
        [t.delay]: item.delayDays,
        [t.billOfLading]: item["Bill of lading"],
        [t.note]: item.note,
    }));
    
    if (formattedData.length === 0) {
        alert(t.noDataAvailable || "No delayed orders to export.");
        return;
    }
    exportToXLSX(formattedData, t, t.delayed);
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
    exportToXLSX(formattedData, t, t.searchOrders);
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
    exportToXLSX(formattedData, t, t.ticketsTab);
};