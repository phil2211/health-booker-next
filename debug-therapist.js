const { findTherapistById } = require('./models/Therapist');

async function debugTherapist() {
  try {
    const therapist = await findTherapistById('6908c592831c1a170802c4df');
    console.log('=== THERAPIST DEBUG ===');
    console.log('ID:', therapist?._id);
    console.log('Name:', therapist?.name);
    console.log('Weekly Availability:', JSON.stringify(therapist?.weeklyAvailability, null, 2));
    console.log('Blocked Slots:', JSON.stringify(therapist?.blockedSlots, null, 2));

    // Check what day November 24, 2025 is
    const date = new Date('2025-11-24T00:00:00.000Z');
    const dayOfWeek = date.getUTCDay();
    console.log('2025-11-24 day of week:', dayOfWeek);

    // Find matching availability
    const matchingAvailability = therapist?.weeklyAvailability.filter(
      avail => avail.dayOfWeek === dayOfWeek
    );
    console.log('Matching availability for Monday:', JSON.stringify(matchingAvailability, null, 2));

  } catch (error) {
    console.error('Error:', error);
  }
}

debugTherapist();
