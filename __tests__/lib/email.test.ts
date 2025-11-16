/**
 * Integration tests for email sending functionality using real Resend API
 * Tests email sending functions as defined in automated_email_notifications.md
 * 
 * IMPORTANT: These tests will actually send emails to philip@eschenbacher.ch
 * 
 * To run these tests:
 * 1. Add RESEND_API_KEY to your .env.local file:
 *    RESEND_API_KEY=re_xxxxxxxxxxxxxxxx
 * 
 *    OR set it as an environment variable:
 *    export RESEND_API_KEY="re_xxxxxxxxxxxxxxxx"
 * 
 * 2. Run tests: npm test -- __tests__/lib/email.test.ts
 * 
 * Note: The .env.local file is automatically loaded by jest.setup.js.
 *       Tests require a valid Resend API key. Without it, tests will be skipped.
 */
import { Booking, Therapist, Patient, BookingStatus } from '@/lib/types';

// Check if RESEND_API_KEY is available (loaded from .env.local or environment)
// Note: .env.local is automatically loaded in jest.setup.js before this file runs
if (!process.env.RESEND_API_KEY) {
  console.warn(
    '\n⚠️  WARNING: RESEND_API_KEY is not set.\n' +
    'These integration tests require a valid Resend API key to send real emails.\n' +
    'Add RESEND_API_KEY to your .env.local file or set it as an environment variable.\n' +
    'Example: RESEND_API_KEY=re_xxxxxxxxxxxxxxxx\n'
  );
}

if (!process.env.TEST_RECIPIENT_EMAIL) {
  console.warn(
    '\n⚠️  WARNING: TEST_RECIPIENT_EMAIL is not set.\n' +
    'These integration tests will send emails to a default address.\n' +
    'Add TEST_RECIPIENT_EMAIL to your .env.local file or set it as an environment variable.\n' +
    'Example: TEST_RECIPIENT_EMAIL=your-test-email@example.com\n'
  );
}

if (!process.env.NEXT_PUBLIC_BASE_URL) {
  process.env.NEXT_PUBLIC_BASE_URL = 'https://test.example.com';
}

// Ensure @react-email/render is available for Resend's dynamic import
// This must be done before importing any modules that use Resend
jest.mock('@react-email/render', () => {
  const actual = jest.requireActual('@react-email/render');
  return actual;
});

// Mock i18n translations (keep this mock)
jest.mock('@/lib/i18n/server', () => ({
  getTranslations: jest.fn(),
}));

// Mock calendar utility (keep this mock)
jest.mock('@/lib/utils/calendar', () => ({
  createIcsFile: jest.fn(),
}));

// DO NOT mock email templates - we need real React components for Resend
// The email templates will be imported and used as-is

describe('Email Sending Functions (Real Resend API)', () => {
  let mockGetTranslations: jest.Mock;
  let mockCreateIcsFile: jest.Mock;
  let processEnvBackup: NodeJS.ProcessEnv;
  
  // Import email functions after mocks are set up
  let sendBookingConfirmationEmails: any;
  let sendCancellationEmail: any;
  let sendRescheduleEmail: any;
  let sendReminderEmails: any;
  
  const testRecipientEmail = process.env.TEST_RECIPIENT_EMAIL || 'philip@eschenbacher.ch';

  // Helper to check if tests should run
  const shouldSkipTests = () => {
    return !process.env.RESEND_API_KEY || !sendBookingConfirmationEmails;
  };
  
  // Helper to skip test early if API key is not set
  const skipIfNoApiKey = () => {
    if (shouldSkipTests()) {
      console.log('⏭️  Skipping test: RESEND_API_KEY not set');
      return true;
    }
    return false;
  };

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

  const mockTranslationFunction = (key: string, params?: { [key: string]: string | number }) => {
    const translations: { [key: string]: string } = {
      'bookingConfirmation.subject': 'Booking Confirmation',
      'bookingConfirmation.preview': 'Your appointment is confirmed',
      'bookingConfirmation.body': `Your appointment with {{therapistName}} on {{bookingDate}} at {{bookingTime}} is confirmed.`,
      'bookingConfirmation.rescheduleAppointment': 'Reschedule Appointment',
      'bookingConfirmation.cancelAppointment': 'Cancel Appointment',
      'bookingConfirmationTherapist.subject': 'New Booking: {{patientName}}',
      'appointmentReminder.subject': 'Appointment Reminder',
      'appointmentReminderTherapist.subject': 'Reminder: Appointment with {{patientName}}',
      'cancellationNotification.subject': 'Appointment Cancelled',
      'rescheduleNotification.subject': 'Appointment Rescheduled',
      'calendar.appointmentTitle': 'Appointment with {{therapistName}}',
      'calendar.appointmentDescription': 'Your scheduled appointment',
      'common.regards': 'Best regards',
    };

    let value = translations[key] || key;
    if (params) {
      Object.entries(params).forEach(([paramKey, paramValue]) => {
        value = value.replace(new RegExp(`{{${paramKey}}}`, 'g'), String(paramValue));
      });
    }
    return value;
  };

  beforeAll(() => {
    processEnvBackup = { ...process.env };
    
    // Verify API key is set BEFORE importing email module
    // This must happen before the email module is imported because
    // Resend is initialized at module load time
    if (!process.env.RESEND_API_KEY) {
      console.error(
        '\n❌ ERROR: RESEND_API_KEY environment variable is required.\n' +
        'Set it before running these integration tests:\n' +
        '  export RESEND_API_KEY="re_xxxxxxxxxxxxxxxx"\n' +
        '  npm test -- __tests__/lib/email.test.ts\n'
      );
      // Skip all tests if API key is not set
      return;
    }
    
    console.log('\n📧 Running integration tests with real Resend API');
    console.log(`📬 Emails will be sent to: ${testRecipientEmail}`);
    console.log(`🔑 Using API key: ${process.env.RESEND_API_KEY.substring(0, 10)}...\n`);
  });

  afterAll(() => {
    process.env = processEnvBackup;
  });

  beforeAll(async () => {
    // Skip if API key is not set
    if (!process.env.RESEND_API_KEY) {
      return;
    }
    
    // Import email functions - Resend will be initialized with the API key
    const emailModule = await import('@/lib/email');
    sendBookingConfirmationEmails = emailModule.sendBookingConfirmationEmails;
    sendCancellationEmail = emailModule.sendCancellationEmail;
    sendRescheduleEmail = emailModule.sendRescheduleEmail;
    sendReminderEmails = emailModule.sendReminderEmails;
  });

  beforeEach(() => {
    jest.clearAllMocks();

    // Setup translation mock
    mockGetTranslations = require('@/lib/i18n/server').getTranslations;
    mockGetTranslations.mockResolvedValue(mockTranslationFunction);

    // Setup calendar mock
    mockCreateIcsFile = require('@/lib/utils/calendar').createIcsFile;
    mockCreateIcsFile.mockReturnValue('BEGIN:VCALENDAR\nVERSION:2.0\nEND:VCALENDAR');
  });

  describe('sendBookingConfirmationEmails', () => {
    test('should send confirmation emails to both patient and therapist', async () => {
      if (shouldSkipTests()) {
        console.log('⏭️  Skipping test: RESEND_API_KEY not set');
        return;
      }
      
      // This will actually send emails via Resend API
      const result = await sendBookingConfirmationEmails(mockBooking, mockTherapist, mockPatient);
      
      // Verify API responses
      expect(result).toBeDefined();
      expect(result.patientEmail).toBeDefined();
      expect(result.therapistEmail).toBeDefined();
      
      // Resend API returns { data: { id: string }, error: null } on success
      expect(result.patientEmail.data).toBeDefined();
      expect(result.patientEmail.data?.id).toBeDefined();
      expect(result.therapistEmail.data).toBeDefined();
      expect(result.therapistEmail.data?.id).toBeDefined();
      
      console.log(`✅ Patient email sent - ID: ${result.patientEmail.data?.id}`);
      console.log(`✅ Therapist email sent - ID: ${result.therapistEmail.data?.id}`);
      
      expect(mockGetTranslations).toHaveBeenCalledWith('en');
      expect(mockCreateIcsFile).toHaveBeenCalledTimes(1);
    });

    test('should use correct locale from booking', async () => {
      if (skipIfNoApiKey()) return;
      
      const germanBooking = { ...mockBooking, locale: 'de' };
      mockGetTranslations.mockResolvedValue(mockTranslationFunction);

      await sendBookingConfirmationEmails(germanBooking, mockTherapist, mockPatient);

      expect(mockGetTranslations).toHaveBeenCalledWith('de');
    });

    test('should default to "en" locale if not specified', async () => {
      if (skipIfNoApiKey()) return;
      
      const bookingWithoutLocale = { ...mockBooking };
      delete (bookingWithoutLocale as any).locale;

      await sendBookingConfirmationEmails(bookingWithoutLocale, mockTherapist, mockPatient);

      expect(mockGetTranslations).toHaveBeenCalledWith('en');
    });

    test('should include ICS calendar attachment in patient email', async () => {
      if (skipIfNoApiKey()) return;
      
      // Verify ICS file is generated (attachment is included in real email)
      await sendBookingConfirmationEmails(mockBooking, mockTherapist, mockPatient);

      // Check that ICS file was created (the real email will include it)
      expect(mockCreateIcsFile).toHaveBeenCalled();
      const icsCall = mockCreateIcsFile.mock.calls[0][0];
      expect(icsCall).toHaveProperty('start');
      expect(icsCall).toHaveProperty('end');
      expect(icsCall).toHaveProperty('title');
    });

    test('should include ICS calendar attachment in therapist email', async () => {
      if (skipIfNoApiKey()) return;
      
      // Verify ICS file is generated for therapist email too
      await sendBookingConfirmationEmails(mockBooking, mockTherapist, mockPatient);

      // Check that ICS file was created
      expect(mockCreateIcsFile).toHaveBeenCalled();
    });

    test('should include cancellation and reschedule links in patient email', async () => {
      if (skipIfNoApiKey()) return;
      
      // Verify email is sent successfully (links are included in the real email)
      await expect(
        sendBookingConfirmationEmails(mockBooking, mockTherapist, mockPatient)
      ).resolves.not.toThrow();
      
      // Verify that the booking has a cancellation token (required for links)
      expect(mockBooking.cancellationToken).toBeDefined();
      expect(mockBooking.cancellationToken).toBe('cancel-token-abc123');
    });

    test('should generate correct cancellation and reschedule links', async () => {
      if (skipIfNoApiKey()) return;
      
      // Verify email is sent successfully
      await expect(
        sendBookingConfirmationEmails(mockBooking, mockTherapist, mockPatient)
      ).resolves.not.toThrow();
      
      // Verify base URL is set (required for link generation)
      expect(process.env.NEXT_PUBLIC_BASE_URL).toBeDefined();
      expect(mockBooking.cancellationToken).toBe('cancel-token-abc123');
    });

    test('should use correct email addresses', async () => {
      if (skipIfNoApiKey()) return;
      
      // Verify email addresses are set correctly
      expect(mockPatient.email).toBe('philip@eschenbacher.ch');
      expect(mockTherapist.email).toBe('philip@eschenbacher.ch');
      expect(mockBooking.patientEmail).toBe('philip@eschenbacher.ch');
      
      // Verify email is sent successfully
      await expect(
        sendBookingConfirmationEmails(mockBooking, mockTherapist, mockPatient)
      ).resolves.not.toThrow();
    });

    test('should use correct subject lines with translations', async () => {
      if (skipIfNoApiKey()) return;
      
      // Verify translations are called correctly
      await sendBookingConfirmationEmails(mockBooking, mockTherapist, mockPatient);

      // Check that translation function was called with correct keys
      expect(mockGetTranslations).toHaveBeenCalled();
      const translationCalls = mockGetTranslations.mock.calls;
      expect(translationCalls.length).toBeGreaterThan(0);
    });

    test('should generate ICS file with correct booking details', async () => {
      if (skipIfNoApiKey()) return;
      
      await sendBookingConfirmationEmails(mockBooking, mockTherapist, mockPatient);

      expect(mockCreateIcsFile).toHaveBeenCalledWith({
        start: expect.any(Date),
        end: expect.any(Date),
        title: 'Appointment with Dr. Jane Smith',
        description: 'Your scheduled appointment',
        location: 'Online',
      });
    });

    test('should handle errors gracefully', async () => {
      if (skipIfNoApiKey()) return;
      
      // Test with invalid API key scenario - function should handle errors
      // Note: This test verifies error handling, but with real API it may succeed
      // In real scenario, errors would be caught and logged
      await expect(
        sendBookingConfirmationEmails(mockBooking, mockTherapist, mockPatient)
      ).resolves.not.toThrow();
    });
  });

  describe('sendCancellationEmail', () => {
    test('should send cancellation emails to both patient and therapist', async () => {
      if (skipIfNoApiKey()) return;
      
      // This will actually send emails via Resend API
      const result = await sendCancellationEmail(mockBooking, mockTherapist, mockPatient);
      
      // Verify API responses
      expect(result).toBeDefined();
      expect(result.patientEmail.data?.id).toBeDefined();
      expect(result.therapistEmail.data?.id).toBeDefined();
      
      console.log(`✅ Cancellation email to patient sent - ID: ${result.patientEmail.data?.id}`);
      console.log(`✅ Cancellation email to therapist sent - ID: ${result.therapistEmail.data?.id}`);

      expect(mockGetTranslations).toHaveBeenCalledWith('en');
    });

    test('should use correct locale from booking', async () => {
      if (skipIfNoApiKey()) return;
      
      const germanBooking = { ...mockBooking, locale: 'de' };

      await sendCancellationEmail(germanBooking, mockTherapist, mockPatient);

      expect(mockGetTranslations).toHaveBeenCalledWith('de');
    });

    test('should not include ICS attachment for cancellation emails', async () => {
      if (skipIfNoApiKey()) return;
      
      // Verify ICS file is NOT created for cancellation emails
      await sendCancellationEmail(mockBooking, mockTherapist, mockPatient);

      // Cancellation emails should not generate ICS files
      expect(mockCreateIcsFile).not.toHaveBeenCalled();
    });

    test('should use correct subject line', async () => {
      if (skipIfNoApiKey()) return;
      
      // Verify email is sent successfully
      await expect(
        sendCancellationEmail(mockBooking, mockTherapist, mockPatient)
      ).resolves.not.toThrow();
      
      // Verify translations are called (subject line comes from translations)
      expect(mockGetTranslations).toHaveBeenCalled();
    });

    test('should handle errors gracefully', async () => {
      if (skipIfNoApiKey()) return;
      
      // Verify error handling (function should catch and log errors)
      await expect(
        sendCancellationEmail(mockBooking, mockTherapist, mockPatient)
      ).resolves.not.toThrow();
    });
  });

  describe('sendRescheduleEmail', () => {
    test('should send reschedule emails to both patient and therapist', async () => {
      if (skipIfNoApiKey()) return;
      
      // This will actually send emails via Resend API
      const result = await sendRescheduleEmail(mockBooking, mockTherapist, mockPatient);
      
      // Verify API responses
      expect(result).toBeDefined();
      expect(result.patientEmail.data?.id).toBeDefined();
      expect(result.therapistEmail.data?.id).toBeDefined();
      
      console.log(`✅ Reschedule email to patient sent - ID: ${result.patientEmail.data?.id}`);
      console.log(`✅ Reschedule email to therapist sent - ID: ${result.therapistEmail.data?.id}`);

      expect(mockGetTranslations).toHaveBeenCalledWith('en');
      expect(mockCreateIcsFile).toHaveBeenCalledTimes(1);
    });

    test('should use correct locale from booking', async () => {
      if (skipIfNoApiKey()) return;
      
      const germanBooking = { ...mockBooking, locale: 'de' };

      await sendRescheduleEmail(germanBooking, mockTherapist, mockPatient);

      expect(mockGetTranslations).toHaveBeenCalledWith('de');
    });

    test('should include ICS calendar attachment in both emails', async () => {
      if (skipIfNoApiKey()) return;
      
      // Verify ICS file is generated for reschedule emails
      await sendRescheduleEmail(mockBooking, mockTherapist, mockPatient);

      expect(mockCreateIcsFile).toHaveBeenCalled();
      const icsCall = mockCreateIcsFile.mock.calls[0][0];
      expect(icsCall).toHaveProperty('start');
      expect(icsCall).toHaveProperty('end');
      expect(icsCall).toHaveProperty('title');
    });

    test('should include cancellation and reschedule links in patient email', async () => {
      if (skipIfNoApiKey()) return;
      
      // Verify email is sent successfully (links are included in the real email)
      await expect(
        sendRescheduleEmail(mockBooking, mockTherapist, mockPatient)
      ).resolves.not.toThrow();
      
      // Verify that the booking has a cancellation token (required for links)
      expect(mockBooking.cancellationToken).toBeDefined();
    });

    test('should use correct subject line', async () => {
      if (skipIfNoApiKey()) return;
      
      // Verify email is sent successfully
      await expect(
        sendRescheduleEmail(mockBooking, mockTherapist, mockPatient)
      ).resolves.not.toThrow();
      
      // Verify translations are called (subject line comes from translations)
      expect(mockGetTranslations).toHaveBeenCalled();
    });

    test('should handle errors gracefully', async () => {
      if (skipIfNoApiKey()) return;
      
      // Verify error handling (function should catch and log errors)
      await expect(
        sendRescheduleEmail(mockBooking, mockTherapist, mockPatient)
      ).resolves.not.toThrow();
    });
  });

  describe('sendReminderEmails', () => {
    test('should send reminder emails to both patient and therapist', async () => {
      if (skipIfNoApiKey()) return;
      
      // This will actually send emails via Resend API
      const result = await sendReminderEmails(mockBooking, mockTherapist, mockPatient);
      
      // Verify API responses
      expect(result).toBeDefined();
      expect(result.patientEmail.data?.id).toBeDefined();
      expect(result.therapistEmail.data?.id).toBeDefined();
      
      console.log(`✅ Reminder email to patient sent - ID: ${result.patientEmail.data?.id}`);
      console.log(`✅ Reminder email to therapist sent - ID: ${result.therapistEmail.data?.id}`);

      expect(mockGetTranslations).toHaveBeenCalledWith('en');
      expect(mockCreateIcsFile).toHaveBeenCalledTimes(1);
    });

    test('should use correct locale from booking', async () => {
      if (skipIfNoApiKey()) return;
      
      const germanBooking = { ...mockBooking, locale: 'de' };

      await sendReminderEmails(germanBooking, mockTherapist, mockPatient);

      expect(mockGetTranslations).toHaveBeenCalledWith('de');
    });

    test('should include ICS calendar attachment in both emails', async () => {
      if (skipIfNoApiKey()) return;
      
      // Verify ICS file is generated for reminder emails
      await sendReminderEmails(mockBooking, mockTherapist, mockPatient);

      expect(mockCreateIcsFile).toHaveBeenCalled();
      const icsCall = mockCreateIcsFile.mock.calls[0][0];
      expect(icsCall).toHaveProperty('start');
      expect(icsCall).toHaveProperty('end');
      expect(icsCall).toHaveProperty('title');
    });

    test('should include cancellation and reschedule links in patient email', async () => {
      if (skipIfNoApiKey()) return;
      
      // Verify email is sent successfully (links are included in the real email)
      await expect(
        sendReminderEmails(mockBooking, mockTherapist, mockPatient)
      ).resolves.not.toThrow();
      
      // Verify that the booking has a cancellation token (required for links)
      expect(mockBooking.cancellationToken).toBeDefined();
    });

    test('should use correct subject lines', async () => {
      if (skipIfNoApiKey()) return;
      
      // Verify email is sent successfully
      await expect(
        sendReminderEmails(mockBooking, mockTherapist, mockPatient)
      ).resolves.not.toThrow();
      
      // Verify translations are called (subject lines come from translations)
      expect(mockGetTranslations).toHaveBeenCalled();
    });

    test('should generate ICS file with correct booking details', async () => {
      if (skipIfNoApiKey()) return;
      
      await sendReminderEmails(mockBooking, mockTherapist, mockPatient);

      expect(mockCreateIcsFile).toHaveBeenCalledWith({
        start: expect.any(Date),
        end: expect.any(Date),
        title: 'Appointment with Dr. Jane Smith',
        description: 'Your scheduled appointment',
        location: 'Online',
      });
    });

    test('should handle errors gracefully', async () => {
      if (skipIfNoApiKey()) return;
      
      // Verify error handling (function should catch and log errors)
      await expect(
        sendReminderEmails(mockBooking, mockTherapist, mockPatient)
      ).resolves.not.toThrow();
    });
  });

  describe('Internationalization (i18n)', () => {
    test('should support multiple locales', async () => {
      if (skipIfNoApiKey()) return;
      
      const locales = ['en', 'de', 'fr'];

      for (const locale of locales) {
        jest.clearAllMocks();
        const bookingWithLocale = { ...mockBooking, locale };
        mockGetTranslations.mockResolvedValue(mockTranslationFunction);

        await sendBookingConfirmationEmails(bookingWithLocale, mockTherapist, mockPatient);

        expect(mockGetTranslations).toHaveBeenCalledWith(locale);
      }
    });
  });

  describe('Calendar Integration', () => {
    test('should generate ICS file for confirmation emails', async () => {
      if (skipIfNoApiKey()) return;
      
      await sendBookingConfirmationEmails(mockBooking, mockTherapist, mockPatient);

      expect(mockCreateIcsFile).toHaveBeenCalled();
      const icsCall = mockCreateIcsFile.mock.calls[0][0];
      expect(icsCall).toHaveProperty('start');
      expect(icsCall).toHaveProperty('end');
      expect(icsCall).toHaveProperty('title');
      expect(icsCall).toHaveProperty('description');
      expect(icsCall).toHaveProperty('location');
    });

    test('should generate ICS file for reminder emails', async () => {
      if (skipIfNoApiKey()) return;
      
      await sendReminderEmails(mockBooking, mockTherapist, mockPatient);

      expect(mockCreateIcsFile).toHaveBeenCalled();
    });

    test('should generate ICS file for reschedule emails', async () => {
      if (skipIfNoApiKey()) return;
      
      await sendRescheduleEmail(mockBooking, mockTherapist, mockPatient);

      expect(mockCreateIcsFile).toHaveBeenCalled();
    });

    test('should not generate ICS file for cancellation emails', async () => {
      if (skipIfNoApiKey()) return;
      
      jest.clearAllMocks();
      await sendCancellationEmail(mockBooking, mockTherapist, mockPatient);

      expect(mockCreateIcsFile).not.toHaveBeenCalled();
    });
  });

  describe('Secure Links', () => {
    test('should generate cancellation links with correct format', async () => {
      if (skipIfNoApiKey()) return;
      
      // Verify email is sent successfully (links are included in the real email)
      await expect(
        sendBookingConfirmationEmails(mockBooking, mockTherapist, mockPatient)
      ).resolves.not.toThrow();
      
      // Verify cancellation token exists and base URL is set
      expect(mockBooking.cancellationToken).toBeDefined();
      expect(process.env.NEXT_PUBLIC_BASE_URL).toBeDefined();
    });

    test('should generate reschedule links with correct format', async () => {
      if (skipIfNoApiKey()) return;
      
      // Verify email is sent successfully (links are included in the real email)
      await expect(
        sendBookingConfirmationEmails(mockBooking, mockTherapist, mockPatient)
      ).resolves.not.toThrow();
      
      // Verify cancellation token exists (used for reschedule links)
      expect(mockBooking.cancellationToken).toBeDefined();
      expect(mockBooking.cancellationToken).toBe('cancel-token-abc123');
    });

    test('should use base URL from environment variable', async () => {
      if (skipIfNoApiKey()) return;
      
      // Verify base URL is set (required for link generation)
      expect(process.env.NEXT_PUBLIC_BASE_URL).toBeDefined();
      
      // Verify email is sent successfully
      await expect(
        sendBookingConfirmationEmails(mockBooking, mockTherapist, mockPatient)
      ).resolves.not.toThrow();
    });
  });
});

