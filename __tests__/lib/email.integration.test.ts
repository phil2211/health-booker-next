/**
 * Integration tests for email sending functionality using real Resend API
 *
 * IMPORTANT: These tests send real emails and require valid API credentials.
 * They are disabled by default and only run when RUN_EMAIL_INTEGRATION=true.
 *
 * To run these tests:
 * 1. Set up real environment variables:
 *    export RESEND_API_KEY="re_xxxxxxxxxxxxxxxx"
 *    export RESEND_FROM_EMAIL="your-verified-email@example.com"
 *    export NEXT_PUBLIC_BASE_URL="https://your-app-url.com"
 *    export TEST_RECIPIENT_EMAIL="test-recipient@example.com"
 *
 * 2. Enable integration tests:
 *    export RUN_EMAIL_INTEGRATION=true
 *
 * 3. Run tests:
 *    npm test -- __tests__/lib/email.integration.test.ts
 *
 * Note: This will send real emails to TEST_RECIPIENT_EMAIL!
 */

import { Booking, Therapist, Patient, BookingStatus } from '@/lib/types';

// Only run these tests if explicitly enabled
const RUN_INTEGRATION = process.env.RUN_EMAIL_INTEGRATION === 'true';

if (!RUN_INTEGRATION) {
  describe.skip('Email Integration Tests (Skipped)', () => {
    test('Integration tests are disabled by default', () => {
      console.log('💡 Email integration tests are disabled. Set RUN_EMAIL_INTEGRATION=true to enable them.');
    });
  });
} else {
  // Check if required environment variables are set
  if (!process.env.RESEND_API_KEY) {
    throw new Error('RESEND_API_KEY environment variable is required for integration tests');
  }

  if (!process.env.RESEND_FROM_EMAIL) {
    throw new Error('RESEND_FROM_EMAIL environment variable is required for integration tests');
  }

  if (!process.env.TEST_RECIPIENT_EMAIL) {
    throw new Error('TEST_RECIPIENT_EMAIL environment variable is required for integration tests');
  }

  // Import email functions only when integration tests are enabled
  let sendBookingConfirmationEmails: any;
  let sendCancellationEmail: any;
  let sendRescheduleEmail: any;
  let sendReminderEmails: any;

  const testRecipientEmail = process.env.TEST_RECIPIENT_EMAIL;

  const mockBooking: Booking = {
    _id: 'booking-123',
    therapistId: 'therapist-123',
    patientName: 'John Doe',
    patientEmail: testRecipientEmail,
    patientPhone: '+1234567890',
    appointmentDate: '2024-12-15',
    startTime: '10:00',
    endTime: '11:00',
    status: BookingStatus.CONFIRMED,
    cancellationToken: 'cancel-token-abc123',
    locale: 'en',
    reminderSent: false,
  };

  const mockTherapist: Therapist = {
    _id: 'therapist-123',
    email: testRecipientEmail,
    password: 'hashed-password',
    name: 'Dr. Jane Smith',
    specialization: 'Physical Therapy',
    bio: 'Experienced therapist',
    weeklyAvailability: [],
    blockedSlots: [],
  };

  const mockPatient: Patient = {
    _id: 'patient-123',
    name: 'John Doe',
    email: testRecipientEmail,
    phone: '+1234567890',
  };

  describe('Email Integration Tests (Real Resend API)', () => {
    beforeAll(async () => {
      console.log('\n🚨 RUNNING INTEGRATION TESTS WITH REAL RESEND API 🚨');
      console.log(`📧 Emails will be sent to: ${testRecipientEmail}`);
      console.log(`🔑 Using API key: ${process.env.RESEND_API_KEY ? `${process.env.RESEND_API_KEY.substring(0, 10)}...` : 'NOT SET'}`);
      console.log('💰 This may incur real costs!\n');

      // Import email functions - Resend will be initialized with real API key
      const emailModule = await import('@/lib/email');
      sendBookingConfirmationEmails = emailModule.sendBookingConfirmationEmails;
      sendCancellationEmail = emailModule.sendCancellationEmail;
      sendRescheduleEmail = emailModule.sendRescheduleEmail;
      sendReminderEmails = emailModule.sendReminderEmails;
    });

    describe('sendBookingConfirmationEmails', () => {
      test('should send real confirmation emails to both patient and therapist', async () => {
        const result = await sendBookingConfirmationEmails(mockBooking, mockTherapist, mockPatient);

        expect(result).toBeDefined();
        expect(result.patientEmail).toBeDefined();
        expect(result.therapistEmail).toBeDefined();
        expect(result.patientEmail.data?.id).toBeDefined();
        expect(result.therapistEmail.data?.id).toBeDefined();

        console.log(`✅ Patient email sent - ID: ${result.patientEmail.data?.id}`);
        console.log(`✅ Therapist email sent - ID: ${result.therapistEmail.data?.id}`);
      });
    });

    describe('sendCancellationEmail', () => {
      test('should send real cancellation emails to both patient and therapist', async () => {
        const result = await sendCancellationEmail(mockBooking, mockTherapist, mockPatient);

        expect(result).toBeDefined();
        expect(result.patientEmail.data?.id).toBeDefined();
        expect(result.therapistEmail.data?.id).toBeDefined();

        console.log(`✅ Cancellation email to patient sent - ID: ${result.patientEmail.data?.id}`);
        console.log(`✅ Cancellation email to therapist sent - ID: ${result.therapistEmail.data?.id}`);
      });
    });

    describe('sendRescheduleEmail', () => {
      test('should send real reschedule emails to both patient and therapist', async () => {
        const result = await sendRescheduleEmail(mockBooking, mockTherapist, mockPatient);

        expect(result).toBeDefined();
        expect(result.patientEmail.data?.id).toBeDefined();
        expect(result.therapistEmail.data?.id).toBeDefined();

        console.log(`✅ Reschedule email to patient sent - ID: ${result.patientEmail.data?.id}`);
        console.log(`✅ Reschedule email to therapist sent - ID: ${result.therapistEmail.data?.id}`);
      });
    });

    describe('sendReminderEmails', () => {
      test('should send real reminder emails to both patient and therapist', async () => {
        const result = await sendReminderEmails(mockBooking, mockTherapist, mockPatient);

        expect(result).toBeDefined();
        expect(result.patientEmail.data?.id).toBeDefined();
        expect(result.therapistEmail.data?.id).toBeDefined();

        console.log(`✅ Reminder email to patient sent - ID: ${result.patientEmail.data?.id}`);
        console.log(`✅ Reminder email to therapist sent - ID: ${result.therapistEmail.data?.id}`);
      });
    });

    describe('Error Handling', () => {
      test('should handle API errors gracefully', async () => {
        // Test with invalid booking data to trigger potential errors
        const invalidBooking = { ...mockBooking, patientEmail: 'invalid-email' };

        // The function should still complete (though the email may fail)
        await expect(
          sendBookingConfirmationEmails(invalidBooking, mockTherapist, mockPatient)
        ).resolves.not.toThrow();
      });
    });
  });
}
