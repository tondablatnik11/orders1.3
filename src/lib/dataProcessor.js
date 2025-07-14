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
    if (!rawData || rawData.length === 0) return null;

    const summary = {
        total: rawData.length, doneTotal: 0, inProgressTotal: 0, newOrdersTotal: 0, delayed: 0,
        palletsTotal: 0, cartonsTotal: 0, statusCounts: {}, deliveryTypes: {}, ordersByCountry: {},
        delayedByCarrier: {}, recentUpdates: [], allOrdersData: rawData, dailySummaries: new Map(),
        statusByLoadingDate: {}, delayedOrdersList: [],
    };

    const doneStatuses = [50, 60, 70, 80, 90];
    const inProgressStatuses = [31, 35, 40];
    const newStatus = [10];
    const remainingStatuses = [10, 30, 31, 35, 40];
    const today = startOfDay(new Date());

    rawData.forEach(row => {
        const status = Number(row.Status);
        if (isNaN(status)) return;
        
        const loadingDate = parseDataDate(row["Loading Date"]);
        
        if (loadingDate && isBefore(loadingDate, today) && remainingStatuses.includes(status)) {
            summary.delayed++;
            const carrier = row["Forwarding agent name"] || "Neznámý";
            summary.delayedByCarrier[carrier] = (summary.delayedByCarrier[carrier] || 0) + 1;
            summary.delayedOrdersList.push({
                ...row,
                delivery: String(row["Delivery No"] || '').trim(), status,
                delType: row["del.type"], loadingDate: loadingDate.toISOString(),
                delayDays: differenceInDays(today, loadingDate),
            });
        }
        
        // --- TOTO JE OPRAVENÝ ŘÁDEK ---
        const country = row["Country ship-to prty"];
        if (country) summary.ordersByCountry[country] = (summary.ordersByCountry[country] || 0) + 1;
        // --------------------------------

        summary.statusCounts[status] = (summary.statusCounts[status] || 0) + 1;
        if (doneStatuses.includes(status)) summary.doneTotal++;
        if (inProgressStatuses.includes(status)) summary.inProgressTotal++;
        if (newStatus.includes(status)) summary.newOrdersTotal++;
        
        const delType = row["del.type"] === 'P' ? 'Palety' : (row["del.type"] === 'K' ? 'Kartony' : 'Jiné');
        summary.deliveryTypes[delType] = (summary.deliveryTypes[delType] || 0) + 1;

        if (loadingDate) {
            const dateKey = format(startOfDay(loadingDate), 'yyyy-MM-dd');

            if (!summary.dailySummaries.has(dateKey)) {
                summary.dailySummaries.set(dateKey, { date: dateKey, total: 0, done: 0, inProgress: 0, new: 0, remaining: 0 });
            }
            const day = summary.dailySummaries.get(dateKey);
            day.total++;
            if (doneStatuses.includes(status)) day.done++;
            else if (inProgressStatuses.includes(status)) day.inProgress++;
            else if (newStatus.includes(status)) day.new++;

            if (!summary.statusByLoadingDate[dateKey]) summary.statusByLoadingDate[dateKey] = { date: dateKey };
            summary.statusByLoadingDate[dateKey][`status${status}`] = (summary.statusByLoadingDate[dateKey][`status${status}`] || 0) + 1;
        }
    });
    
    summary.remainingTotal = summary.total - summary.doneTotal;
    summary.dailySummaries.forEach(day => day.remaining = day.total - day.done);
    summary.dailySummaries = Array.from(summary.dailySummaries.values()).sort((a, b) => new Date(a.date) - new Date(b.date));
    summary.recentUpdates = rawData.filter(o => o.updated_at).sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at)).slice(0, 5);

    return summary;
};