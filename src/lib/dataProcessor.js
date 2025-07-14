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

    // --- KROK 1: ODSTRANĚNÍ DUPLIKÁTŮ (Spolehlivá a opravená verze) ---
    const latestOrdersMap = new Map();
    for (const order of rawData) {
        const deliveryNo = String(order["Delivery No"] || order["Delivery"] || '').trim();
        if (!deliveryNo) continue;

        const existingOrder = latestOrdersMap.get(deliveryNo);

        if (!existingOrder) {
            latestOrdersMap.set(deliveryNo, order);
            continue;
        }

        const newTimestamp = order.updated_at || order.created_at;
        const existingTimestamp = existingOrder.updated_at || existingOrder.created_at;

        if (newTimestamp && !existingTimestamp) {
            latestOrdersMap.set(deliveryNo, order);
        } else if (newTimestamp && existingTimestamp) {
            if (new Date(newTimestamp) > new Date(existingTimestamp)) {
                latestOrdersMap.set(deliveryNo, order);
            }
        }
    }
    const uniqueData = Array.from(latestOrdersMap.values());
    // --- KONEC KROKU 1 ---

    const summary = {
        total: uniqueData.length,
        doneTotal: 0,
        remainingTotal: 0,
        inProgressTotal: 0,
        newOrdersTotal: 0,
        palletsTotal: 0,
        cartonsTotal: 0,
        delayed: 0,
        statusCounts: {},
        deliveryTypes: {},
        ordersByCountry: {},
        delayedOrdersList: [],
        dailySummaries: new Map(),
        statusByLoadingDate: {},
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

        const country = row["Ctry sold-to party"];
        if (country) {
            summary.ordersByCountry[country] = (summary.ordersByCountry[country] || 0) + 1;
        }

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

            if (!summary.statusByLoadingDate[dateKey]) {
                summary.statusByLoadingDate[dateKey] = { date: dateKey };
            }
            summary.statusByLoadingDate[dateKey][`status${status}`] = (summary.statusByLoadingDate[dateKey][`status${status}`] || 0) + 1;
        }

        if (loadingDate && isBefore(loadingDate, today) && remainingStatuses.includes(status)) {
            summary.delayed++;
            summary.delayedOrdersList.push({
                delivery: String(row["Delivery No"] || row["Delivery"] || '').trim(),
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
    summary.dailySummaries.forEach(day => {
        day.remaining = day.total - day.done;
    });
    summary.dailySummaries = Array.from(summary.dailySummaries.values()).sort((a, b) => new Date(a.date) - new Date(b.date));

    return summary;
};