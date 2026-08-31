const mongoose = require('mongoose');
const Appointment = require('../../../src/models/Appointment');

function futureDateString(daysAhead = 7) {
  const date = new Date();
  date.setDate(date.getDate() + daysAhead);
  return date.toISOString().slice(0, 10);
}

describe('Appointment model', () => {
  it('rejects appointment dates in the past', async () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    await expect(
      Appointment.create({
        fullName: 'Past User',
        email: 'past@test.com',
        phone: '0911223344',
        verificationType: 'candidate',
        appointmentDate: yesterday.toISOString().slice(0, 10),
        appointmentTime: '10:00',
      })
    ).rejects.toThrow();
  });

  it('saves with valid minimal data', async () => {
    const appointment = await Appointment.create({
      fullName: 'Future User',
      email: 'future@test.com',
      phone: '0911223344',
      verificationType: 'candidate',
      appointmentDate: futureDateString(),
      appointmentTime: '10:00',
    });

    expect(appointment.status).toBe('pending');
    expect(appointment.officeLocation).toContain('Addis Ababa');
  });

  it('isUpcoming virtual is true for future pending appointments', async () => {
    const appointment = await Appointment.create({
      fullName: 'Upcoming User',
      email: 'upcoming@test.com',
      phone: '0911223344',
      verificationType: 'freelancer',
      appointmentDate: futureDateString(14),
      appointmentTime: '14:30',
    });

    expect(appointment.isUpcoming).toBe(true);
    expect(appointment.appointmentDateTime).toBeInstanceOf(Date);
  });

  it('rejects duplicate slot for pending appointments', async () => {
    const date = futureDateString(10);
    const time = '09:00';

    await Appointment.create({
      fullName: 'First Slot',
      email: 'first-slot@test.com',
      phone: '0911000001',
      verificationType: 'company',
      appointmentDate: date,
      appointmentTime: time,
    });

    await expect(
      Appointment.create({
        fullName: 'Second Slot',
        email: 'second-slot@test.com',
        phone: '0911000002',
        verificationType: 'company',
        appointmentDate: date,
        appointmentTime: time,
      })
    ).rejects.toThrow();
  });
});
