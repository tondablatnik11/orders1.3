import { format, parseISO, startOfDay, isBefore, differenceInDays } from 'date-fns';

export const exportToPDF = (elementId) => {
    const input = document.getElementById(elementId);
    if (!input) {
        console.error(`Element with ID "${elementId}" not found.`);
        return;
    }

    if (typeof window.html2canvas === 'undefined' || typeof window.jspdf === 'undefined') {
        console.error("html2canvas or jsPDF library not loaded.");
        return;
    }

    const { jsPDF } = window.jspdf;

    window.html2canvas(input, { scale: 2, backgroundColor: '#111827' }).then((canvas) => {
        const imgData = canvas.toDataURL("image/png");
        const pdf = new jsPDF("p", "mm", "a4");
        const imgWidth = 210;
        const pageHeight = 297;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        let heightLeft = imgHeight;
        let position = 0;

        pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;

        while (heightLeft >= 0) {
            position = heightLeft - imgHeight;
            pdf.addPage();
            pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
            heightLeft -= pageHeight;
        }
        pdf.save("report.pdf");
    });
};

const exportToXLSX = (data, t, fileName = 'export') => {
    if (typeof window.XLSX === 'undefined') {
        console.error("XLSX library not loaded.");
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
    const { data, error } = await supabaseClient
        .from('deliveries')
        .select('"Delivery No", "Status", "del.type", "Loading Date", "Note", "Forwarding agent name", "Name of ship-to party", "Total Weight", "Bill of lading"')
        .lt('"Loading Date"', today.toISOString())
        .not('Status', 'in', '(50,60,70)');

    if (error) {
        console.error('Error fetching delayed deliveries:', error.message);
        return;
    }

    const formattedData = data.map(item => {
        const parsedDate = item["Loading Date"] ? parseISO(item["Loading Date"]) : null;
        const delayDays = (parsedDate && isBefore(parsedDate, today)) ? differenceInDays(today, parsedDate) : 0;
        return {
            [t.deliveryNo]: item["Delivery No"],
            [t.status]: item.Status,
            [t.deliveryType]: item["del.type"],
            [t.loadingDate]: parsedDate ? format(parsedDate, 'dd.MM.yyyy') : 'N/A',
            [t.delay]: delayDays,
            [t.note]: item.Note || '',
            [t.forwardingAgent]: item["Forwarding agent name"] || 'N/A',
            [t.shipToPartyName]: item["Name of ship-to party"] || 'N/A',
        };
    });
    
    exportToXLSX(formattedData, t, t.delayed);
};

export const exportSearchResultsToXLSX = (searchData, t) => {
    const formattedData = searchData.map(order => ({
        [t.deliveryNo]: order["Delivery No"],
        [t.status]: order.Status,
        [t.deliveryType]: order["del.type"],
        [t.loadingDate]: order["Loading Date"] ? format(parseISO(order["Loading Date"]), 'dd/MM/yyyy') : 'N/A',
        [t.note]: order.Note,
    }));
    exportToXLSX(formattedData, t, "Vysledky_vyhledavani");
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
    exportToXLSX(formattedData, t, "Tickety");
};