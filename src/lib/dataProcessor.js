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

    const latestOrdersMap = new Map();
    for (const order of rawData) {
        const deliveryNo = String(order["Delivery No"] || order["Delivery"] || '').trim();
        if (!deliveryNo) continue;

        const existingOrder = latestOrdersMap.get(deliveryNo);
        const newOrderTimestamp = order.updated_at ? new Date(order.updated_at).getTime() : 0;
        const existingOrderTimestamp = existingOrder?.updated_at ? new Date(existingOrder.updated_at).getTime() : 0;

        if (!existingOrder || newOrderTimestamp > existingOrderTimestamp) {
            latestOrdersMap.set(deliveryNo, order);
        }
    }
    const uniqueData = Array.from(latestOrdersMap.values());

    const summary = {
        total: uniqueData.length,
        doneTotal: 0,
        inProgressTotal: 0,
        newOrdersTotal: 0,
        delayed: 0,
        statusCounts: {},
        deliveryTypes: {},
        delayedOrdersList: [],
        dailySummaries: new Map(),
        allOrdersData: uniqueData,
    };

    const doneStatuses = [50, 60, 70, 80, 90];
    const inProgressStatuses = [31, 35, 40];
    const newStatus = [10];
    const remainingStatuses = [10, 30, 31, 35, 40];
    const today = startOfDay(new Date());

    uniqueData.forEach(row => {
        const status = Number(row.Status);
        if (isNaN(status)) return;

        // Celkové statistiky
        summary.statusCounts[status] = (summary.statusCounts[status] || 0) + 1;
        if (doneStatuses.includes(status)) summary.doneTotal++;
        if (inProgressStatuses.includes(status)) summary.inProgressTotal++;
        if (newStatus.includes(status)) summary.newOrdersTotal++;
        if (row["del.type"] === 'P') summary.palletsTotal = (summary.palletsTotal || 0) + 1;
        if (row["del.type"] === 'K') summary.cartonsTotal = (summary.cartonsTotal || 0) + 1;
        
        const loadingDate = parseDataDate(row["Loading Date"]);

        if (loadingDate) {
            const dateKey = format(startOfDay(loadingDate), 'yyyy-MM-dd');
            if (!summary.dailySummaries.has(dateKey)) {
                summary.dailySummaries.set(dateKey, { date: dateKey, total: 0, done: 0, inProgress: 0, new: 0, remaining: 0 });
            }
            const day = summary.dailySummaries.get(dateKey);
            
            day.total++;
            if (doneStatuses.includes(status)) {
                day.done++;
            } else if (inProgressStatuses.includes(status)) {
                day.inProgress++;
            } else if (newStatus.includes(status)) {
                day.new++;
            }
        }
        
        if (loadingDate && isBefore(loadingDate, today) && remainingStatuses.includes(status)) {
            summary.delayed++;
            summary.delayedOrdersList.push({
                delivery: String(row["Delivery No"] || row["Delivery"] || '').trim(),
                status,
                delType: row["del.type"],
                loadingDate: loadingDate.toISOString(),
                delayDays: differenceInDays(today, loadingDate),
                note: row["Note"] || "",
            });
        }
    });
    
    summary.remainingTotal = summary.total - summary.doneTotal;

    // Finální výpočet "Zbývá" pro každý den
    summary.dailySummaries.forEach(day => {
        day.remaining = day.total - day.done;
    });

    summary.dailySummaries = Array.from(summary.dailySummaries.values()).sort((a, b) => new Date(a.date) - new Date(b.date));

    return summary;
};
