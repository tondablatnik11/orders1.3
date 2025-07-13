// src/lib/exportUtils.js - Updated to filter 0-day delays during export
import { format, parseISO, startOfDay, isBefore, differenceInDays } from 'date-fns';

// Pomocná funkce pro export do XLSX - může být definována lokálně nebo importována
const exportToXLSX = (data, t, fileName = 'export') => {
    if (typeof window.XLSX === 'undefined') {
        console.error("XLSX library not loaded.");
        alert(t.xlsxLibNotLoaded || "XLSX library not loaded. Please try refreshing the page."); // Použití překladu
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

export const exportDelayedOrdersXLSX = async (supabaseClient, t) => {
    const today = startOfDay(new Date());
    // Získáme data ze Supabase, filtrujeme jen ty, co mají datum nakládky před dneškem
    // a nejsou ve stavech "hotovo"
    // OPRAVA: Přidán .limit(10000) pro navýšení limitu i v exportu
    const { data, error } = await supabaseClient
        .from('deliveries')
        .select('"Delivery No", "Status", "del.type", "Loading Date", "Note", "Forwarding agent name", "Name of ship-to party", "Total Weight", "Bill of lading"')
        .lt('"Loading Date"', today.toISOString())
        .not('Status', 'in', '(50,60,70)')
        .limit(10000); 

    if (error) {
        console.error('Error fetching delayed deliveries for XLSX export:', error.message);
        alert(t.exportError + ` ${error.message}`); // Použití překladu pro chybu exportu
        return;
    }

    const formattedData = data.map(item => {
        let parsedDate = null;
        if (item["Loading Date"]) {
            try {
                parsedDate = parseISO(item["Loading Date"]);
                if (isNaN(parsedDate.getTime())) {
                    parsedDate = null; 
                }
            } catch (e) {
                console.error("Error parsing date for export:", item["Loading Date"], e);
                parsedDate = null;
            }
        }

        const delayDays = (parsedDate && isBefore(parsedDate, today) && ![50, 60, 70].includes(Number(item.Status)))
            ? differenceInDays(today, parsedDate)
            : 0;
        
        if (delayDays === 0) {
            return null; 
        }

        return {
            [t.deliveryNo]: item["Delivery No"],
            [t.status]: item.Status,
            [t.deliveryType]: item["del.type"],
            [t.loadingDate]: parsedDate ? format(parsedDate, 'dd.MM.yyyy') : 'N/A',
            [t.delay]: delayDays,
            [t.note]: item.Note || '',
            [t.forwardingAgent]: item["Forwarding agent name"] || 'N/A',
            [t.shipToPartyName]: item["Name of ship-to party"] || 'N/A',
            [t.totalWeight]: item["Total Weight"] || 'N/A',
            [t.billOfLading]: item["Bill of lading"] || 'N/A',
        };
    }).filter(item => item !== null); 
    
    if (formattedData.length === 0) {
        alert(t.noDataAvailable || "No data to export after filtering 0-day delays.");
        console.log("No data to export after filtering 0-day delays.");
        return;
    }

    exportToXLSX(formattedData, t, t.delayed);
};

// Pokud máte v exportUtils.js i další exportní funkce, aktualizujte je také, např.:
export const exportSearchResultsToXLSX = (searchData, t) => {
    const formattedData = searchData.map(order => ({
        [t.deliveryNo]: order["Delivery No"],
        [t.status]: order.Status,
        [t.deliveryType]: order["del.type"],
        [t.loadingDate]: order["Loading Date"] ? format(parseISO(order["Loading Date"]), 'dd/MM/yyyy') : 'N/A',
        [t.note]: order.Note,
    }));
    // Použijte lokální exportToXLSX funkci
    exportToXLSX(formattedData, t, t.searchOrders); // Předpokládám, že t.searchOrders je název pro export souboru
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
    // Použijte lokální exportToXLSX funkci
    exportToXLSX(formattedData, t, t.ticketsTab); // Předpokládám, že t.ticketsTab je název pro export souboru
};