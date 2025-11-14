import * as React from 'react';
import { Html, Head, Preview, Body, Container, Text } from '@react-email/components';

interface CancellationNotificationEmailProps {
  t: (key: string, params?: object) => string; // Translation function
  recipientName: string;
  therapistName: string;
  patientName: string;
  bookingDate: string;
  bookingTime: string;
}

export const CancellationNotificationEmail: React.FC<Readonly<CancellationNotificationEmailProps>> = ({
  t,
  recipientName,
  therapistName,
  patientName,
  bookingDate,
  bookingTime,
}) => (
  <Html>
    <Head />
    <Preview>{t('cancellationNotification.preview')}</Preview>
    <Body>
      <Container>
        <Text>{t('common.dear', { name: recipientName })},</Text>
        <Text>
          {t('cancellationNotification.body', { therapistName, patientName, bookingDate, bookingTime })}
        </Text>
        <Text>{t('common.regards')}</Text>
      </Container>
    </Body>
  </Html>
);
