import * as React from 'react';
import { Html, Head, Preview, Body, Container, Text, Link } from '@react-email/components';

interface BookingConfirmationPatientEmailProps {
  t: (key: string, params?: object) => string; // Translation function
  therapistName: string;
  bookingDate: string;
  bookingTime: string;
  cancellationLink: string;
}

export const BookingConfirmationPatientEmail: React.FC<Readonly<BookingConfirmationPatientEmailProps>> = ({
  t,
  therapistName,
  bookingDate,
  bookingTime,
  cancellationLink,
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
          {t('bookingConfirmation.rescheduleExplanation')}
        </Text>
        <Text>
          <Link href={cancellationLink}>{t('bookingConfirmation.cancelAppointment')}</Link>
        </Text>
        <Text>{t('common.regards')}</Text>
      </Container>
    </Body>
  </Html>
);
