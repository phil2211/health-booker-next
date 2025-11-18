/**
 * Common utilities for email functionality
 */

import * as React from 'react';
import { render } from '@react-email/render';
import { getTranslations } from '@/lib/i18n/server';
import { type Locale, defaultLocale, locales } from '@/lib/i18n';
import { createIcsFile } from '@/lib/utils/calendar';
import { Booking, Therapist, Patient } from '@/lib/types';

// Helper function to validate and normalize locale
export function getValidLocale(locale?: string): Locale {
  if (locale && locales.includes(locale as Locale)) {
    return locale as Locale;
  }
  return defaultLocale;
}

/**
 * Common email setup data and utilities
 */
export interface EmailSetupData {
  locale: Locale;
  t: any; // Translation function
  icsContent?: Buffer;
  cancellationLink?: string;
  rescheduleLink?: string;
}

/**
 * Setup common email data including locale, translations, and optional ICS/calendar data
 */
export async function setupEmailData(
  booking: Booking,
  therapist?: Therapist,
  includeCalendar: boolean = false,
  includeLinks: boolean = false
): Promise<EmailSetupData> {
  const locale = getValidLocale(booking.locale);
  const t = await getTranslations(locale);

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
  if (!baseUrl) {
    throw new Error('NEXT_PUBLIC_BASE_URL is not configured');
  }

  const setupData: EmailSetupData = {
    locale,
    t,
  };

  if (includeCalendar && therapist) {
    setupData.icsContent = Buffer.from(createIcsFile({
      start: new Date(booking.appointmentDate + 'T' + booking.startTime),
      end: new Date(booking.appointmentDate + 'T' + booking.endTime),
      title: t('calendar.appointmentTitle', { therapistName: therapist.name }),
      description: t('calendar.appointmentDescription'),
      location: 'Online',
    }));
  }

  if (includeLinks) {
    setupData.cancellationLink = `${baseUrl}/cancel/${booking.cancellationToken}`;
    setupData.rescheduleLink = `${baseUrl}/reschedule/${booking.cancellationToken}`;
  }

  return setupData;
}

/**
 * Common email sending configuration
 */
export interface EmailConfig {
  from: string;
  to: string;
  subject: string;
  html: string;
  attachments?: Array<{
    filename: string;
    content: Buffer;
  }>;
}

/**
 * Generate email HTML from React component
 */
export async function generateEmailHtml(component: React.ReactElement): Promise<string> {
  return await render(component);
}

/**
 * Get common email configuration validation
 */
export function validateEmailConfig(): { fromEmail: string } {
  const fromEmail = process.env.RESEND_FROM_EMAIL;
  if (!fromEmail) {
    throw new Error('RESEND_FROM_EMAIL is not configured');
  }
  return { fromEmail };
}
