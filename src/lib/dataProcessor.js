import { startOfDay, format, isBefore, parseISO, differenceInDays } from 'date-fns';

// Funkce pro parsování různých formátů data
const parseDataDate = (dateInput) => {
    if (!dateInput) return null;
    // Nejprve zkusíme parsovat jako ISO string, což je formát z databáze
    let date = parseISO(dateInput);
    if (!isNaN(date.getTime())) return date;
    
    // Pokud selže, zkusíme parsovat jako Excel číslo
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
    };

    const doneStatuses = [50, 60, 70];
    const delayedStatuses = [10, 31, 35, 40];
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
        
        const loadingDate = parseDataDate(row["Loading Date"]);
        
        // Klíčová podmínka pro zpožděné zakázky
        if (loadingDate && isBefore(loadingDate, today) && delayedStatuses.includes(status)) {
            summary.delayed++;
            summary.delayedOrdersList.push({ 
                ...row, 
                "Loading Date": loadingDate.toISOString(), // Uložíme jako ISO pro konzistenci
                delayDays: differenceInDays(today, loadingDate) 
            });
        }
    });
    
    summary.remainingTotal = summary.total - summary.doneTotal;
    summary.delayedOrdersList.sort((a, b) => b.delayDays - a.delayDays); // Seřadíme od největšího zpoždění

    return summary;
};