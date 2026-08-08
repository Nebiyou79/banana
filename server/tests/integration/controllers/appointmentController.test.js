const request = require('supertest');
const appointmentController = require('../../../src/controllers/appointmentController');
const { getApp } = require('../../helpers/app');
const { createUser, authHeader, assertNoPassword } = require('../../helpers/auth');
const { mockReq, mockRes } = require('../../helpers/mockHttp');
const Appointment = require('../../../src/models/Appointment');

describe('appointmentController integration', () => {
  const app = getApp();

  const futureDate = '2026-12-15';
  const validAppointment = {
    fullName: 'Test Applicant',
    email: 'applicant@test.com',
    phone: '0912345678',
    verificationType: 'candidate',
    appointmentDate: futureDate,
    appointmentTime: '10:00',
  };

  describe('GET /api/v1/appointments/slots', () => {
    it('returns 400 without date query param', async () => {
      const res = await request(app).get('/api/v1/appointments/slots');
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/date/i);
    });

    it('returns available slots for valid date', async () => {
      const res = await request(app)
        .get('/api/v1/appointments/slots')
        .query({ date: futureDate });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.slots)).toBe(true);
    });
  });

  describe('POST /api/v1/appointments', () => {
    it('requires authentication', async () => {
      const res = await request(app)
        .post('/api/v1/appointments')
        .send({ date: futureDate, timeSlot: '10:00' });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('returns 400 when required fields missing', async () => {
      const user = await createUser();
      const res = await request(app)
        .post('/api/v1/appointments')
        .set(authHeader(user._id))
        .send({});

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('creates appointment with valid payload', async () => {
      const user = await createUser({ role: 'candidate' });
      const res = await request(app)
        .post('/api/v1/appointments')
        .set(authHeader(user._id))
        .send({ ...validAppointment, userId: user._id.toString() });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.appointment.fullName).toBe(validAppointment.fullName);
    });
  });

  describe('GET /api/v1/appointments/user/:userId', () => {
    it('returns appointments for authenticated user', async () => {
      const user = await createUser();
      const res = await request(app)
        .get(`/api/v1/appointments/user/${user._id}`)
        .set(authHeader(user._id));

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.appointments)).toBe(true);
      assertNoPassword(res.body);
    });
  });

  describe('GET /api/v1/appointments/:id', () => {
    it('returns appointment details', async () => {
      const user = await createUser();
      const appointment = await Appointment.create({
        ...validAppointment,
        userId: user._id,
      });

      const res = await request(app)
        .get(`/api/v1/appointments/${appointment._id}`)
        .set(authHeader(user._id));

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.appointment._id.toString()).toBe(appointment._id.toString());
    });
  });

  describe('PATCH /api/v1/appointments/:id/cancel', () => {
    it('cancels appointment', async () => {
      const user = await createUser();
      const appointment = await Appointment.create({
        ...validAppointment,
        userId: user._id,
        appointmentTime: '11:00',
      });

      const res = await request(app)
        .patch(`/api/v1/appointments/${appointment._id}/cancel`)
        .set(authHeader(user._id))
        .send({ reason: 'Schedule conflict' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const updated = await Appointment.findById(appointment._id);
      expect(updated.status).toBe('cancelled');
    });
  });

  describe('admin appointment routes', () => {
    it('returns admin appointments list', async () => {
      const admin = await createUser({ role: 'admin' });
      const res = await request(app)
        .get('/api/v1/appointments/admin/appointments')
        .set(authHeader(admin._id));

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('returns appointments by date for admin', async () => {
      const admin = await createUser({ role: 'admin' });
      const user = await createUser();
      await Appointment.create({
        ...validAppointment,
        userId: user._id,
        appointmentTime: '14:00',
      });

      const res = await request(app)
        .get(`/api/v1/appointments/admin/appointments/date/${futureDate}`)
        .set(authHeader(admin._id));

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('updates appointment status as admin', async () => {
      const admin = await createUser({ role: 'admin' });
      const user = await createUser();
      const appointment = await Appointment.create({
        ...validAppointment,
        userId: user._id,
        appointmentTime: '15:00',
      });

      const res = await request(app)
        .patch(`/api/v1/appointments/admin/appointments/${appointment._id}/status`)
        .set(authHeader(admin._id))
        .send({ status: 'confirmed' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe('getAvailableSlots (direct)', () => {
    it('returns slots via controller', async () => {
      const req = mockReq({ query: { date: futureDate } });
      const res = mockRes();

      await appointmentController.getAvailableSlots(req, res);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });
});
