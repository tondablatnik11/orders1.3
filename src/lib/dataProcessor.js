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

    // Inicializace hodinových přehledů
    for (let h = 0; h <= 23; h++) {
        const hourKey = format(new Date(today.getFullYear(), today.getMonth(), today.getDate(), h), 'HH');
        result.hourlyStatusSnapshots[hourKey] = { '10': 0, '31': 0, '35': 0, '40': 0, '50': 0, '60': 0, '70': 0 };
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
        result.allAvailableDates.add(formattedDate_YYYYMMDD);

        // Zde pokračuje zbytek vaší logiky z funkce `processData`...
        // ...
        // Je to přesně ta samá logika, kterou jste měli v `useCallback(processData, [])`
    });

    result.dailySummaries = Array.from(dailySummariesMap.values()).sort((a, b) => new Date(a.date) - new Date(b.date));
    return result;
};