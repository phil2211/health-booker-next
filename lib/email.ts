import { Resend } from 'resend';
import { getTranslations } from '@/lib/i18n/server';
import { BookingConfirmationPatientEmail } from '@/components/emails/BookingConfirmationPatient';
import { BookingConfirmationTherapistEmail } from '@/components/emails/BookingConfirmationTherapist';
import { AppointmentReminderPatientEmail } from '@/components/emails/AppointmentReminderPatient';
import { AppointmentReminderTherapistEmail } from '@/components/emails/AppointmentReminderTherapist';
import { CancellationNotificationEmail } from '@/components/emails/CancellationNotification';
import { RescheduleNotificationEmail } from '@/components/emails/RescheduleNotification';
import { createIcsFile } from '@/lib/utils/calendar';
import { generateSecureToken } from '@/lib/utils/tokens';
import { Booking, Therapist, Patient } from '@/lib/types';

const resend = new Resend(process.env.RESEND_API_KEY);
const fromEmail = 'onboarding@resend.dev';
const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;

export async function sendBookingConfirmationEmails(booking: Booking, therapist: Therapist, patient: Patient) {
  try {
    const locale = booking.locale || 'en';
    const t = await getTranslations(locale);

    // Generate ICS file content
    const icsContent = createIcsFile({
      start: new Date(booking.appointmentDate + 'T' + booking.startTime),
      end: new Date(booking.appointmentDate + 'T' + booking.endTime),
      title: t('calendar.appointmentTitle', { therapistName: therapist.name }),
      description: t('calendar.appointmentDescription'),
      location: 'Online', // Or actual location
    });

    // Generate secure links
    const cancellationLink = `${baseUrl}/cancel/${booking.cancellationToken}`;
    const rescheduleLink = `${baseUrl}/reschedule/${booking.cancellationToken}`;

    // Email to Patient
    await resend.emails.send({
      from: fromEmail,
      to: patient.email,
      subject: t('bookingConfirmation.subject'),
      react: BookingConfirmationPatientEmail({
        t,
        therapistName: therapist.name,
        bookingDate: new Date(booking.appointmentDate).toLocaleDateString(locale),
        bookingTime: new Date(booking.appointmentDate + 'T' + booking.startTime).toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' }),
        cancellationLink,
        rescheduleLink,
      }),
      attachments: [
        {
          filename: 'appointment.ics',
          content: Buffer.from(icsContent),
        },
      ],
    });

    // Email to Therapist
    await resend.emails.send({
        from: fromEmail,
        to: therapist.email,
        subject: t('bookingConfirmationTherapist.subject', { patientName: patient.name }),
        react: BookingConfirmationTherapistEmail({
          t,
          patientName: patient.name,
          bookingDate: new Date(booking.appointmentDate).toLocaleDateString(locale),
          bookingTime: new Date(booking.appointmentDate + 'T' + booking.startTime).toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' }),
        }),
        attachments: [
            {
              filename: 'appointment.ics',
              content: Buffer.from(icsContent),
            },
        ],
      });

  } catch (error) {
    console.error('Failed to send booking confirmation emails:', error);
    // Add more robust error handling
  }
}

// ... implement functions for sendCancellationEmail, sendRescheduleEmail, sendReminderEmails
//    each function should accept the booking object to access the locale and generate links/calendar.

export async function sendCancellationEmail(booking: Booking, therapist: Therapist, patient: Patient) {
    try {
        const locale = booking.locale || 'en';
        const t = await getTranslations(locale);

        // Email to Patient
        await resend.emails.send({
            from: fromEmail,
            to: patient.email,
            subject: t('cancellationNotification.subject'),
            react: CancellationNotificationEmail({
                t,
                recipientName: patient.name,
                therapistName: therapist.name,
                patientName: patient.name,
                bookingDate: new Date(booking.appointmentDate).toLocaleDateString(locale),
                bookingTime: new Date(booking.appointmentDate + 'T' + booking.startTime).toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' }),
            }),
        });

        // Email to Therapist
        await resend.emails.send({
            from: fromEmail,
            to: therapist.email,
            subject: t('cancellationNotification.subject'),
            react: CancellationNotificationEmail({
                t,
                recipientName: therapist.name,
                therapistName: therapist.name,
                patientName: patient.name,
                bookingDate: new Date(booking.appointmentDate).toLocaleDateString(locale),
                bookingTime: new Date(booking.appointmentDate + 'T' + booking.startTime).toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' }),
            }),
        });
    } catch (error) {
        console.error('Failed to send cancellation emails:', error);
    }
}

export async function sendRescheduleEmail(booking: Booking, therapist: Therapist, patient: Patient) {
    try {
        const locale = booking.locale || 'en';
        const t = await getTranslations(locale);

        // Generate ICS file content
        const icsContent = createIcsFile({
            start: new Date(booking.appointmentDate + 'T' + booking.startTime),
            end: new Date(booking.appointmentDate + 'T' + booking.endTime),
            title: t('calendar.appointmentTitle', { therapistName: therapist.name }),
            description: t('calendar.appointmentDescription'),
            location: 'Online', // Or actual location
        });

        // Generate secure links
        const cancellationLink = `${baseUrl}/cancel/${booking.cancellationToken}`;
        const rescheduleLink = `${baseUrl}/reschedule/${booking.cancellationToken}`;

        // Email to Patient
        await resend.emails.send({
            from: fromEmail,
            to: patient.email,
            subject: t('rescheduleNotification.subject'),
            react: RescheduleNotificationEmail({
                t,
                recipientName: patient.name,
                therapistName: therapist.name,
                patientName: patient.name,
                newBookingDate: new Date(booking.appointmentDate).toLocaleDateString(locale),
                newBookingTime: new Date(booking.appointmentDate + 'T' + booking.startTime).toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' }),
                cancellationLink,
                rescheduleLink,
            }),
            attachments: [
                {
                    filename: 'appointment.ics',
                    content: Buffer.from(icsContent),
                },
            ],
        });

        // Email to Therapist
        await resend.emails.send({
            from: fromEmail,
            to: therapist.email,
            subject: t('rescheduleNotification.subject'),
            react: RescheduleNotificationEmail({
                t,
                recipientName: therapist.name,
                therapistName: therapist.name,
                patientName: patient.name,
                newBookingDate: new Date(booking.appointmentDate).toLocaleDateString(locale),
                newBookingTime: new Date(booking.appointmentDate + 'T' + booking.startTime).toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' }),
                cancellationLink,
                rescheduleLink,
            }),
            attachments: [
                {
                    filename: 'appointment.ics',
                    content: Buffer.from(icsContent),
                },
            ],
        });
    } catch (error) {
        console.error('Failed to send reschedule emails:', error);
    }
}

export async function sendReminderEmails(booking: Booking, therapist: Therapist, patient: Patient) {
    try {
        const locale = booking.locale || 'en';
        const t = await getTranslations(locale);

        // Generate ICS file content
        const icsContent = createIcsFile({
            start: new Date(booking.appointmentDate + 'T' + booking.startTime),
            end: new Date(booking.appointmentDate + 'T' + booking.endTime),
            title: t('calendar.appointmentTitle', { therapistName: therapist.name }),
            description: t('calendar.appointmentDescription'),
            location: 'Online', // Or actual location
        });

        // Generate secure links
        const cancellationLink = `${baseUrl}/cancel/${booking.cancellationToken}`;
        const rescheduleLink = `${baseUrl}/reschedule/${booking.cancellationToken}`;

        // Email to Patient
        await resend.emails.send({
            from: fromEmail,
            to: patient.email,
            subject: t('appointmentReminder.subject'),
            react: AppointmentReminderPatientEmail({
                t,
                therapistName: therapist.name,
                bookingDate: new Date(booking.appointmentDate).toLocaleDateString(locale),
                bookingTime: new Date(booking.appointmentDate + 'T' + booking.startTime).toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' }),
                cancellationLink,
                rescheduleLink,
            }),
            attachments: [
                {
                    filename: 'appointment.ics',
                    content: Buffer.from(icsContent),
                },
            ],
        });

        // Email to Therapist
        await resend.emails.send({
            from: fromEmail,
            to: therapist.email,
            subject: t('appointmentReminderTherapist.subject', { patientName: patient.name }),
            react: AppointmentReminderTherapistEmail({
                t,
                patientName: patient.name,
                bookingDate: new Date(booking.appointmentDate).toLocaleDateString(locale),
                bookingTime: new Date(booking.appointmentDate + 'T' + booking.startTime).toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' }),
            }),
            attachments: [
                {
                    filename: 'appointment.ics',
                    content: Buffer.from(icsContent),
                },
            ],
        });
    } catch (error) {
        console.error('Failed to send reminder emails:', error);
    }
}
