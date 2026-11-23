const countryCodeToTimezone = {
    '1809': 'America/Santo_Domingo',
    '1829': 'America/Santo_Domingo',
    '1849': 'America/Santo_Domingo',
    '1': 'America/New_York',
    '91': 'Asia/Kolkata',
    '44': 'Europe/London',
    '81': 'Asia/Tokyo',
    '86': 'Asia/Shanghai',
    '33': 'Europe/Paris',
    '49': 'Europe/Berlin',
    '7': 'Europe/Moscow',
    '61': 'Australia/Sydney',
    '55': 'America/Sao_Paulo',
    '92': 'Asia/Karachi',
    '20': 'Africa/Cairo',
    '90': 'Europe/Istanbul',
    '39': 'Europe/Rome',
    '34': 'Europe/Madrid',
    '82': 'Asia/Seoul',
    '65': 'Asia/Singapore',
    '60': 'Asia/Kuala_Lumpur',
    '63': 'Asia/Manila',
    '66': 'Asia/Bangkok',
    '84': 'Asia/Ho_Chi_Minh',
    '62': 'Asia/Jakarta',
    '971': 'Asia/Dubai',
    '966': 'Asia/Riyadh',
    '973': 'Asia/Bahrain',
    '968': 'Asia/Muscat',
    '974': 'Asia/Qatar',
    '965': 'Asia/Kuwait',
    '98': 'Asia/Tehran',
    '93': 'Asia/Kabul',
    '880': 'Asia/Dhaka',
    '94': 'Asia/Colombo',
    '977': 'Asia/Kathmandu',
    '975': 'Asia/Thimphu',
    '95': 'Asia/Yangon',
    '856': 'Asia/Vientiane',
    '853': 'Asia/Macau',
    '852': 'Asia/Hong_Kong',
    '886': 'Asia/Taipei',
    '850': 'Asia/Pyongyang',
    '672': 'Australia/Christmas',
    '358': 'Europe/Helsinki',
    '46': 'Europe/Stockholm',
    '47': 'Europe/Oslo',
    '45': 'Europe/Copenhagen',
    '31': 'Europe/Amsterdam',
    '32': 'Europe/Brussels',
    '41': 'Europe/Zurich',
    '43': 'Europe/Vienna',
    '36': 'Europe/Budapest',
    '48': 'Europe/Warsaw',
    '420': 'Europe/Prague',
    '381': 'Europe/Belgrade',
    '385': 'Europe/Zagreb',
    '351': 'Europe/Lisbon',
    '353': 'Europe/Dublin',
    '30': 'Europe/Athens',
    '40': 'Europe/Bucharest',
    '370': 'Europe/Vilnius',
    '371': 'Europe/Riga',
    '372': 'Europe/Tallinn',
    '52': 'America/Mexico_City',
    '54': 'America/Argentina/Buenos_Aires',
    '56': 'America/Santiago',
    '57': 'America/Bogota',
    '58': 'America/Caracas',
    '51': 'America/Lima',
    '593': 'America/Guayaquil',
    '507': 'America/Panama',
    '506': 'America/Costa_Rica',
    '502': 'America/Guatemala',
    '504': 'America/Tegucigalpa',
    '503': 'America/El_Salvador',
    '505': 'America/Managua',
    '27': 'Africa/Johannesburg',
    '234': 'Africa/Lagos',
    '225': 'Africa/Abidjan',
    '254': 'Africa/Nairobi',
    '212': 'Africa/Casablanca',
    '216': 'Africa/Tunis',
    '213': 'Africa/Algiers',
    '218': 'Africa/Tripoli',
    '220': 'Africa/Banjul',
    '221': 'Africa/Dakar',
    '233': 'Africa/Accra',
    '241': 'Africa/Libreville',
    '237': 'Africa/Douala',
    '257': 'Africa/Bujumbura',
    '250': 'Africa/Kigali',
    '263': 'Africa/Harare',
    '264': 'Africa/Windhoek',
    '267': 'Africa/Gaborone',
    '268': 'Africa/Mbabane',
    '354': 'Atlantic/Reykjavik',
    '64': 'Pacific/Auckland',
    '689': 'Pacific/Tahiti',
    '687': 'Pacific/Noumea',
    '682': 'Pacific/Rarotonga',
    '679': 'Pacific/Fiji',
    '685': 'Pacific/Apia',
    '686': 'Pacific/Tarawa',
    '691': 'Pacific/Pohnpei',
    '692': 'Pacific/Majuro',
};

const regionNames = new Intl.DisplayNames(["es"], { type: "region" });

const timezoneToISO = {
    'America/Santo_Domingo': 'DO',
    'America/Mexico_City': 'MX',
    'America/Argentina/Buenos_Aires': 'AR',
    'America/Bogota': 'CO',
    'America/Santiago': 'CL',
    'America/Lima': 'PE',
    'America/Caracas': 'VE',
    'America/Sao_Paulo': 'BR',
    'Europe/Madrid': 'ES',
    'America/New_York': 'US',
    'Europe/London': 'GB',
    'Europe/Paris': 'FR',
    'Europe/Berlin': 'DE',
    'Europe/Rome': 'IT',
    'Europe/Lisbon': 'PT',
    'Asia/Tokyo': 'JP',
    'Asia/Shanghai': 'CN',
    'Asia/Seoul': 'KR',
    'Asia/Kolkata': 'IN',
    'Asia/Dubai': 'AE',
    'America/Guayaquil': 'EC',
    'America/Panama': 'PA',
    'America/Costa_Rica': 'CR',
    'America/Guatemala': 'GT',
    'America/Tegucigalpa': 'HN',
    'America/El_Salvador': 'SV',
    'America/Managua': 'NI',
    'America/Puerto_Rico': 'PR',
    'America/Montevideo': 'UY'
};

function getCountryInfo(identifier = "") {
    const raw = String(identifier ?? "");
    const user = raw.split("@")[0].split(":")[0];
    const digits = user.replace(/\D/g, "");

    const fallback = { name: "No disponible", emoji: "", number: digits || "-" };

    
    if (raw.endsWith("@lid")) return fallback;

    if (!digits || digits.length < 8) return fallback;

    
    const sortedCodes = Object.keys(countryCodeToTimezone).sort((a, b) => b.length - a.length);
    let timezone = null;

    for (const code of sortedCodes) {
        if (digits.startsWith(code)) {
            timezone = countryCodeToTimezone[code];
            break;
        }
    }

    if (!timezone) return fallback;

    const isoCode = timezoneToISO[timezone] || "UN";
    let emoji = "";

    if (isoCode && isoCode !== "UN") {
        emoji = String.fromCodePoint(
            ...isoCode.toUpperCase().split("").map((c) => 127397 + c.charCodeAt(0))
        );
    }

    return {
        name: regionNames.of(isoCode) || "Desconocido",
        emoji,
        number: digits
    };
}

function getTimeByJid(jid) {
    try {
        const raw = String(jid ?? "");
        const phoneNumber = raw.split('@')[0].replace(/[^0-9]/g, '');
        if (!phoneNumber) throw new Error('Invalid JID');

        const sortedCodes = Object.keys(countryCodeToTimezone).sort((a, b) => b.length - a.length);
        let timezone = 'America/Mexico_City';
        const isLid = raw.endsWith('@lid');

        if (!isLid) {
            for (const code of sortedCodes) {
                if (phoneNumber.startsWith(code)) {
                    timezone = countryCodeToTimezone[code];
                    break;
                }
            }
        }

        const now = new Date();

        const hora24String = now.toLocaleString("en-US", {
            timeZone: timezone,
            hour: "numeric",
            hourCycle: "h23"
        });
        const hora24 = parseInt(hora24String, 10);

        const dateOptions = {
            timeZone: timezone,
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        };
        const timeOptions = {
            timeZone: timezone,
            hour12: true,
            hour: '2-digit',
            minute: '2-digit',
            timeZoneName: 'short'
        };

        return {
            date: now.toLocaleDateString('es-ES', dateOptions).replace(/\//g, '-'),
            time: now.toLocaleTimeString('es-ES', timeOptions),
            timezone,
            hora24
        };
    } catch (error) {
        return {
            date: '',
            time: '',
            timezone: 'America/Mexico_City',
            error: error.message,
            hora24: 12
        };
    }
}

module.exports = {
    getCountryInfo,
    getTimeByJid
};