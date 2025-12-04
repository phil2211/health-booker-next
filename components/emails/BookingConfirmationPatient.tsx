import * as React from 'react';
import { Html, Head, Preview, Body, Container, Text, Link } from '@react-email/components';

interface BookingConfirmationPatientEmailProps {
  t: (key: string, params?: object) => string; // Translation function
  therapistName: string;
  patientName: string;
  bookingDate: string;
  bookingTime: string;
  cancellationLink: string;
  termsLink: string;
}

export const BookingConfirmationPatientEmail: React.FC<Readonly<BookingConfirmationPatientEmailProps>> = ({
  t,
  therapistName,
  patientName,
  bookingDate,
  bookingTime,
  cancellationLink,
  termsLink,
}) => (
  <Html>
    <Head />
    <Preview>{t('bookingConfirmation.preview')}</Preview>
    <Body>
      <Container>
        <Text>{t('common.dear', { name: patientName })},</Text>
        <Text>
          {t('bookingConfirmation.body', { therapistName, bookingDate, bookingTime })}
        </Text>
        <Text>
          {t('bookingConfirmation.rescheduleExplanation')}
        </Text>
        <Text>
          {t('bookingConfirmation.cancellationPolicy')}
        </Text>
        <Text>
          <Link href={cancellationLink}>{t('bookingConfirmation.cancelAppointment')}</Link>
        </Text>
        <Text>
          <Link href={termsLink}>{t('common.termsOfUse')}</Link>
        </Text>
        <Text>{t('common.regards')}</Text>
      </Container>
    </Body>
  </Html>
);
