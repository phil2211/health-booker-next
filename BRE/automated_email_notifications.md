# Business Requirement: Automated Email Notifications

## 1. Objective

To implement a robust, automated email notification system for critical booking events to enhance communication and user experience for both patients and therapists. This system will be built and deployed on the Vercel platform.

### Core Requirements:
- Send email confirmation upon successful booking.
- Send reminder emails 24 hours before an appointment.
- Send notification emails for appointment cancellations.
- Send notification emails for appointment reschedules.
- **Internationalization (i18n):** Emails must be sent in the language (locale) the user selected when booking the appointment.
- **Calendar Integration:** Every email related to an appointment (confirmation, reminder, reschedule) must include an attached `.ics` calendar file to allow recipients to easily add the event to their personal calendars.
- **Action Links:** Confirmation, reminder, and reschedule emails must include secure, unique links for:
    - **Cancellation:** A link allowing the patient to cancel the specific appointment.
    - **Reschedule:** A link allowing the patient to reschedule the specific appointment.

## 2. Prerequisite: Data Model and API Adjustments

Before implementing the email logic, the application must be able to store the language context of a booking.

1.  **Update Data Model:**
    - Modify the `Booking` schema in `models/Booking.ts` to include a `locale` field and a `cancellationToken` field.
    ```typescript
    // models/Booking.ts
    const bookingSchema = new mongoose.Schema({
      // ... other fields
      locale: {
        type: String,
        required: true,
        default: 'en',
      },
      reminderSent: {
        type: Boolean,
        default: false,
      },
      cancellationToken: {
        type: String,
        unique: true,
        sparse: true, // Allows null values to not violate unique constraint
      },
    });
    ```

2.  **Update Booking API:**
    - The `POST` handler in `app/api/bookings/route.ts` must be updated to accept a `locale` in the request body and save it to the new `Booking` document.
    - Upon successful booking creation, a unique `cancellationToken` should be generated and saved with the booking. This token will be used for secure cancellation and reschedule links.

## 3. Prerequisite: Secure Links and Calendar Generation

This section outlines the utilities needed to generate secure links and calendar files.

1.  **Secure Link Generation:**
    - Implement a utility function (e.g., in `lib/utils/tokens.ts`) to generate cryptographically secure, unique tokens for cancellation and reschedule actions. These tokens should be associated with the booking and have an expiration (e.g., 7 days for cancellation links, or tied to the booking's lifecycle).
    - The cancellation link will point to `/cancel/[token]` and the reschedule link to `/reschedule/[token]`.

2.  **Calendar File (ICS) Generation:**
    - Implement a utility function (e.g., in `lib/utils/calendar.ts`) that takes booking details (start time, end time, title, description, location) and generates an `.ics` file content string. A library like `ical-generator` can be used for this.

## 4. Recommended Technology Stack

- **Email Service Provider:** [Resend](https://resend.com/). It is tightly integrated with Vercel and supports React-based email templates out-of-the-box, which aligns with the project's Next.js stack.
- **Email Templates:** [React Email](https://react.email/). To create reusable and maintainable email templates as React components.
- **Scheduled Tasks:** [Vercel Cron Jobs](https://vercel.com/docs/cron-jobs). For triggering the 24-hour appointment reminders.
- **Calendar Generation:** `ical-generator` (or similar library) for `.ics` file creation.

## 5. Implementation Plan

This plan provides a step-by-step guide for an AI agent to implement the feature.

### Step 1: Setup and Configuration

1.  **Install Dependencies:**
    ```bash
    npm install resend react-email ical-generator
    ```

2.  **Set Up Environment Variables:**
    - Sign up for a Resend account and get your API key.
    - Add the API key to your local `.env.local` file and to the Vercel project's environment variables.
    - **IMPORTANT**: For the Resend free tier, you must also add your own email address as a verified sender and send emails *to* that same address for testing.

    ```ini
    # .env.local
    RESEND_API_KEY="re_xxxxxxxxxxxxxxxx"
    NEXT_PUBLIC_BASE_URL="https://your-app-url.vercel.app" // Used for generating absolute links
    ```

3.  **Configure Vercel Cron Job for Reminders:**
    - Edit the `vercel.json` file at the project root. If it doesn't exist, create it.
    - Add a cron job that runs every hour to check for appointments that need reminders.

    ```json
    // vercel.json
    {
      "crons": [
        {
          "path": "/api/reminders/send",
          "schedule": "0 * * * *"
        }
      ]
    }
    ```

### Step 2: Develop Internationalized React Email Templates

1.  **Create a Directory for Emails:**
    - Create a new directory: `components/emails/`.

2.  **Develop React Email Templates:**
    - The core idea is to make templates language-agnostic. Instead of hardcoding text, they will receive a translation function (`t`) as a prop and use it to render text.
    - Update the translation files (`lib/i18n/translations/en.json`, `de.json`) with keys for email subjects and content.
    - Templates will now also accept `cancellationLink` and `rescheduleLink` as props.

    **Example Template (`BookingConfirmationPatient.tsx`):**
    ```tsx
    import * as React from 'react';
    import { Html, Head, Preview, Body, Container, Text, Link } from '@react-email/components';

    interface BookingConfirmationPatientEmailProps {
      t: (key: string, params?: object) => string; // Translation function
      therapistName: string;
      bookingDate: string;
      bookingTime: string;
      cancellationLink: string;
      rescheduleLink: string;
    }

    export const BookingConfirmationPatientEmail: React.FC<Readonly<BookingConfirmationPatientEmailProps>> = ({
      t,
      therapistName,
      bookingDate,
      bookingTime,
      cancellationLink,
      rescheduleLink,
    }) => (
      <Html>
        <Head />
        <Preview>{t('bookingConfirmation.preview')}</Preview>
        <Body>
          <Container>
            <Text>{t('common.dearPatient')},</Text>
            <Text>
              {t('bookingConfirmation.body', { therapistName, bookingDate, bookingTime })}
            </Text>
            <Text>
              <Link href={rescheduleLink}>{t('bookingConfirmation.rescheduleAppointment')}</Link>
            </Text>
            <Text>
              <Link href={cancellationLink}>{t('bookingConfirmation.cancelAppointment')}</Link>
            </Text>
            <Text>{t('common.regards')}</Text>
          </Container>
        </Body>
      </Html>
    );
    ```

### Step 3: Implement Email Sending Service

1.  **Create an Email Utility Module:**
    - Create a new file: `lib/email.ts`.
    - This module will handle loading the correct translations, generating calendar files, creating secure links, and sending emails.

    **`lib/email.ts` Content (Conceptual):**
    ```typescript
    import { Resend } from 'resend';
    import { getTranslations } from '@/lib/i18n/server';
    import { BookingConfirmationPatientEmail } from '@/components/emails/BookingConfirmationPatient';
    import { createIcsFile } from '@/lib/utils/calendar'; // New utility
    import { generateCancellationToken } from '@/lib/utils/tokens'; // New utility

    const resend = new Resend(process.env.RESEND_API_KEY);
    const fromEmail = 'onboarding@resend.dev';
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;

    export async function sendBookingConfirmationEmails(booking: any, therapist: any, patient: any) {
      try {
        const locale = booking.locale || 'en';
        const t = await getTranslations(locale);

        // Generate ICS file content
        const icsContent = createIcsFile({
          start: booking.startTime,
          end: booking.endTime,
          title: t('calendar.appointmentTitle', { therapistName: `${therapist.firstName} ${therapist.lastName}` }),
          description: t('calendar.appointmentDescription'),
          location: 'Online', // Or actual location
        });

        // Generate secure links
        const cancellationLink = `${baseUrl}/cancel/${booking.cancellationToken}`;
        const rescheduleLink = `${baseUrl}/reschedule/${booking.cancellationToken}`; // Assuming same token for reschedule for now

        // Email to Patient
        await resend.emails.send({
          from: fromEmail,
          to: patient.email,
          subject: t('bookingConfirmation.subject'),
          react: BookingConfirmationPatientEmail({
            t,
            therapistName: `${therapist.firstName} ${therapist.lastName}`,
            bookingDate: new Date(booking.startTime).toLocaleDateString(locale),
            bookingTime: new Date(booking.startTime).toLocaleTimeString(locale),
            cancellationLink,
            rescheduleLink,
          }),
          attachments: [
            {
              filename: 'appointment.ics',
              content: Buffer.from(icsContent),
              contentType: 'text/calendar',
            },
          ],
        });

        // Email to Therapist
        // ... similar logic using BookingConfirmationTherapistEmail, potentially different links/attachments
      } catch (error) {
        console.error('Failed to send booking confirmation emails:', error);
        // Add more robust error handling
      }
    }

    // ... implement functions for sendCancellationEmail, sendRescheduleEmail, sendReminderEmails
    //    each function should accept the booking object to access the locale and generate links/calendar.
    ```

### Step 4: Integrate Email Triggers into API Routes

Modify the existing API routes to call the email sending functions.

1.  **New Booking (`app/api/bookings/route.ts`):**
    - **Note:** Ensure the client-side request sends the current `locale` from the UI.
    - After the booking is successfully saved to the database (including the generated `cancellationToken`), call `sendBookingConfirmationEmails`. The API route will need to fetch the full booking details, therapist, and patient information to pass to the email utility.

2.  **Cancellation (`app/api/cancel/[token]/route.ts`):**
    - After the booking status is updated to `cancelled`, fetch the booking (using the token) to get its `locale` and other details. Generate necessary links (e.g., a link to re-book) and calendar data (e.g., a cancellation notice) and pass them to `sendCancellationEmail`.

3.  **Reschedule (`app/api/therapist/bookings/[id]/reschedule/route.ts`):**
    - After the booking is successfully updated, use its `locale` and `cancellationToken` to generate the new calendar file and updated links. Pass these to `sendRescheduleEmail`.

### Step 5: Implement Reminder Cron Job

1.  **Create the Cron Job API Route:**
    - Create a new file: `app/api/reminders/send/route.ts`.

2.  **Implement Reminder Logic:**
    - The logic remains similar, but now it must:
        a. Fetch all bookings scheduled to start between 24 and 25 hours from now.
        b. For each upcoming booking, generate the ICS file and secure links (cancellation, reschedule) using the booking's `cancellationToken`.
        c. Call `sendReminderEmails` with the booking details, generated links, and calendar data.

    **`app/api/reminders/send/route.ts` (Conceptual):**
    ```typescript
    import { NextResponse } from 'next/server';
    import Booking from '@/models/Booking';
    import { sendReminderEmails } from '@/lib/email'; // This function needs to be created
    import { createIcsFile } from '@/lib/utils/calendar';
    // Assuming cancellationToken is already on the booking

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;

    export async function GET() {
      const now = new Date();
      const twentyFourHoursFromNow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
      const twentyFiveHoursFromNow = new Date(now.getTime() + 25 * 60 * 60 * 1000);

      const upcomingBookings = await Booking.find({
        startTime: {
          $gte: twentyFourHoursFromNow,
          $lt: twentyFiveHoursFromNow,
        },
        status: 'confirmed',
        reminderSent: { $ne: true }
      }).populate('therapistId patientId');

      for (const booking of upcomingBookings) {
        // Generate ICS file content
        const locale = booking.locale || 'en';
        const t = await getTranslations(locale); // Need to import getTranslations here too

        const icsContent = createIcsFile({
          start: booking.startTime,
          end: booking.endTime,
          title: t('calendar.appointmentTitle', { therapistName: `${booking.therapistId.firstName} ${booking.therapistId.lastName}` }),
          description: t('calendar.appointmentDescription'),
          location: 'Online',
        });

        // Generate secure links
        const cancellationLink = `${baseUrl}/cancel/${booking.cancellationToken}`;
        const rescheduleLink = `${baseUrl}/reschedule/${booking.cancellationToken}`;

        await sendReminderEmails(booking, booking.therapistId, booking.patientId, {
          icsContent,
          cancellationLink,
          rescheduleLink,
        });
        
        booking.reminderSent = true;
        await booking.save();
      }

      return NextResponse.json({ message: `Sent reminders for ${upcomingBookings.length} bookings.` });
    }
    ```

## 6. Testing Strategy

- **Unit Tests:** Mock `resend.emails.send`, `getTranslations`, `createIcsFile`, and token generation utilities to verify correct parameters, attachments, and link generation.
- **Integration Tests:** Create bookings with different locales, verify that emails are received with the correct language, attached `.ics` files, and functional cancellation/reschedule links. Test cancellation and reschedule flows end-to-end.
- **Cron Job Testing:** Deploy and monitor logs, checking that reminders for bookings with different locales are processed correctly, including attachments and links.
