import { startOfDay, format, isBefore, parseISO, differenceInDays } from 'date-fns';

const parseDataDate = (dateInput) => {
    if (!dateInput) return null;
    let date = parseISO(dateInput);
    if (!isNaN(date.getTime())) return date;

    if (typeof dateInput === 'number') {
        date = new Date(Math.round((dateInput - 25569) * 86400 * 1000));
        if (!isNaN(date.getTime())) return date;
    }
    return null;
};

export const processData = (rawData) => {
    if (!rawData || rawData.length === 0) {
        return null;
    }

    const summary = {
        total: rawData.length,
        doneTotal: 0,
        remainingTotal: 0,
        inProgressTotal: 0,
        newOrdersTotal: 0,
        palletsTotal: 0,
        cartonsTotal: 0,
        delayed: 0,
        statusCounts: {},
        deliveryTypes: {},
        delayedOrdersList: [],
        dailySummaries: new Map(),
        statusByLoadingDate: {},
        allOrdersData: rawData,
    };

    const doneStatuses = [50, 60, 70];
    const inProgressStatuses = [31, 35, 40];
    const newStatus = [10];
    const remainingStatuses = [10, 31, 35, 40];
    const today = startOfDay(new Date());

    rawData.forEach(row => {
        const status = Number(row.Status);
        const deliveryIdentifier = String(row["Delivery No"] || row["Delivery"] || '').trim();

        if (isNaN(status) || !deliveryIdentifier) return;

        if (doneStatuses.includes(status)) summary.doneTotal++;
        if (newStatus.includes(status)) summary.newOrdersTotal++;
        if (inProgressStatuses.includes(status)) summary.inProgressTotal++;
        if (row["del.type"] === 'P') summary.palletsTotal++;
        if (row["del.type"] === 'K') summary.cartonsTotal++;

        summary.statusCounts[status] = (summary.statusCounts[status] || 0) + 1;
        if(row["del.type"]) summary.deliveryTypes[row["del.type"]] = (summary.deliveryTypes[row["del.type"]] || 0) + 1;

        const loadingDate = parseDataDate(row["Loading Date"]);

        if (loadingDate) {
            const dateKey = format(startOfDay(loadingDate), 'yyyy-MM-dd');
            if (!summary.dailySummaries.has(dateKey)) {
                summary.dailySummaries.set(dateKey, { date: dateKey, total: 0, done: 0, remaining: 0, new: 0, inProgress: 0 });
            }
            const day = summary.dailySummaries.get(dateKey);
            day.total++;
            if (doneStatuses.includes(status)) day.done++;
            if (remainingStatuses.includes(status)) day.remaining++;
            if (newStatus.includes(status)) day.new++;
            if (inProgressStatuses.includes(status)) day.inProgress++;

            // OPRAVA: Používáme jednotný klíč 'yyyy-MM-dd' pro seskupování, aby se zamezilo duplicitám.
            if (!summary.statusByLoadingDate[dateKey]) {
                summary.statusByLoadingDate[dateKey] = { date: dateKey };
            }
            summary.statusByLoadingDate[dateKey][`status${status}`] = (summary.statusByLoadingDate[dateKey][`status${status}`] || 0) + 1;
        }
        
        // OPRAVA KONTROLY ZPOŽDĚNÝCH ZAKÁZEK
        if (loadingDate && isBefore(loadingDate, today) && remainingStatuses.includes(status)) {
            summary.delayed++;
            summary.delayedOrdersList.push({
                delivery: deliveryIdentifier,
                status: status,
                delType: row["del.type"],
                loadingDate: loadingDate.toISOString(),
                delayDays: differenceInDays(today, loadingDate),
                note: row["Note"] || "",
                "Forwarding agent name": row["Forwarding agent name"] || "N/A",
                "Name of ship-to party": row["Name of ship-to party"] || "N/A",
                "Total Weight": row["Total Weight"] || "N/A",
                "Bill of lading": row["Bill of lading"] || "N/A",
            });
        }
    });
    
    summary.remainingTotal = summary.total - summary.doneTotal;
    summary.delayedOrdersList.sort((a, b) => b.delayDays - a.delayDays);
    summary.dailySummaries = Array.from(summary.dailySummaries.values()).sort((a, b) => new Date(a.date) - new Date(b.date));

    return summary;
};