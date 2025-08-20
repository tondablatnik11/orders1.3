import { startOfDay, format, isBefore, parseISO, differenceInDays, subDays, getWeek } from 'date-fns';
// PŘIDÁNO: Chybějící import pro statusConfig
import { statusConfig } from '@/config/statusConfig';

export const countryCodeMap = { /* ... kód beze změny ... */ };
const agentNameMap = { /* ... kód beze změny ... */ };
const parseDataDate = (dateInput) => { /* ... kód beze změny ... */ };

export const processData = (allData, pickingData = []) => {
    if (!allData || allData.length === 0) {
        return null;
    }

    const rawData = allData.filter(order => order.Status !== 'Smazané');

    const summary = {
        total: rawData.length,
        doneTotal: 0,
        inProgressTotal: 0,
        remainingTotal: 0,
        delayed: 0,
        statusCounts: {},
        deliveryTypes: {},
        ordersByCountry: {},
        recentUpdates: [],
        allOrdersData: allData,
        dailySummaries: new Map(),
        statusByLoadingDate: {},
        delayedOrdersList: [],
        orderTypesOEM: {},
        ordersByForwardingAgent: {},
        doneBreakdown: {},
        inProgressBreakdown: {},
        remainingBreakdown: {},
        delayedBreakdown: {},
        yesterdayPicksByShift: { shiftA: 0, shiftB: 0 },
        totalPicksToday: 0,
    };

    const doneStatuses = [50, 60, 70, 80, 90];
    const inProgressStatuses = [35, 40];
    const remainingStatuses = [10, 31, 35, 40];
    const today = startOfDay(new Date());
    const todayFormatted = format(today, 'yyyy-MM-dd');
    const yesterdayFormatted = format(subDays(today, 1), 'yyyy-MM-dd');
    
    summary.totalPicksToday = pickingData.filter(p => p.confirmation_date === todayFormatted).length;
    const yesterdayPicks = pickingData.filter(p => p.confirmation_date === yesterdayFormatted);
    yesterdayPicks.forEach(pick => {
        if (pick.confirmation_time && pick.confirmation_date) {
            const hour = parseInt(pick.confirmation_time.split(':')[0], 10);
            const weekNumber = getWeek(parseISO(pick.confirmation_date), { weekStartsOn: 1 });
            const isEvenWeek = weekNumber % 2 === 0;
            if (hour >= 6 && hour < 14) {
                if (isEvenWeek) summary.yesterdayPicksByShift.shiftA++; else summary.yesterdayPicksByShift.shiftB++;
            } else if (hour >= 14 && hour < 22) {
                if (isEvenWeek) summary.yesterdayPicksByShift.shiftB++; else summary.yesterdayPicksByShift.shiftA++;
            }
        }
    });

    rawData.forEach(row => {
        const status = Number(row.Status);
        if (isNaN(status)) return;
        
        const loadingDate = parseDataDate(row["Loading Date"]);
        const isOEM = row.order_type === 'O';
        
        if (loadingDate) {
            const delayDays = differenceInDays(today, startOfDay(loadingDate));
            if (delayDays > 0 && remainingStatuses.includes(status)) {
                summary.delayed++;
                summary.delayedBreakdown[status] = (summary.delayedBreakdown[status] || 0) + 1;
                summary.delayedOrdersList.push({
                    ...row,
                    delivery: String(row["Delivery No"] || '').trim(),
                    status: status,
                    delType: row["del.type"],
                    loadingDate: loadingDate.toISOString(),
                    delayDays: delayDays,
                });
            }
        }
        
        const countryCode2 = row["Country ship-to prty"];
        const countryCode3 = countryCodeMap[countryCode2];
        if (countryCode3) {
            summary.ordersByCountry[countryCode3] = (summary.ordersByCountry[countryCode3] || 0) + 1;
        }

        const originalAgentName = row["Forwarding agent name"] || "Neznámý";
        const shortAgentName = agentNameMap[originalAgentName] || originalAgentName;
        summary.ordersByForwardingAgent[shortAgentName] = (summary.ordersByForwardingAgent[shortAgentName] || 0) + 1;

        summary.statusCounts[status] = (summary.statusCounts[status] || 0) + 1;
        
        if (doneStatuses.includes(status)) {
            summary.doneTotal++;
            summary.doneBreakdown[status] = (summary.doneBreakdown[status] || 0) + 1;
        }
        if (inProgressStatuses.includes(status)) {
            summary.inProgressTotal++;
            summary.inProgressBreakdown[status] = (summary.inProgressBreakdown[status] || 0) + 1;
        }
        if (remainingStatuses.includes(status)) {
            summary.remainingTotal++;
            summary.remainingBreakdown[status] = (summary.remainingBreakdown[status] || 0) + 1;
        }
        
        const delType = row["del.type"] === 'P' ? 'Palety' : 'Kartony';
        summary.deliveryTypes[delType] = (summary.deliveryTypes[delType] || 0) + 1;

        const orderType = String(row.order_type || 'Jiné').trim();
        if (orderType) {
            let typeName;
            switch (orderType) {
                case 'O': typeName = 'OEM'; break;
                case 'N': typeName = 'Normal'; break;
                case 'E': typeName = 'Expres'; break;
                default: typeName = 'Jiné';
            }
            summary.orderTypesOEM[typeName] = (summary.orderTypesOEM[typeName] || 0) + 1;
        }

        if (loadingDate) {
            const dateKey = format(startOfDay(loadingDate), 'yyyy-MM-dd');

            if (!summary.dailySummaries.has(dateKey)) {
                summary.dailySummaries.set(dateKey, {
                    date: dateKey, total: 0, 
                    status10_oem: 0,
                    status31_oem: 0,
                    status35_oem: 0,
                    status40_oem: 0,
                    status50_60_oem: 0,
                    status_done_all_oem: 0,
                    status_done_all: 0, // Přidáno pro ukládání celkového počtu hotových
                    statusCounts: {}
                });
            }
            const day = summary.dailySummaries.get(dateKey);
            day.total++;
            day.statusCounts[status] = (day.statusCounts[status] || 0) + 1;

            if (isOEM) {
                if (status === 10) day.status10_oem++;
                if (status === 31) day.status31_oem++;
                if (status === 35) day.status35_oem++;
                if (status === 40) day.status40_oem++;
                if (status === 50 || status === 60) day.status50_60_oem++;
                if (doneStatuses.includes(status)) day.status_done_all_oem++;
            }
            if (doneStatuses.includes(status)) day.status_done_all++;

            if (!summary.statusByLoadingDate[dateKey]) {
                summary.statusByLoadingDate[dateKey] = { date: dateKey };
            }
            summary.statusByLoadingDate[dateKey][`status${status}`] = (summary.statusByLoadingDate[dateKey][`status${status}`] || 0) + 1;
        }
    });
    
    summary.dailySummaries = Array.from(summary.dailySummaries.values()).sort((a, b) => new Date(a.date) - new Date(b.date));
    summary.recentUpdates = allData.filter(o => o.updated_at).sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at)).slice(0, 5);
    
    summary.ordersByCountry = Object.entries(summary.ordersByCountry).map(([country, count]) => ({
        id: country,
        value: count,
    }));
    
    summary.ordersByForwardingAgent = Object.entries(summary.ordersByForwardingAgent)
        .map(([name, value]) => ({ name, 'Počet zakázek': value }))
        .sort((a, b) => b['Počet zakázek'] - a['Počet zakázek']);

    summary.dailyStatusPercentages = summary.dailySummaries.map(day => {
        const total = day.total;
        const dayData = {
            date: format(parseISO(day.date), 'dd/MM'),
            totalCount: total,
            doneCount: day.status_done_all || 0,
        };

        Object.keys(statusConfig).forEach(statusKey => {
            const count = day.statusCounts[statusKey] || 0;
            dayData[`status${statusKey}`] = (total > 0) ? (count / total) * 100 : 0;
            dayData[`status${statusKey}_count`] = count;
        });
        
        return dayData;
    });

    return summary;
};