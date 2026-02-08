/**
 * Calendar Utilities
 * Generate URLs/files for adding reservations to calendars
 */

interface CalendarEvent {
    title: string;
    description: string;
    location: string;
    startDate: Date;
    endDate: Date;
}

/**
 * Generate Google Calendar URL
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
 */
export function generateICSContent(event: CalendarEvent): string {
    const formatICSDate = (date: Date): string => {
        return date.toISOString().replace(/-|:|\.\d{3}/g, '').slice(0, -1) + 'Z';
    };

    const escapeICS = (text: string): string => {
        return text.replace(/[,;\\]/g, (match) => `\\${match}`).replace(/\n/g, '\\n');
    };

    const uid = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}@tablereserve`;

    return [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        'PRODID:-//TableReserve//Reservation//EN',
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
 */
export function createReservationEvent(
    bookingCode: string,
    guestName: string,
    date: string,
    time: string,
    guests: number,
    tableName?: string,
    restaurantName: string = 'TableReserve Restaurant',
    restaurantAddress: string = ''
): CalendarEvent {
    // Parse date and time (assuming Thailand timezone)
    const [year, month, day] = date.split('-').map(Number);
    const [hours, minutes] = time.split(':').map(Number);

    // Create start date (in local time, will be converted to UTC in ICS)
    const startDate = new Date(year, month - 1, day, hours, minutes);

    // End date is 2 hours after start (typical reservation duration)
    const endDate = new Date(startDate.getTime() + 2 * 60 * 60 * 1000);

    const title = `🍽️ Table Reservation - ${restaurantName}`;

    const description = [
        `Booking Code: ${bookingCode}`,
        `Guest: ${guestName}`,
        `Party Size: ${guests} guests`,
        tableName ? `Table: ${tableName}` : '',
        '',
        'Please arrive 10 minutes early.',
        'Contact the restaurant for any changes.',
    ].filter(Boolean).join('\n');

    return {
        title,
        description,
        location: restaurantAddress || restaurantName,
        startDate,
        endDate,
    };
}
