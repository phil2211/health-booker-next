import ical from 'ical-generator';
import { Booking } from '@/lib/types';

interface CalendarEvent {
    start: Date;
    end: Date;
    title: string;
    description: string;
    location: string;
}

/**
 * Creates an iCalendar (.ics) file content string for a booking.
 * @param {CalendarEvent} event The event details.
 * @returns {string} The iCalendar file content.
 */
export function createIcsFile(event: CalendarEvent): string {
    const cal = ical({ name: 'HealthBooker Appointment' });
    cal.createEvent({
        start: event.start,
        end: event.end,
        summary: event.title,
        description: event.description,
        location: event.location,
    });
    return cal.toString();
}
