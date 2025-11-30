import * as React from 'react';
import { Resend } from 'resend';
import { render } from '@react-email/render';
import { BookingConfirmationPatientEmail } from '@/components/emails/BookingConfirmationPatient';
import { BookingConfirmationTherapistEmail } from '@/components/emails/BookingConfirmationTherapist';
import { AppointmentReminderPatientEmail } from '@/components/emails/AppointmentReminderPatient';
import { AppointmentReminderTherapistEmail } from '@/components/emails/AppointmentReminderTherapist';
import { CancellationNotificationEmail } from '@/components/emails/CancellationNotification';
import { RescheduleNotificationEmail } from '@/components/emails/RescheduleNotification';
import { generateSecureToken } from '@/lib/utils/tokens';
import { Booking, Therapist, Patient } from '@/lib/types';
import { getValidLocale, setupEmailData, generateEmailHtml, validateEmailConfig } from '@/lib/utils/email';

// Instead, create a function to get Resend instance
function getResendClient() {
  const resendApiKey = process.env.RESEND_API_KEY;
  if (!resendApiKey) {
    throw new Error('RESEND_API_KEY is not configured');
  }
  return new Resend(resendApiKey);
}

const fromEmail = process.env.RESEND_FROM_EMAIL;
if (!fromEmail) {
  console.warn('⚠️  RESEND_FROM_EMAIL is not set. Email sending will fail.');
}
const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;

export async function sendBookingConfirmationEmails(booking: Booking, therapist: Therapist, patient: Patient) {
  const { fromEmail } = validateEmailConfig();

  try {
    const emailSetup = await setupEmailData(booking, therapist, true, true);

    // Email to Patient
    const patientEmailHtml = await generateEmailHtml(
      <BookingConfirmationPatientEmail
        t={emailSetup.t}
        therapistName={therapist.name}
        patientName={patient.name}
        bookingDate={new Date(booking.appointmentDate).toLocaleDateString(emailSetup.locale)}
        bookingTime={new Date(booking.appointmentDate + 'T' + booking.startTime).toLocaleTimeString(emailSetup.locale, { hour: '2-digit', minute: '2-digit' })}
        cancellationLink={emailSetup.cancellationLink!}
        termsLink={`${baseUrl}/terms-of-use`}
      />
    );
    const patientEmailResponse = await getResendClient().emails.send({
      from: fromEmail,
      to: patient.email,
      subject: emailSetup.t('bookingConfirmation.subject'),
      html: patientEmailHtml,
      attachments: [
        {
          filename: 'appointment.ics',
          content: emailSetup.icsContent!.toString('base64'),
        },
      ],
    });

    if (patientEmailResponse.error) {
      console.error('Resend API error (patient email):', patientEmailResponse.error);
      throw new Error(`Failed to send patient email: ${JSON.stringify(patientEmailResponse.error)}`);
    }

    console.log('Patient email sent successfully:', patientEmailResponse.data?.id);

    // Email to Therapist
    const therapistEmailHtml = await generateEmailHtml(
      <BookingConfirmationTherapistEmail
        t={emailSetup.t}
        patientName={patient.name}
        therapistName={therapist.name}
        bookingDate={new Date(booking.appointmentDate).toLocaleDateString(emailSetup.locale)}
        bookingTime={new Date(booking.appointmentDate + 'T' + booking.startTime).toLocaleTimeString(emailSetup.locale, { hour: '2-digit', minute: '2-digit' })}
      />
    );
    const therapistEmailResponse = await getResendClient().emails.send({
      from: fromEmail,
      to: therapist.email,
      subject: emailSetup.t('bookingConfirmationTherapist.subject', { patientName: patient.name }),
      html: therapistEmailHtml,
      attachments: [
        {
          filename: 'appointment.ics',
          content: emailSetup.icsContent!.toString('base64'),
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
  const { fromEmail } = validateEmailConfig();

  try {
    const emailSetup = await setupEmailData(booking);

    // Email to Patient
    const patientEmailHtml = await generateEmailHtml(
      <CancellationNotificationEmail
        t={emailSetup.t}
        recipientName={patient.name}
        therapistName={therapist.name}
        patientName={patient.name}
        bookingDate={new Date(booking.appointmentDate).toLocaleDateString(emailSetup.locale)}
        bookingTime={new Date(booking.appointmentDate + 'T' + booking.startTime).toLocaleTimeString(emailSetup.locale, { hour: '2-digit', minute: '2-digit' })}
      />
    );
    const patientEmailResponse = await getResendClient().emails.send({
      from: fromEmail,
      to: patient.email,
      subject: emailSetup.t('cancellationNotification.subject'),
      html: patientEmailHtml,
    });

    if (patientEmailResponse.error) {
      console.error('Resend API error (patient cancellation email):', patientEmailResponse.error);
      throw new Error(`Failed to send patient cancellation email: ${JSON.stringify(patientEmailResponse.error)}`);
    }

    console.log('Patient cancellation email sent successfully:', patientEmailResponse.data?.id);

    // Email to Therapist
    const therapistEmailHtml = await generateEmailHtml(
      <CancellationNotificationEmail
        t={emailSetup.t}
        recipientName={therapist.name}
        therapistName={therapist.name}
        patientName={patient.name}
        bookingDate={new Date(booking.appointmentDate).toLocaleDateString(emailSetup.locale)}
        bookingTime={new Date(booking.appointmentDate + 'T' + booking.startTime).toLocaleTimeString(emailSetup.locale, { hour: '2-digit', minute: '2-digit' })}
      />
    );
    const therapistEmailResponse = await getResendClient().emails.send({
      from: fromEmail,
      to: therapist.email,
      subject: emailSetup.t('cancellationNotification.subject'),
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
  const { fromEmail } = validateEmailConfig();

  try {
    const emailSetup = await setupEmailData(booking, therapist, true, true);

    // Email to Patient
    const patientEmailHtml = await generateEmailHtml(
      <RescheduleNotificationEmail
        t={emailSetup.t}
        recipientName={patient.name}
        therapistName={therapist.name}
        patientName={patient.name}
        newBookingDate={new Date(booking.appointmentDate).toLocaleDateString(emailSetup.locale)}
        newBookingTime={new Date(booking.appointmentDate + 'T' + booking.startTime).toLocaleTimeString(emailSetup.locale, { hour: '2-digit', minute: '2-digit' })}
        cancellationLink={emailSetup.cancellationLink!}
        rescheduleLink={emailSetup.rescheduleLink!}
      />
    );
    const patientEmailResponse = await getResendClient().emails.send({
      from: fromEmail,
      to: patient.email,
      subject: emailSetup.t('rescheduleNotification.subject'),
      html: patientEmailHtml,
      attachments: [
        {
          filename: 'appointment.ics',
          content: emailSetup.icsContent!.toString('base64'),
        },
      ],
    });

    if (patientEmailResponse.error) {
      console.error('Resend API error (patient reschedule email):', patientEmailResponse.error);
      throw new Error(`Failed to send patient reschedule email: ${JSON.stringify(patientEmailResponse.error)}`);
    }

    console.log('Patient reschedule email sent successfully:', patientEmailResponse.data?.id);

    // Email to Therapist
    const therapistEmailHtml = await generateEmailHtml(
      <RescheduleNotificationEmail
        t={emailSetup.t}
        recipientName={therapist.name}
        therapistName={therapist.name}
        patientName={patient.name}
        newBookingDate={new Date(booking.appointmentDate).toLocaleDateString(emailSetup.locale)}
        newBookingTime={new Date(booking.appointmentDate + 'T' + booking.startTime).toLocaleTimeString(emailSetup.locale, { hour: '2-digit', minute: '2-digit' })}
        cancellationLink={emailSetup.cancellationLink!}
        rescheduleLink={emailSetup.rescheduleLink!}
      />
    );
    const therapistEmailResponse = await getResendClient().emails.send({
      from: fromEmail,
      to: therapist.email,
      subject: emailSetup.t('rescheduleNotification.subject'),
      html: therapistEmailHtml,
      attachments: [
        {
          filename: 'appointment.ics',
          content: emailSetup.icsContent!.toString('base64'),
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
  const { fromEmail } = validateEmailConfig();

  try {
    const emailSetup = await setupEmailData(booking, therapist, true, true);

    // Email to Patient
    const patientEmailHtml = await generateEmailHtml(
      <AppointmentReminderPatientEmail
        t={emailSetup.t}
        therapistName={therapist.name}
        patientName={patient.name}
        bookingDate={new Date(booking.appointmentDate).toLocaleDateString(emailSetup.locale)}
        bookingTime={new Date(booking.appointmentDate + 'T' + booking.startTime).toLocaleTimeString(emailSetup.locale, { hour: '2-digit', minute: '2-digit' })}
        cancellationLink={emailSetup.cancellationLink!}
        rescheduleLink={emailSetup.rescheduleLink!}
      />
    );
    const patientEmailResponse = await getResendClient().emails.send({
      from: fromEmail,
      to: patient.email,
      subject: emailSetup.t('appointmentReminder.subject'),
      html: patientEmailHtml,
      attachments: [
        {
          filename: 'appointment.ics',
          content: emailSetup.icsContent!.toString('base64'),
        },
      ],
    });

    if (patientEmailResponse.error) {
      console.error('Resend API error (patient reminder email):', patientEmailResponse.error);
      throw new Error(`Failed to send patient reminder email: ${JSON.stringify(patientEmailResponse.error)}`);
    }

    console.log('Patient reminder email sent successfully:', patientEmailResponse.data?.id);

    // Email to Therapist
    const therapistEmailHtml = await generateEmailHtml(
      <AppointmentReminderTherapistEmail
        t={emailSetup.t}
        patientName={patient.name}
        bookingDate={new Date(booking.appointmentDate).toLocaleDateString(emailSetup.locale)}
        bookingTime={new Date(booking.appointmentDate + 'T' + booking.startTime).toLocaleTimeString(emailSetup.locale, { hour: '2-digit', minute: '2-digit' })}
      />
    );
    const therapistEmailResponse = await getResendClient().emails.send({
      from: fromEmail,
      to: therapist.email,
      subject: emailSetup.t('appointmentReminderTherapist.subject', { patientName: patient.name }),
      html: therapistEmailHtml,
      attachments: [
        {
          filename: 'appointment.ics',
          content: emailSetup.icsContent!.toString('base64'),
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
