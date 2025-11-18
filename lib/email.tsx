import * as React from 'react';
import { Resend } from 'resend';
import { render } from '@react-email/render';
import { getTranslations } from '@/lib/i18n/server';
import { type Locale, defaultLocale, locales } from '@/lib/i18n';
import { BookingConfirmationPatientEmail } from '@/components/emails/BookingConfirmationPatient';
import { BookingConfirmationTherapistEmail } from '@/components/emails/BookingConfirmationTherapist';
import { AppointmentReminderPatientEmail } from '@/components/emails/AppointmentReminderPatient';
import { AppointmentReminderTherapistEmail } from '@/components/emails/AppointmentReminderTherapist';
import { CancellationNotificationEmail } from '@/components/emails/CancellationNotification';
import { RescheduleNotificationEmail } from '@/components/emails/RescheduleNotification';
import { createIcsFile } from '@/lib/utils/calendar';
import { generateSecureToken } from '@/lib/utils/tokens';
import { Booking, Therapist, Patient } from '@/lib/types';

// Helper function to validate and normalize locale
function getValidLocale(locale?: string): Locale {
  if (locale && locales.includes(locale as Locale)) {
    return locale as Locale;
  }
  return defaultLocale;
}

// Initialize Resend client
const resendApiKey = process.env.RESEND_API_KEY;
if (!resendApiKey) {
  console.warn('⚠️  RESEND_API_KEY is not set. Email sending will fail.');
}
const resend = new Resend(resendApiKey);
const fromEmail = process.env.RESEND_FROM_EMAIL;
if (!fromEmail) {
  console.warn('⚠️  RESEND_FROM_EMAIL is not set. Email sending will fail.');
}
const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;

export async function sendBookingConfirmationEmails(booking: Booking, therapist: Therapist, patient: Patient) {
  if (!fromEmail) {
    throw new Error('RESEND_FROM_EMAIL is not configured');
  }
  try {
    const locale = getValidLocale(booking.locale);
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
      from: fromEmail!,
      to: patient.email,
      subject: t('bookingConfirmation.subject'),
      html: patientEmailHtml,
      attachments: [
        {
          filename: 'appointment.ics',
          content: Buffer.from(icsContent).toString('base64'),
        },
      ],
    });

    if (patientEmailResponse.error) {
      console.error('Resend API error (patient email):', patientEmailResponse.error);
      throw new Error(`Failed to send patient email: ${JSON.stringify(patientEmailResponse.error)}`);
    }

    console.log('Patient email sent successfully:', patientEmailResponse.data?.id);

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
        from: fromEmail!,
        to: therapist.email,
        subject: t('bookingConfirmationTherapist.subject', { patientName: patient.name }),
        html: therapistEmailHtml,
        attachments: [
            {
              filename: 'appointment.ics',
              content: Buffer.from(icsContent).toString('base64'),
            },
        ],
      });

    if (therapistEmailResponse.error) {
      console.error('Resend API error (therapist email):', therapistEmailResponse.error);
      throw new Error(`Failed to send therapist email: ${JSON.stringify(therapistEmailResponse.error)}`);
    }

    console.log('Therapist email sent successfully:', therapistEmailResponse.data?.id);

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
    if (!fromEmail) {
        throw new Error('RESEND_FROM_EMAIL is not configured');
    }
    try {
        const locale = getValidLocale(booking.locale);
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
            from: fromEmail!,
            to: patient.email,
            subject: t('cancellationNotification.subject'),
            html: patientEmailHtml,
        });

        if (patientEmailResponse.error) {
          console.error('Resend API error (patient cancellation email):', patientEmailResponse.error);
          throw new Error(`Failed to send patient cancellation email: ${JSON.stringify(patientEmailResponse.error)}`);
        }

        console.log('Patient cancellation email sent successfully:', patientEmailResponse.data?.id);

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
            from: fromEmail!,
            to: therapist.email,
            subject: t('cancellationNotification.subject'),
            html: therapistEmailHtml,
        });

        if (therapistEmailResponse.error) {
          console.error('Resend API error (therapist cancellation email):', therapistEmailResponse.error);
          throw new Error(`Failed to send therapist cancellation email: ${JSON.stringify(therapistEmailResponse.error)}`);
        }

        console.log('Therapist cancellation email sent successfully:', therapistEmailResponse.data?.id);

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
    if (!fromEmail) {
        throw new Error('RESEND_FROM_EMAIL is not configured');
    }
    try {
        const locale = getValidLocale(booking.locale);
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
            from: fromEmail!,
            to: patient.email,
            subject: t('rescheduleNotification.subject'),
            html: patientEmailHtml,
            attachments: [
                {
                    filename: 'appointment.ics',
                    content: Buffer.from(icsContent).toString('base64'),
                },
            ],
        });

        if (patientEmailResponse.error) {
          console.error('Resend API error (patient reschedule email):', patientEmailResponse.error);
          throw new Error(`Failed to send patient reschedule email: ${JSON.stringify(patientEmailResponse.error)}`);
        }

        console.log('Patient reschedule email sent successfully:', patientEmailResponse.data?.id);

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
            from: fromEmail!,
            to: therapist.email,
            subject: t('rescheduleNotification.subject'),
            html: therapistEmailHtml,
            attachments: [
                {
                    filename: 'appointment.ics',
                    content: Buffer.from(icsContent).toString('base64'),
                },
            ],
        });

        if (therapistEmailResponse.error) {
          console.error('Resend API error (therapist reschedule email):', therapistEmailResponse.error);
          throw new Error(`Failed to send therapist reschedule email: ${JSON.stringify(therapistEmailResponse.error)}`);
        }

        console.log('Therapist reschedule email sent successfully:', therapistEmailResponse.data?.id);

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
    if (!fromEmail) {
        throw new Error('RESEND_FROM_EMAIL is not configured');
    }
    try {
        const locale = getValidLocale(booking.locale);
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
            from: fromEmail!,
            to: patient.email,
            subject: t('appointmentReminder.subject'),
            html: patientEmailHtml,
            attachments: [
                {
                    filename: 'appointment.ics',
                    content: Buffer.from(icsContent).toString('base64'),
                },
            ],
        });

        if (patientEmailResponse.error) {
          console.error('Resend API error (patient reminder email):', patientEmailResponse.error);
          throw new Error(`Failed to send patient reminder email: ${JSON.stringify(patientEmailResponse.error)}`);
        }

        console.log('Patient reminder email sent successfully:', patientEmailResponse.data?.id);

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
            from: fromEmail!,
            to: therapist.email,
            subject: t('appointmentReminderTherapist.subject', { patientName: patient.name }),
            html: therapistEmailHtml,
            attachments: [
                {
                    filename: 'appointment.ics',
                    content: Buffer.from(icsContent).toString('base64'),
                },
            ],
        });

        if (therapistEmailResponse.error) {
          console.error('Resend API error (therapist reminder email):', therapistEmailResponse.error);
          throw new Error(`Failed to send therapist reminder email: ${JSON.stringify(therapistEmailResponse.error)}`);
        }

        console.log('Therapist reminder email sent successfully:', therapistEmailResponse.data?.id);

        return {
            patientEmail: patientEmailResponse,
            therapistEmail: therapistEmailResponse,
        };
    } catch (error) {
        console.error('Failed to send reminder emails:', error);
        throw error; // Re-throw so tests can catch it
    }
}
