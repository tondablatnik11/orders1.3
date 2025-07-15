import { startOfDay, parse } from 'date-fns';

export const processErrorLogData = (rawData) => {
    if (!rawData || rawData.length === 0) {
        return null;
    }

    const summary = {
        totalEvents: rawData.length,
        unresolvedEvents: 0,
        eventsToday: 0,
        mostCommonError: 'N/A',
        errorCountsBySource: {},
        resolvedStatusCounts: { 'Vyřešeno': 0, 'Nevyřešeno': 0 },
        eventsOverTime: new Map(),
        eventsByUser: {},
        errorLog: rawData,
    };

    const today = startOfDay(new Date());

    const errorTypeCounts = {};

    rawData.forEach(row => {
        // Zpracování data a času
        const createdDateStr = row["Created On"];
        const createdTimeStr = row["Time"];
        const dateTimeStr = `${createdDateStr} ${createdTimeStr}`;
        const eventDate = parse(dateTimeStr, 'yyyy-MM-dd HH:mm:ss', new Date());

        if (!isNaN(eventDate)) {
            if (startOfDay(eventDate).getTime() === today.getTime()) {
                summary.eventsToday++;
            }
            const dateKey = eventDate.toISOString().split('T')[0]; // YYYY-MM-DD
            summary.eventsOverTime.set(dateKey, (summary.eventsOverTime.get(dateKey) || 0) + 1);
        }
        
        // Zpracování stavu (vyřešeno/nevyřešeno)
        if (row.Done) {
            summary.resolvedStatusCounts['Vyřešeno']++;
        } else {
            summary.unresolvedEvents++;
            summary.resolvedStatusCounts['Nevyřešeno']++;
        }

        // Zpracování chybových textů a zdrojů
        const errorText = row.Text || 'Neznámý typ';
        errorTypeCounts[errorText] = (errorTypeCounts[errorText] || 0) + 1;

        const source = row['Activity 1 in RF- Transaction'] || 'Neznámý zdroj';
        summary.errorCountsBySource[source] = (summary.errorCountsBySource[source] || 0) + 1;
        
        const user = row['Created By'] || 'Neznámý uživatel';
        summary.eventsByUser[user] = (summary.eventsByUser[user] || 0) + 1;

    });
    
    // Zjištění nejčastější chyby
    if (Object.keys(errorTypeCounts).length > 0) {
        summary.mostCommonError = Object.entries(errorTypeCounts).reduce((a, b) => a[1] > b[1] ? a : b)[0];
    }
    
    // Převod mapy na pole pro grafy
    summary.eventsOverTime = Array.from(summary.eventsOverTime, ([name, value]) => ({ name, value }))
                                  .sort((a,b) => new Date(a.name) - new Date(b.name));
    summary.errorCountsBySource = Object.entries(summary.errorCountsBySource).map(([name, value]) => ({ name, value }));
    summary.resolvedStatusCounts = Object.entries(summary.resolvedStatusCounts).map(([name, value]) => ({ name, value }));
    summary.eventsByUser = Object.entries(summary.eventsByUser).map(([name, value]) => ({ name, value }));


    return summary;
};