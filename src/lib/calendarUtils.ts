/**
 * Calendar Utilities
 * Generate URLs/files for adding reservations to calendars
 * Supports Thai and English languages with 2-hour reminder
 */

interface CalendarEvent {
    title: string;
    description: string;
    location: string;
    startDate: Date;
    endDate: Date;
    locale?: 'th' | 'en';
}

/**
 * Generate Google Calendar URL with reminder
 */
export function generateGoogleCalendarUrl(event: CalendarEvent): string {
    const formatDate = (date: Date): string => {
        return date.toISOString().replace(/-|:|\.\d{3}/g, '');
    };

    const params = new URLSearchParams({
        action: 'TEMPLATE',
        text: event.title,
        details: event.description,
        location: event.location,
        dates: `${formatDate(event.startDate)}/${formatDate(event.endDate)}`,
    });

    return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

/**
 * Generate ICS file content for Apple Calendar / Outlook
 * Includes 2-hour reminder
 */
export function generateICSContent(event: CalendarEvent): string {
    const formatICSDate = (date: Date): string => {
        return date.toISOString().replace(/-|:|\.\d{3}/g, '').slice(0, -1) + 'Z';
    };

    const escapeICS = (text: string): string => {
        return text.replace(/[,;\\]/g, (match) => `\\${match}`).replace(/\n/g, '\\n');
    };

    const uid = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}@savorybistro`;

    return [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        'PRODID:-//Savory Bistro//Reservation//EN',
        'CALSCALE:GREGORIAN',
        'METHOD:PUBLISH',
        'BEGIN:VEVENT',
        `UID:${uid}`,
        `DTSTAMP:${formatICSDate(new Date())}`,
        `DTSTART:${formatICSDate(event.startDate)}`,
        `DTEND:${formatICSDate(event.endDate)}`,
        `SUMMARY:${escapeICS(event.title)}`,
        `DESCRIPTION:${escapeICS(event.description)}`,
        `LOCATION:${escapeICS(event.location)}`,
        'STATUS:CONFIRMED',
        // 2-hour reminder (120 minutes before)
        'BEGIN:VALARM',
        'TRIGGER:-PT2H',
        'ACTION:DISPLAY',
        event.locale === 'th'
            ? 'DESCRIPTION:การจองโต๊ะของคุณจะเริ่มในอีก 2 ชั่วโมง!'
            : 'DESCRIPTION:Your table reservation starts in 2 hours!',
        'END:VALARM',
        'END:VEVENT',
        'END:VCALENDAR',
    ].join('\r\n');
}

/**
 * Download ICS file
 */
export function downloadICSFile(event: CalendarEvent, filename: string = 'reservation.ics'): void {
    const icsContent = generateICSContent(event);
    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

/**
 * Create calendar event from reservation data
 * Supports Thai and English locales
 */
export function createReservationEvent(
    bookingCode: string,
    guestName: string,
    date: string,
    time: string,
    guests: number,
    tableName?: string,
    restaurantName: string = 'Savory Bistro',
    restaurantAddress: string = '',
    locale: 'th' | 'en' = 'th'
): CalendarEvent {
    // Parse date and time (assuming Thailand timezone)
    const [year, month, day] = date.split('-').map(Number);
    const [hours, minutes] = time.split(':').map(Number);

    // Create start date (in local time, will be converted to UTC in ICS)
    const startDate = new Date(year, month - 1, day, hours, minutes);

    // End date is 2 hours after start (typical reservation duration)
    const endDate = new Date(startDate.getTime() + 2 * 60 * 60 * 1000);

    // Locale-based content
    const isThai = locale === 'th';

    const title = isThai
        ? `🍽️ จองโต๊ะ - ${restaurantName}`
        : `🍽️ Table Reservation - ${restaurantName}`;

    const description = isThai
        ? [
            `รหัสการจอง: ${bookingCode}`,
            `ชื่อลูกค้า: ${guestName}`,
            `จำนวน: ${guests} ท่าน`,
            tableName ? `โต๊ะ: ${tableName}` : '',
            '',
            'Alarm: 2 Hours before event',
            '⏰ กรุณามาถึงก่อนเวลานัด 10 นาที',
            '📞 ติดต่อร้านหากต้องการเปลี่ยนแปลง',
        ].filter(Boolean).join('\n')
        : [
            `Booking Code: ${bookingCode}`,
            `Guest: ${guestName}`,
            `Party Size: ${guests} guests`,
            tableName ? `Table: ${tableName}` : '',
            '',
            'Alarm: 2 Hours before event',
            '⏰ Please arrive 10 minutes early.',
            '📞 Contact the restaurant for any changes.',
        ].filter(Boolean).join('\n');

    return {
        title,
        description,
        location: restaurantAddress || restaurantName,
        startDate,
        endDate,
        locale,
    };
}
