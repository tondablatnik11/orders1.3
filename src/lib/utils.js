import { getHours, parseISO } from 'date-fns';

export const CHART_COLORS = [
  '#FFFFFF', '#EF4444', '#3B82F6', '#F59E0B', '#10B981',
  '#3498DB', '#9B59B6', '#28A745', '#218838', '#FFC107',
  '#FF9800', '#FF5722',
];

export const DATE_CATEGORY_COLORS = {
  'Today': '#3498DB',
  'Yesterday': '#9B59B6',
  'Older': '#E74C3C',
  'Future': '#2ECC71',
};

export const STATUS_TRANSITIONS = {
  '10_to_31': 'transferCreated',
  '31_to_35': 'readyForPicking',
  '35_to_40': 'picked',
  '40_to_50': 'packed',
  '50_to_60': 'readyForCarrier',
  '60_to_70': 'onTheWay',
};

export const parseExcelDate = (dateInput) => {
    if (typeof dateInput === "number" && typeof window.XLSX !== 'undefined' && typeof window.XLSX.SSF !== 'undefined') {
        try {
            const parsed = window.XLSX.SSF.parse_date_code(dateInput);
            const date = new Date(parsed.y, parsed.m - 1, parsed.d);
            if (!isNaN(date.getTime())) return date;
        } catch (e) {
            console.warn("Failed to parse Excel date number:", dateInput, e);
        }
    } else if (typeof dateInput === "string") {
        try {
            const isoParsed = parseISO(dateInput);
            if (!isNaN(isoParsed.getTime())) return isoParsed;
        } catch (e) { /* ignore */ }
        const parts = dateInput.match(/(\d{1,2})[./-](\d{1,2})[./-](\d{4})/);
        if (parts) {
            const date = new Date(parseInt(parts[3]), parseInt(parts[2]) - 1, parseInt(parts[1]));
            if (!isNaN(date.getTime())) return date;
        }
        const directParsed = new Date(dateInput);
        if (!isNaN(directParsed.getTime())) return directParsed;
    }
    return null;
};

export const getCurrentShift = (date) => {
  const hours = date.getHours();
  const minutes = date.getMinutes();
  const shift1Start = 5 * 60 + 45;
  const shift1End = 13 * 60 + 45;
  const shift2Start = 13 * 60 + 45;
  const shift2End = 21 * 60 + 45;
  const currentTimeInMinutes = hours * 60 + minutes;

  if (currentTimeInMinutes >= shift1Start && currentTimeInMinutes < shift1End) {
    return 1;
  } else if (currentTimeInMinutes >= shift2Start && currentTimeInMinutes < shift2End) {
    return 2;
  }
  return null;
};

export const getDelayColorClass = (delayDays) => {
    if (delayDays <= 1) return "text-green-400";
    if (delayDays <= 2) return "text-orange-400";
    return "text-red-400";
};