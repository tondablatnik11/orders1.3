import { startOfDay, format, isBefore, isAfter, parseISO, differenceInDays, subDays, startOfMonth, endOfMonth, addDays } from 'date-fns';
import { getCurrentShift, parseExcelDate } from './utils';

export const processData = (rawData, filters) => {
    if (!rawData || rawData.length === 0) {
        return null;
    }
    
    const now = new Date();
    const today = startOfDay(now);

    let filteredData = [...rawData];

    // Apply filters from filters object if it exists
    if (filters) {
        if (filters.timeRange && filters.timeRange !== 'all') {
            let startDate, endDate;
            if (filters.timeRange === 'today') {
                startDate = today;
                endDate = addDays(today, 1);
            } else if (filters.timeRange === 'yesterday') {
                startDate = subDays(today, 1);
                endDate = today;
            } else if (filters.timeRange === 'last7days') {
                startDate = subDays(today, 6);
                endDate = addDays(today, 1);
            } else if (filters.timeRange === 'thisMonth') {
                startDate = startOfMonth(today);
                endDate = addDays(endOfMonth(today), 1);
            } else if (filters.timeRange === 'custom' && filters.startDate && filters.endDate) {
                startDate = startOfDay(parseISO(filters.startDate));
                endDate = addDays(startOfDay(parseISO(filters.endDate)), 1);
            }

            if(startDate && endDate) {
                filteredData = filteredData.filter(row => {
                    const date = parseExcelDate(row["Loading Date"]);
                    return date && !isNaN(date.getTime()) && date >= startDate && date < endDate;
                });
            }
        }
        
        if (filters.deliveryType && filters.deliveryType !== 'all') {
            filteredData = filteredData.filter(row => row["del.type"] === filters.deliveryType);
        }
        if (filters.status && filters.status !== 'all') {
            filteredData = filteredData.filter(row => String(row.Status) === String(filters.status));
        }
    }


    const result = {
        total: 0, doneTotal: 0, remainingTotal: 0, inProgressTotal: 0, newOrdersTotal: 0,
        palletsTotal: 0, cartonsTotal: 0, delayed: 0, sentPallets: 0, sentCartons: 0,
        statusCounts: {}, deliveryTypes: {}, delayedOrdersList: [], dailySummaries: [],
        allAvailableDates: new Set(), currentShift: getCurrentShift(now), hourlyStatusSnapshots: {},
        shiftDoneCounts: { '1': 0, '2': 0 }, statusByDateCategory: {},
        deliveryTypeByDateCategory: {}, statusByLoadingDate: {}, allOrdersData: filteredData
    };

    for (let h = 0; h <= 23; h++) {
        const hourKey = format(new Date(today.getFullYear(), today.getMonth(), today.getDate(), h), 'HH');
        result.hourlyStatusSnapshots[hourKey] = {};
    }

    const dailySummariesMap = new Map();
    const doneStatuses = [50, 60, 70];
    const remainingStatuses = [10, 31, 35, 40];
    const inProgressStatuses = [31, 35, 40];
    const newOrderStatuses = [10];

    filteredData.forEach((row) => {
        const loadingDate = row["Loading Date"];
        const status = Number(row["Status"]);
        const delType = row["del.type"];
        const deliveryIdentifier = (row["Delivery"] || row["Delivery No"])?.trim();

        if (!loadingDate || isNaN(status) || !deliveryIdentifier) return;
        const parsedDate = parseExcelDate(loadingDate);
        if (!parsedDate || isNaN(parsedDate.getTime())) return;

        const formattedDate_YYYYMMDD = format(parsedDate, "yyyy-MM-dd");
        result.allAvailableDates.add(formattedDate_YYYYMMDD);

        result.total++;
        if (doneStatuses.includes(status)) result.doneTotal++;
        if (remainingStatuses.includes(status)) result.remainingTotal++;
        if (inProgressStatuses.includes(status)) result.inProgressTotal++;
        if (newOrderStatuses.includes(status)) result.newOrdersTotal++;
        if (delType === "P") result.palletsTotal++;
        if (delType === "K") result.cartonsTotal++;

        if (!dailySummariesMap.has(formattedDate_YYYYMMDD)) {
            dailySummariesMap.set(formattedDate_YYYYMMDD, {
                date: formattedDate_YYYYMMDD, total: 0, done: 0, remaining: 0, inProgress: 0, newOrders: 0, statusCounts: {}
            });
        }
        const dayStats = dailySummariesMap.get(formattedDate_YYYYMMDD);
        dayStats.total++;
        if (doneStatuses.includes(status)) dayStats.done++;
        if (remainingStatuses.includes(status)) dayStats.remaining++;
        if (inProgressStatuses.includes(status)) dayStats.inProgress++;
        if (newOrderStatuses.includes(status)) dayStats.newOrders++;
        dayStats.statusCounts[status] = (dayStats.statusCounts[status] || 0) + 1;


        result.statusCounts[status] = (result.statusCounts[status] || 0) + 1;
        if (delType) result.deliveryTypes[delType] = (result.deliveryTypes[delType] || 0) + 1;

        if (isBefore(parsedDate, today) && !doneStatuses.includes(status)) {
            result.delayed++;
            result.delayedOrdersList.push({ ...row, delayDays: differenceInDays(today, parsedDate) });
        }
        
        const hourKey = format(parsedDate, 'HH');
        if(result.hourlyStatusSnapshots[hourKey]){
             result.hourlyStatusSnapshots[hourKey][status] = (result.hourlyStatusSnapshots[hourKey][status] || 0) + 1;
        }
    });

    result.dailySummaries = Array.from(dailySummariesMap.values()).sort((a, b) => new Date(a.date) - new Date(b.date));
    result.delayedOrdersList.sort((a, b) => b.delayDays - a.delayDays);

    return result;
};