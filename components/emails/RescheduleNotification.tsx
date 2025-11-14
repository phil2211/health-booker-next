import * as React from 'react';
import { Html, Head, Preview, Body, Container, Text, Link } from '@react-email/components';

interface RescheduleNotificationEmailProps {
  t: (key: string, params?: object) => string; // Translation function
  recipientName: string;
  therapistName: string;
  patientName: string;
  newBookingDate: string;
  newBookingTime: string;
  cancellationLink: string;
  rescheduleLink: string;
}

export const RescheduleNotificationEmail: React.FC<Readonly<RescheduleNotificationEmailProps>> = ({
  t,
  recipientName,
  therapistName,
  patientName,
  newBookingDate,
  newBookingTime,
  cancellationLink,
  rescheduleLink,
}) => (
  <Html>
    <Head />
    <Preview>{t('rescheduleNotification.preview')}</Preview>
    <Body>
      <Container>
        <Text>{t('common.dear', { name: recipientName })},</Text>
        <Text>
          {t('rescheduleNotification.body', { therapistName, patientName, newBookingDate, newBookingTime })}
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
