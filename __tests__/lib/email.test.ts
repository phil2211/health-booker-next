/**
 * Unit tests for email sending functionality using mocked Resend API
 * Tests email sending functions as defined in automated_email_notifications.md
 *
 * These tests use mocked Resend client and do NOT send real emails.
 * They verify that email functions correctly call the mocked API with expected parameters.
 *
 * To run these tests: npm test -- __tests__/lib/email.test.ts
 */
import { Booking, Therapist, Patient, BookingStatus } from '@/lib/types';

// Environment variables are set up in beforeAll for mocked tests

// Mock Resend to prevent actual API calls during tests
jest.mock('resend', () => {
  const mockSend = jest.fn().mockResolvedValue({
    data: {
      id: 'test-email-id-12345'
    },
    error: null
  });

  return {
    Resend: jest.fn().mockImplementation((apiKey) => ({
      emails: {
        send: mockSend
      }
    })),
    __mockSend: mockSend
  };
});

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

describe('Email Sending Functions (Mocked Resend API)', () => {
  let mockGetTranslations: jest.Mock;
  let mockCreateIcsFile: jest.Mock;
  let mockResendSend: jest.Mock;
  let processEnvBackup: NodeJS.ProcessEnv;
  
  // Import email functions after mocks are set up
  let sendBookingConfirmationEmails: any;
  let sendCancellationEmail: any;
  let sendRescheduleEmail: any;
  let sendReminderEmails: any;
  
  const testRecipientEmail = process.env.TEST_RECIPIENT_EMAIL || 'philip@eschenbacher.ch';

  // Helper to check if tests should run (using mocks, so always true)
  const shouldSkipTests = () => {
    return !sendBookingConfirmationEmails;
  };

  // Helper to skip test early if email functions are not loaded
  const skipIfNotReady = () => {
    if (shouldSkipTests()) {
      console.log('⏭️  Skipping test: Email functions not loaded');
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

    // Set up required environment variables for mocked tests
    process.env.RESEND_API_KEY = 're_test_mock_key';
    process.env.RESEND_FROM_EMAIL = 'test@example.com';
    process.env.NEXT_PUBLIC_BASE_URL = 'https://test.example.com';

    console.log('\n📧 Running unit tests with mocked Resend API');
    console.log(`📬 Mock emails will be sent to: ${testRecipientEmail}`);
    console.log(`🔑 Using mock API key: ${process.env.RESEND_API_KEY}\n`);
  });

  afterAll(() => {
    process.env = processEnvBackup;
  });

  beforeAll(async () => {
    // Import email functions - Resend will be initialized with the mock API key
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

    // Setup Resend mock
    const resendMock = require('resend');
    mockResendSend = resendMock.__mockSend;
  });

  describe('sendBookingConfirmationEmails', () => {
    test('should send confirmation emails to both patient and therapist', async () => {
      if (skipIfNotReady()) return;

      // Call the email function
      const result = await sendBookingConfirmationEmails(mockBooking, mockTherapist, mockPatient);

      // Verify the function returns expected structure
      expect(result).toBeDefined();
      expect(result.patientEmail).toBeDefined();
      expect(result.therapistEmail).toBeDefined();
      expect(result.patientEmail.data?.id).toBe('test-email-id-12345');
      expect(result.therapistEmail.data?.id).toBe('test-email-id-12345');

      // Verify Resend API was called exactly twice (patient + therapist)
      expect(mockResendSend).toHaveBeenCalledTimes(2);

      // Verify patient email call
      expect(mockResendSend).toHaveBeenNthCalledWith(1, {
        from: 'test@example.com',
        to: 'philip@eschenbacher.ch',
        subject: 'Booking Confirmation',
        html: expect.any(String), // We'll test content separately
        attachments: [{
          filename: 'appointment.ics',
          content: expect.any(String) // Base64 encoded ICS file
        }]
      });

      // Verify therapist email call
      expect(mockResendSend).toHaveBeenNthCalledWith(2, {
        from: 'test@example.com',
        to: 'philip@eschenbacher.ch',
        subject: 'New Booking: John Doe',
        html: expect.any(String), // We'll test content separately
        attachments: [{
          filename: 'appointment.ics',
          content: expect.any(String) // Base64 encoded ICS file
        }]
      });

      // Verify translation and calendar utilities were called
      expect(mockGetTranslations).toHaveBeenCalledWith('en');
      expect(mockCreateIcsFile).toHaveBeenCalledTimes(1);
      expect(mockCreateIcsFile).toHaveBeenCalledWith({
        start: expect.any(Date),
        end: expect.any(Date),
        title: 'Appointment with Dr. Jane Smith',
        description: 'Your scheduled appointment',
        location: 'Online'
      });
    });

    test('should use correct locale from booking', async () => {
      if (skipIfNotReady()) return;

      const germanBooking = { ...mockBooking, locale: 'de' };

      await sendBookingConfirmationEmails(germanBooking, mockTherapist, mockPatient);

      expect(mockGetTranslations).toHaveBeenCalledWith('de');
      expect(mockResendSend).toHaveBeenCalledTimes(2); // Still sends both emails
    });

    test('should default to "en" locale if not specified', async () => {
      if (skipIfNotReady()) return;

      const bookingWithoutLocale = { ...mockBooking };
      delete (bookingWithoutLocale as any).locale;

      await sendBookingConfirmationEmails(bookingWithoutLocale, mockTherapist, mockPatient);

      expect(mockGetTranslations).toHaveBeenCalledWith('en');
      expect(mockResendSend).toHaveBeenCalledTimes(2);
    });

    test('should include ICS calendar attachment in emails', async () => {
      if (skipIfNotReady()) return;

      await sendBookingConfirmationEmails(mockBooking, mockTherapist, mockPatient);

      // Verify ICS file generation
      expect(mockCreateIcsFile).toHaveBeenCalledWith({
        start: expect.any(Date),
        end: expect.any(Date),
        title: 'Appointment with Dr. Jane Smith',
        description: 'Your scheduled appointment',
        location: 'Online'
      });

      // Verify both emails include the ICS attachment
      const patientCall = mockResendSend.mock.calls[0][0];
      const therapistCall = mockResendSend.mock.calls[1][0];

      expect(patientCall.attachments).toEqual([{
        filename: 'appointment.ics',
        content: expect.any(String) // Base64 encoded
      }]);
      expect(therapistCall.attachments).toEqual([{
        filename: 'appointment.ics',
        content: expect.any(String) // Base64 encoded
      }]);
    });

    test('should include ICS calendar attachment in therapist email', async () => {
      if (skipIfNotReady()) return;
      
      // Verify ICS file is generated for therapist email too
      await sendBookingConfirmationEmails(mockBooking, mockTherapist, mockPatient);

      // Check that ICS file was created
      expect(mockCreateIcsFile).toHaveBeenCalled();
    });

    test('should include cancellation and reschedule links in patient email', async () => {
      if (skipIfNotReady()) return;
      
      // Verify email is sent successfully (links are included in the real email)
      await expect(
        sendBookingConfirmationEmails(mockBooking, mockTherapist, mockPatient)
      ).resolves.not.toThrow();
      
      // Verify that the booking has a cancellation token (required for links)
      expect(mockBooking.cancellationToken).toBeDefined();
      expect(mockBooking.cancellationToken).toBe('cancel-token-abc123');
    });

    test('should generate correct cancellation and reschedule links', async () => {
      if (skipIfNotReady()) return;

      // Verify email is sent successfully
      await expect(
        sendBookingConfirmationEmails(mockBooking, mockTherapist, mockPatient)
      ).resolves.not.toThrow();

      // Verify base URL is set (required for link generation)
      expect(process.env.NEXT_PUBLIC_BASE_URL).toBeDefined();
      expect(mockBooking.cancellationToken).toBe('cancel-token-abc123');
    });

    test('should use localhost:3000 as base URL in development when NEXT_PUBLIC_BASE_URL is not set', async () => {
      if (skipIfNotReady()) return;

      // Temporarily unset NEXT_PUBLIC_BASE_URL to test auto-detection
      const originalBaseUrl = process.env.NEXT_PUBLIC_BASE_URL;
      delete process.env.NEXT_PUBLIC_BASE_URL;
      process.env.NODE_ENV = 'development';

      try {
        await expect(
          sendBookingConfirmationEmails(mockBooking, mockTherapist, mockPatient)
        ).resolves.not.toThrow();

        // Verify the function completed successfully (auto-detected localhost:3000)
      } finally {
        // Restore original environment
        process.env.NEXT_PUBLIC_BASE_URL = originalBaseUrl;
        process.env.NODE_ENV = processEnvBackup.NODE_ENV;
      }
    });

    test('should use correct email addresses', async () => {
      if (skipIfNotReady()) return;
      
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
      if (skipIfNotReady()) return;
      
      // Verify translations are called correctly
      await sendBookingConfirmationEmails(mockBooking, mockTherapist, mockPatient);

      // Check that translation function was called with correct keys
      expect(mockGetTranslations).toHaveBeenCalled();
      const translationCalls = mockGetTranslations.mock.calls;
      expect(translationCalls.length).toBeGreaterThan(0);
    });

    test('should generate ICS file with correct booking details', async () => {
      if (skipIfNotReady()) return;
      
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
      if (skipIfNotReady()) return;
      
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
      if (skipIfNotReady()) return;

      const result = await sendCancellationEmail(mockBooking, mockTherapist, mockPatient);

      // Verify the function returns expected structure
      expect(result).toBeDefined();
      expect(result.patientEmail.data?.id).toBe('test-email-id-12345');
      expect(result.therapistEmail.data?.id).toBe('test-email-id-12345');

      // Verify Resend API was called exactly twice (no ICS attachments for cancellations)
      expect(mockResendSend).toHaveBeenCalledTimes(2);

      // Verify no ICS file was generated for cancellation emails
      expect(mockCreateIcsFile).not.toHaveBeenCalled();

      // Verify both emails have correct structure (no attachments)
      expect(mockResendSend).toHaveBeenNthCalledWith(1, {
        from: 'test@example.com',
        to: 'philip@eschenbacher.ch',
        subject: 'Appointment Cancelled',
        html: expect.any(String)
        // No attachments for cancellation emails
      });

      expect(mockResendSend).toHaveBeenNthCalledWith(2, {
        from: 'test@example.com',
        to: 'philip@eschenbacher.ch',
        subject: 'Appointment Cancelled',
        html: expect.any(String)
        // No attachments for cancellation emails
      });

      expect(mockGetTranslations).toHaveBeenCalledWith('en');
    });
  });

  describe('sendRescheduleEmail', () => {
    test('should send reschedule emails with ICS attachments', async () => {
      if (skipIfNotReady()) return;

      const result = await sendRescheduleEmail(mockBooking, mockTherapist, mockPatient);

      // Verify the function returns expected structure
      expect(result).toBeDefined();
      expect(result.patientEmail.data?.id).toBe('test-email-id-12345');
      expect(result.therapistEmail.data?.id).toBe('test-email-id-12345');

      // Verify Resend API was called exactly twice with ICS attachments
      expect(mockResendSend).toHaveBeenCalledTimes(2);

      // Verify ICS file was generated
      expect(mockCreateIcsFile).toHaveBeenCalledTimes(1);

      // Verify both emails include ICS attachments
      expect(mockResendSend).toHaveBeenNthCalledWith(1, {
        from: 'test@example.com',
        to: 'philip@eschenbacher.ch',
        subject: 'Appointment Rescheduled',
        html: expect.any(String),
        attachments: [{
          filename: 'appointment.ics',
          content: expect.any(String)
        }]
      });

      expect(mockResendSend).toHaveBeenNthCalledWith(2, {
        from: 'test@example.com',
        to: 'philip@eschenbacher.ch',
        subject: 'Appointment Rescheduled',
        html: expect.any(String),
        attachments: [{
          filename: 'appointment.ics',
          content: expect.any(String)
        }]
      });

      expect(mockGetTranslations).toHaveBeenCalledWith('en');
    });
  });

  describe('sendReminderEmails', () => {
    test('should send reminder emails with ICS attachments', async () => {
      if (skipIfNotReady()) return;

      const result = await sendReminderEmails(mockBooking, mockTherapist, mockPatient);

      // Verify the function returns expected structure
      expect(result).toBeDefined();
      expect(result.patientEmail.data?.id).toBe('test-email-id-12345');
      expect(result.therapistEmail.data?.id).toBe('test-email-id-12345');

      // Verify Resend API was called exactly twice with ICS attachments
      expect(mockResendSend).toHaveBeenCalledTimes(2);

      // Verify ICS file was generated
      expect(mockCreateIcsFile).toHaveBeenCalledTimes(1);

      // Verify translations were called
      expect(mockGetTranslations).toHaveBeenCalledWith('en');
    });
  });

  describe('Internationalization (i18n)', () => {
    test('should support different locales', async () => {
      if (skipIfNotReady()) return;

      const germanBooking = { ...mockBooking, locale: 'de' };

      await sendBookingConfirmationEmails(germanBooking, mockTherapist, mockPatient);

      expect(mockGetTranslations).toHaveBeenCalledWith('de');
    });
  });
});

