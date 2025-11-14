import * as React from 'react';
import { Html, Head, Preview, Body, Container, Text } from '@react-email/components';

interface AppointmentReminderTherapistEmailProps {
  t: (key: string, params?: object) => string; // Translation function
  patientName: string;
  bookingDate: string;
  bookingTime: string;
}

export const AppointmentReminderTherapistEmail: React.FC<Readonly<AppointmentReminderTherapistEmailProps>> = ({
  t,
  patientName,
  bookingDate,
  bookingTime,
}) => (
  <Html>
    <Head />
    <Preview>{t('appointmentReminderTherapist.preview')}</Preview>
    <Body>
      <Container>
        <Text>{t('common.dearTherapist')},</Text>
        <Text>
          {t('appointmentReminderTherapist.body', { patientName, bookingDate, bookingTime })}
        </Text>
        <Text>{t('common.regards')}</Text>
      </Container>
    </Body>
  </Html>
);
