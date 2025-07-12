import { startOfDay, format, isBefore, parseISO, differenceInDays } from 'date-fns';

export const processData = (rawData) => {
    if (!rawData || rawData.length === 0) {
        return null;
    }

    const summary = {
        total: 0,
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
        dailySummaries: {},
    };

    const doneStatuses = [50, 60, 70];
    const today = startOfDay(new Date());

    rawData.forEach(row => {
        const status = Number(row.Status);
        if (isNaN(status)) return;

        summary.total++;
        if (doneStatuses.includes(status)) summary.doneTotal++;
        if (status === 10) summary.newOrdersTotal++;
        if (status >= 30 && status < 50) summary.inProgressTotal++;
        if (row["del.type"] === 'P') summary.palletsTotal++;
        if (row["del.type"] === 'K') summary.cartonsTotal++;

        summary.statusCounts[status] = (summary.statusCounts[status] || 0) + 1;
        if(row["del.type"]) summary.deliveryTypes[row["del.type"]] = (summary.deliveryTypes[row["del.type"]] || 0) + 1;

        const loadingDateStr = row["Loading Date"];
        if (loadingDateStr) {
            const loadingDate = parseISO(loadingDateStr);
            if (!isNaN(loadingDate.getTime())) {
                const dateKey = format(loadingDate, 'yyyy-MM-dd');
                if (!summary.dailySummaries[dateKey]) {
                    summary.dailySummaries[dateKey] = { date: dateKey, total: 0 };
                }
                summary.dailySummaries[dateKey].total++;
                
                if (isBefore(loadingDate, today) && !doneStatuses.includes(status)) {
                    summary.delayed++;
                    summary.delayedOrdersList.push({ ...row, delayDays: differenceInDays(today, loadingDate) });
                }
            }
        }
    });

    summary.remainingTotal = summary.total - summary.doneTotal;
    return summary;
};