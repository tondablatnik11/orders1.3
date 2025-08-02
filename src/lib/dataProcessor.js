// src/lib/dataProcessor.js
import { startOfDay, format, isBefore, parseISO, differenceInDays } from 'date-fns';

export const countryCodeMap = { 'AF': 'AFG', 'AX': 'ALA', 'AL': 'ALB', 'DZ': 'DZA', 'AS': 'ASM', 'AD': 'AND', 'AO': 'AGO', 'AI': 'AIA', 'AQ': 'ATA', 'AG': 'ATG', 'AR': 'ARG', 'AM': 'ARM', 'AW': 'ABW', 'AU': 'AUS', 'AT': 'AUT', 'AZ': 'AZE', 'BS': 'BHS', 'BH': 'BHR', 'BD': 'BGD', 'BB': 'BRB', 'BY': 'BLR', 'BE': 'BEL', 'BZ': 'BLZ', 'BJ': 'BEN', 'BM': 'BMU', 'BT': 'BTN', 'BO': 'BOL', 'BQ': 'BES', 'BA': 'BIH', 'BW': 'BWA', 'BV': 'BVT', 'BR': 'BRA', 'IO': 'IOT', 'BN': 'BRN', 'BG': 'BGR', 'BF': 'BFA', 'BI': 'BDI', 'CV': 'CPV', 'KH': 'KHM', 'CM': 'CMR', 'CA': 'CAN', 'KY': 'CYM', 'CF': 'CAF', 'TD': 'TCD', 'CL': 'CHL', 'CN': 'CHN', 'CX': 'CXR', 'CC': 'CCK', 'CO': 'COL', 'KM': 'COM', 'CG': 'COG', 'CD': 'COD', 'CK': 'COK', 'CR': 'CRI', 'CI': 'CIV', 'HR': 'HRV', 'CU': 'CUB', 'CW': 'CUW', 'CY': 'CYP', 'CZ': 'CZE', 'DK': 'DNK', 'DJ': 'DJI', 'DM': 'DMA', 'DO': 'DOM', 'EC': 'ECU', 'EG': 'EGY', 'SV': 'SLV', 'GQ': 'GNQ', 'ER': 'ERI', 'EE': 'EST', 'SZ': 'SWZ', 'ET': 'ETH', 'FK': 'FLK', 'FO': 'FRO', 'FJ': 'FJI', 'FI': 'FIN', 'FR': 'FRA', 'GF': 'GUF', 'PF': 'PYF', 'TF': 'ATF', 'GA': 'GAB', 'GM': 'GMB', 'GE': 'GEO', 'DE': 'DEU', 'GH': 'GHA', 'GI': 'GIB', 'GR': 'GRC', 'GL': 'GRL', 'GD': 'GRD', 'GP': 'GLP', 'GU': 'GUM', 'GT': 'GTM', 'GG': 'GGY', 'GN': 'GIN', 'GW': 'GNB', 'GY': 'GUY', 'HT': 'HTI', 'HM': 'HMD', 'VA': 'VAT', 'HN': 'HND', 'HK': 'HKG', 'HU': 'HUN', 'IS': 'ISL', 'IN': 'IND', 'ID': 'IDN', 'IR': 'IRN', 'IQ': 'IRQ', 'IE': 'IRL', 'IM': 'IMN', 'IL': 'ISR', 'IT': 'ITA', 'JM': 'JAM', 'JP': 'JPN', 'JE': 'JEY', 'JO': 'JOR', 'KZ': 'KAZ', 'KE': 'KEN', 'KI': 'KIR', 'KP': 'PRK', 'KR': 'KOR', 'KW': 'KWT', 'KG': 'KGZ', 'LA': 'LAO', 'LV': 'LVA', 'LB': 'LBN', 'LS': 'LSO', 'LR': 'LBR', 'LY': 'LBY', 'LI': 'LIE', 'LT': 'LTU', 'LU': 'LUX', 'MO': 'MAC', 'MG': 'MDG', 'MW': 'MWI', 'MY': 'MYS', 'MV': 'MDV', 'ML': 'MLI', 'MT': 'MLT', 'MH': 'MHL', 'MQ': 'MTQ', 'MR': 'MRT', 'MU': 'MUS', 'YT': 'MYT', 'MX': 'MEX', 'FM': 'FSM', 'MD': 'MDA', 'MC': 'MCO', 'MN': 'MNG', 'ME': 'MNE', 'MS': 'MSR', 'MA': 'MAR', 'MZ': 'MOZ', 'MM': 'MMR', 'NA': 'NAM', 'NR': 'NRU', 'NP': 'NPL', 'NL': 'NLD', 'NC': 'NCL', 'NZ': 'NZL', 'NI': 'NIC', 'NE': 'NER', 'NG': 'NGA', 'NU': 'NIU', 'NF': 'NFK', 'MK': 'MKD', 'MP': 'MNP', 'NO': 'NOR', 'OM': 'OMN', 'PK': 'PAK', 'PW': 'PLW', 'PS': 'PSE', 'PA': 'PAN', 'PG': 'PNG', 'PY': 'PRY', 'PE': 'PER', 'PH': 'PHL', 'PN': 'PCN', 'PL': 'POL', 'PT': 'PRT', 'PR': 'PRI', 'QA': 'QAT', 'RE': 'REU', 'RO': 'ROU', 'RU': 'RUS', 'RW': 'RWA', 'BL': 'BLM', 'SH': 'SHN', 'KN': 'KNA', 'LC': 'LCA', 'MF': 'MAF', 'PM': 'SPM', 'VC': 'VCT', 'WS': 'WSM', 'SM': 'SMR', 'ST': 'STP', 'SA': 'SAU', 'SN': 'SEN', 'RS': 'SRB', 'SC': 'SYC', 'SL': 'SLE', 'SG': 'SGP', 'SX': 'SXM', 'SK': 'SVK', 'SI': 'SVN', 'SB': 'SLB', 'SO': 'SOM', 'ZA': 'ZAF', 'GS': 'SGS', 'SS': 'SSD', 'ES': 'ESP', 'LK': 'LKA', 'SD': 'SDN', 'SR': 'SUR', 'SJ': 'SJM', 'SE': 'SWE', 'CH': 'CHE', 'SY': 'SYR', 'TW': 'TWN', 'TJ': 'TJK', 'TZ': 'TZA', 'TH': 'THA', 'TL': 'TLS', 'TG': 'TGO', 'TK': 'TKL', 'TO': 'TON', 'TT': 'TTO', 'TN': 'TUN', 'TR': 'TUR', 'TM': 'TKM', 'TC': 'TCA', 'TV': 'TUV', 'UG': 'UGA', 'UA': 'UKR', 'AE': 'ARE', 'GB': 'GBR', 'US': 'USA', 'UM': 'UMI', 'UY': 'URY', 'UZ': 'UZB', 'VU': 'VUT', 'VE': 'VEN', 'VN': 'VNM', 'VG': 'VGB', 'VI': 'VIR', 'WF': 'WLF', 'EH': 'ESH', 'YE': 'YEM', 'ZM': 'ZMB', 'ZW': 'ZWE' };

const agentNameMap = {
    "United Parcel Service CZ s.r.o.": "UPS",
    "Dachser SE": "Dachser",
    "Selbstabholer": "Selbstabholer",
    "FedEx Express Czech Republic s.r.o.": "FedEx",
    "Duvenbeck Logistik s.r.o.": "Duvenbeck",
    "Raben Transport s.r.o": "Raben",
    "DSV Road GmbH": "DSV",
    "Maintaler Express Logistik": "Maintaler",
    "YUSEN LOGISTICS CZECH S.R.O": "YUSEN",
    "DHL Express (Czech Republic) s.r.o.": "DHL"
};

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
        // Nové: Přidány objekty pro rozpad stavů
        doneBreakdown: {},
        inProgressBreakdown: {},
        remainingBreakdown: {},
        delayedBreakdown: {},
        // Nové: Přidány statistiky z pickování
        totalPicksToday: 0
    };

    const doneStatuses = [50, 60, 70, 80, 90];
    const inProgressStatuses = [35, 40];
    const remainingStatuses = [10, 31, 35, 40];
    const today = startOfDay(new Date());
    const todayFormatted = format(today, 'yyyy-MM-dd');
    
    // Nové: Výpočet picků pro dnešní den
    summary.totalPicksToday = pickingData.filter(p => p.confirmation_date === todayFormatted).length;

    rawData.forEach(row => {
        const status = Number(row.Status);
        if (isNaN(status)) return;
        
        const loadingDate = parseDataDate(row["Loading Date"]);

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
                    date: dateKey, total: 0, status10: 0, status31: 0,
                    status35: 0, status40: 0, status50_60: 0, status_done_all: 0, statusCounts: {}
                });
            }
            const day = summary.dailySummaries.get(dateKey);
            day.total++;
            day.statusCounts[status] = (day.statusCounts[status] || 0) + 1;

            if (status === 10) day.status10++;
            if (status === 31) day.status31++;
            if (status === 35) day.status35++;
            if (status === 40) day.status40++;
            if (status === 50 || status === 60) day.status50_60++;
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

    return summary;
};