import { startOfDay, format, isBefore, isAfter, getHours, differenceInDays, subDays } from 'date-fns';
import { parseExcelDate, getCurrentShift } from './utils';

export const processData = (rawData) => {
    const now = new Date();
    const today = startOfDay(now);

    const result = {
        total: 0,
        doneTotal: 0,
        remainingTotal: 0,
        inProgressTotal: 0,
        newOrdersTotal: 0,
        palletsTotal: 0,
        cartonsTotal: 0,
        delayed: 0,
        sentPallets: 0,
        sentCartons: 0,
        statusCounts: {},
        deliveryTypes: {},
        delayedOrdersList: [],
        dailySummaries: [],
        allAvailableDates: new Set(),
        currentShift: getCurrentShift(now),
        hourlyStatusSnapshots: {},
        shiftDoneCounts: { '1': 0, '2': 0 },
        statusByDateCategory: {},
        deliveryTypeByDateCategory: {},
        statusByLoadingDate: {},
    };

    for (let h = 0; h <= 23; h++) {
        const hourKey = format(new Date(today.getFullYear(), today.getMonth(), today.getDate(), h), 'HH');
        result.hourlyStatusSnapshots[hourKey] = {
            '10': 0, '31': 0, '35': 0, '40': 0, '50': 0, '60': 0, '70': 0,
        };
    }

    const dailySummariesMap = new Map();
    const doneStatuses = [50, 60, 70];
    const remainingStatuses = [10, 31, 35, 40];
    const inProgressStatuses = [31, 35, 40];
    const newOrderStatuses = [10];
    const sentStatuses = [60, 70];

    rawData.forEach((row) => {
        const loadingDate = row["Loading Date"];
        const status = Number(row["Status"]);
        const delType = row["del.type"];
        const deliveryIdentifier = (row["Delivery"] || row["Delivery No"])?.trim();

        if (!loadingDate || isNaN(status) || !deliveryIdentifier) return;

        const parsedDate = parseExcelDate(loadingDate);

        if (parsedDate === null || isNaN(parsedDate.getTime())) {
            console.warn(`Invalid Loading Date for row (skipping): ${JSON.stringify(row)}`);
            return;
        }

        const formattedDate_YYYYMMDD = format(parsedDate, "yyyy-MM-dd");
        const formattedDate_DDMMYYYY = format(parsedDate, "dd/MM/yyyy");

        result.allAvailableDates.add(formattedDate_YYYYMMDD);

        result.total += 1;
        if (doneStatuses.includes(status)) result.doneTotal += 1;
        if (remainingStatuses.includes(status)) result.remainingTotal += 1;
        if (inProgressStatuses.includes(status)) result.inProgressTotal += 1;
        if (newOrderStatuses.includes(status)) result.newOrdersTotal += 1;
        if (delType === "P") result.palletsTotal += 1;
        if (delType === "K") result.cartonsTotal += 1;

        if (!dailySummariesMap.has(formattedDate_YYYYMMDD)) {
            dailySummariesMap.set(formattedDate_YYYYMMDD, {
                date: formattedDate_YYYYMMDD,
                total: 0, done: 0, remaining: 0, inProgress: 0, newOrders: 0, pallets: 0, cartons: 0,
                statusCounts: {}
            });
        }
        const currentDayStats = dailySummariesMap.get(formattedDate_YYYYMMDD);
        currentDayStats.total += 1;
        if (doneStatuses.includes(status)) currentDayStats.done += 1;
        if (remainingStatuses.includes(status)) currentDayStats.remaining += 1;
        if (inProgressStatuses.includes(status)) currentDayStats.inProgress += 1;
        if (newOrderStatuses.includes(status)) currentDayStats.newOrders += 1;
        if (delType === "P") currentDayStats.pallets += 1;
        if (delType === "K") currentDayStats.cartons += 1;
        currentDayStats.statusCounts[status] = (currentDayStats.statusCounts[status] || 0) + 1;

        let dateCategoryName;
        if (formattedDate_YYYYMMDD === format(today, 'yyyy-MM-dd')) {
            dateCategoryName = 'Today';
        } else if (formattedDate_YYYYMMDD === format(subDays(today, 1), 'yyyy-MM-dd')) {
            dateCategoryName = 'Yesterday';
        } else if (isBefore(parsedDate, today)) {
            dateCategoryName = 'Older';
        } else if (isAfter(parsedDate, today)) {
            dateCategoryName = 'Future';
        } else {
            dateCategoryName = 'Other';
        }

        if (!result.statusByDateCategory[status]) {
            result.statusByDateCategory[status] = { 'Today': 0, 'Yesterday': 0, 'Older': 0, 'Future': 0 };
        }
        if (result.statusByDateCategory[status][dateCategoryName] !== undefined) {
            result.statusByDateCategory[status][dateCategoryName]++;
        }

        if (!result.deliveryTypeByDateCategory[delType]) {
            result.deliveryTypeByDateCategory[delType] = { 'Today': 0, 'Yesterday': 0, 'Older': 0, 'Future': 0 };
        }
        if (result.deliveryTypeByDateCategory[delType][dateCategoryName] !== undefined) {
            result.deliveryTypeByDateCategory[delType][dateCategoryName]++;
        }

        if (!result.statusByLoadingDate[formattedDate_YYYYMMDD]) {
            result.statusByLoadingDate[formattedDate_YYYYMMDD] = { date: formattedDate_DDMMYYYY };
        }
        result.statusByLoadingDate[formattedDate_YYYYMMDD][`status${status}`] =
            (result.statusByLoadingDate[formattedDate_YYYYMMDD][`status${status}`] || 0) + 1;

        if (doneStatuses.includes(status)) {
            const orderHour = getHours(parsedDate);
            const orderMinutes = parsedDate.getMinutes();
            const orderTimeInMinutes = orderHour * 60 + orderMinutes;

            const shift1Start = 5 * 60 + 45;
            const shift1End = 13 * 60 + 45;
            const shift2Start = 13 * 60 + 45;
            const shift2End = 21 * 60 + 45;

            if (orderTimeInMinutes >= shift1Start && orderTimeInMinutes < shift1End) {
                result.shiftDoneCounts['1'] += 1;
            } else if (orderTimeInMinutes >= shift2Start && orderTimeInMinutes < shift2End) {
                result.shiftDoneCounts['2'] += 1;
            }
        }

        if (sentStatuses.includes(status)) {
            if (delType === "P") result.sentPallets += 1;
            if (delType === "K") result.sentCartons += 1;
        }

        if (isBefore(parsedDate, today) && !doneStatuses.includes(status)) {
            result.delayed += 1;
            const delayDays = differenceInDays(today, parsedDate);
            result.delayedOrdersList.push({
                delivery: deliveryIdentifier, status: status, delType: delType,
                loadingDate: parsedDate.toISOString(),
                delayDays: delayDays,
                note: row["Note"] || "",
                "Forwarding agent name": row["Forwarding agent name"],
                "Name of ship-to party": row["Name of ship-to party"],
                "Total Weight": row["Total Weight"],
                "Bill of lading": row["Bill of lading"] || "",
            });
        }

        if (!isNaN(status)) {
            result.statusCounts[status] = (result.statusCounts[status] || 0) + 1;
        }
        if (delType) {
            result.deliveryTypes[delType] = (result.deliveryTypes[delType] || 0) + 1;
        }

        if (format(parsedDate, 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd')) {
            const hourKey = format(parsedDate, 'HH');
            if (result.hourlyStatusSnapshots[hourKey]) {
                if (result.hourlyStatusSnapshots[hourKey][status]) {
                    result.hourlyStatusSnapshots[hourKey][status] += 1;
                } else {
                    result.hourlyStatusSnapshots[hourKey][status] = 1;
                }
            }
        }
    });

    result.dailySummaries = Array.from(dailySummariesMap.values()).sort((a, b) => new Date(a.date) - new Date(b.date));
    
    result.delayedOrdersList.sort((a, b) => b.delayDays - a.delayDays);

    return result;
};