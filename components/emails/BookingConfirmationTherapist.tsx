import * as React from 'react';
import { Html, Head, Preview, Body, Container, Text } from '@react-email/components';

interface BookingConfirmationTherapistEmailProps {
  t: (key: string, params?: object) => string; // Translation function
  patientName: string;
  bookingDate: string;
  bookingTime: string;
}

export const BookingConfirmationTherapistEmail: React.FC<Readonly<BookingConfirmationTherapistEmailProps>> = ({
  t,
  patientName,
  bookingDate,
  bookingTime,
}) => (
  <Html>
    <Head />
    <Preview>{t('bookingConfirmationTherapist.preview')}</Preview>
    <Body>
      <Container>
        <Text>{t('common.dearTherapist')},</Text>
        <Text>
          {t('bookingConfirmationTherapist.body', { patientName, bookingDate, bookingTime })}
        </Text>
        <Text>{t('common.regards')}</Text>
      </Container>
    </Body>
  </Html>
);
