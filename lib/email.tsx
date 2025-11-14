import * as React from 'react';
import { Resend } from 'resend';
import { render } from '@react-email/render';
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
    const patientEmailHtml = await render(
      <BookingConfirmationPatientEmail
        t={t}
        therapistName={therapist.name}
        bookingDate={new Date(booking.appointmentDate).toLocaleDateString(locale)}
        bookingTime={new Date(booking.appointmentDate + 'T' + booking.startTime).toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' })}
        cancellationLink={cancellationLink}
        rescheduleLink={rescheduleLink}
      />
    );
    const patientEmailResponse = await resend.emails.send({
      from: fromEmail,
      to: patient.email,
      subject: t('bookingConfirmation.subject'),
      html: patientEmailHtml,
      attachments: [
        {
          filename: 'appointment.ics',
          content: Buffer.from(icsContent),
        },
      ],
    });

    // Email to Therapist
    const therapistEmailHtml = await render(
      <BookingConfirmationTherapistEmail
        t={t}
        patientName={patient.name}
        bookingDate={new Date(booking.appointmentDate).toLocaleDateString(locale)}
        bookingTime={new Date(booking.appointmentDate + 'T' + booking.startTime).toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' })}
      />
    );
    const therapistEmailResponse = await resend.emails.send({
        from: fromEmail,
        to: therapist.email,
        subject: t('bookingConfirmationTherapist.subject', { patientName: patient.name }),
        html: therapistEmailHtml,
        attachments: [
            {
              filename: 'appointment.ics',
              content: Buffer.from(icsContent),
            },
        ],
      });

    return {
      patientEmail: patientEmailResponse,
      therapistEmail: therapistEmailResponse,
    };
  } catch (error) {
    console.error('Failed to send booking confirmation emails:', error);
    throw error; // Re-throw so tests can catch it
  }
}

// ... implement functions for sendCancellationEmail, sendRescheduleEmail, sendReminderEmails
//    each function should accept the booking object to access the locale and generate links/calendar.

export async function sendCancellationEmail(booking: Booking, therapist: Therapist, patient: Patient) {
    try {
        const locale = booking.locale || 'en';
        const t = await getTranslations(locale);

        // Email to Patient
        const patientEmailHtml = await render(
            <CancellationNotificationEmail
                t={t}
                recipientName={patient.name}
                therapistName={therapist.name}
                patientName={patient.name}
                bookingDate={new Date(booking.appointmentDate).toLocaleDateString(locale)}
                bookingTime={new Date(booking.appointmentDate + 'T' + booking.startTime).toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' })}
            />
        );
        const patientEmailResponse = await resend.emails.send({
            from: fromEmail,
            to: patient.email,
            subject: t('cancellationNotification.subject'),
            html: patientEmailHtml,
        });

        // Email to Therapist
        const therapistEmailHtml = await render(
            <CancellationNotificationEmail
                t={t}
                recipientName={therapist.name}
                therapistName={therapist.name}
                patientName={patient.name}
                bookingDate={new Date(booking.appointmentDate).toLocaleDateString(locale)}
                bookingTime={new Date(booking.appointmentDate + 'T' + booking.startTime).toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' })}
            />
        );
        const therapistEmailResponse = await resend.emails.send({
            from: fromEmail,
            to: therapist.email,
            subject: t('cancellationNotification.subject'),
            html: therapistEmailHtml,
        });

        return {
            patientEmail: patientEmailResponse,
            therapistEmail: therapistEmailResponse,
        };
    } catch (error) {
        console.error('Failed to send cancellation emails:', error);
        throw error; // Re-throw so tests can catch it
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
        const patientEmailHtml = await render(
            <RescheduleNotificationEmail
                t={t}
                recipientName={patient.name}
                therapistName={therapist.name}
                patientName={patient.name}
                newBookingDate={new Date(booking.appointmentDate).toLocaleDateString(locale)}
                newBookingTime={new Date(booking.appointmentDate + 'T' + booking.startTime).toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' })}
                cancellationLink={cancellationLink}
                rescheduleLink={rescheduleLink}
            />
        );
        const patientEmailResponse = await resend.emails.send({
            from: fromEmail,
            to: patient.email,
            subject: t('rescheduleNotification.subject'),
            html: patientEmailHtml,
            attachments: [
                {
                    filename: 'appointment.ics',
                    content: Buffer.from(icsContent),
                },
            ],
        });

        // Email to Therapist
        const therapistEmailHtml = await render(
            <RescheduleNotificationEmail
                t={t}
                recipientName={therapist.name}
                therapistName={therapist.name}
                patientName={patient.name}
                newBookingDate={new Date(booking.appointmentDate).toLocaleDateString(locale)}
                newBookingTime={new Date(booking.appointmentDate + 'T' + booking.startTime).toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' })}
                cancellationLink={cancellationLink}
                rescheduleLink={rescheduleLink}
            />
        );
        const therapistEmailResponse = await resend.emails.send({
            from: fromEmail,
            to: therapist.email,
            subject: t('rescheduleNotification.subject'),
            html: therapistEmailHtml,
            attachments: [
                {
                    filename: 'appointment.ics',
                    content: Buffer.from(icsContent),
                },
            ],
        });

        return {
            patientEmail: patientEmailResponse,
            therapistEmail: therapistEmailResponse,
        };
    } catch (error) {
        console.error('Failed to send reschedule emails:', error);
        throw error; // Re-throw so tests can catch it
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
        const patientEmailHtml = await render(
            <AppointmentReminderPatientEmail
                t={t}
                therapistName={therapist.name}
                bookingDate={new Date(booking.appointmentDate).toLocaleDateString(locale)}
                bookingTime={new Date(booking.appointmentDate + 'T' + booking.startTime).toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' })}
                cancellationLink={cancellationLink}
                rescheduleLink={rescheduleLink}
            />
        );
        const patientEmailResponse = await resend.emails.send({
            from: fromEmail,
            to: patient.email,
            subject: t('appointmentReminder.subject'),
            html: patientEmailHtml,
            attachments: [
                {
                    filename: 'appointment.ics',
                    content: Buffer.from(icsContent),
                },
            ],
        });

        // Email to Therapist
        const therapistEmailHtml = await render(
            <AppointmentReminderTherapistEmail
                t={t}
                patientName={patient.name}
                bookingDate={new Date(booking.appointmentDate).toLocaleDateString(locale)}
                bookingTime={new Date(booking.appointmentDate + 'T' + booking.startTime).toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' })}
            />
        );
        const therapistEmailResponse = await resend.emails.send({
            from: fromEmail,
            to: therapist.email,
            subject: t('appointmentReminderTherapist.subject', { patientName: patient.name }),
            html: therapistEmailHtml,
            attachments: [
                {
                    filename: 'appointment.ics',
                    content: Buffer.from(icsContent),
                },
            ],
        });

        return {
            patientEmail: patientEmailResponse,
            therapistEmail: therapistEmailResponse,
        };
    } catch (error) {
        console.error('Failed to send reminder emails:', error);
        throw error; // Re-throw so tests can catch it
    }
}
