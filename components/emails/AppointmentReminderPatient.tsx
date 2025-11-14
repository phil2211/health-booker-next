import * as React from 'react';
import { Html, Head, Preview, Body, Container, Text, Link } from '@react-email/components';

interface AppointmentReminderPatientEmailProps {
  t: (key: string, params?: object) => string; // Translation function
  therapistName: string;
  bookingDate: string;
  bookingTime: string;
  cancellationLink: string;
  rescheduleLink: string;
}

export const AppointmentReminderPatientEmail: React.FC<Readonly<AppointmentReminderPatientEmailProps>> = ({
  t,
  therapistName,
  bookingDate,
  bookingTime,
  cancellationLink,
  rescheduleLink,
}) => (
  <Html>
    <Head />
    <Preview>{t('appointmentReminder.preview')}</Preview>
    <Body>
      <Container>
        <Text>{t('common.dearPatient')},</Text>
        <Text>
          {t('appointmentReminder.body', { therapistName, bookingDate, bookingTime })}
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
