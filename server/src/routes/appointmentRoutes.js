// server/src/routes/appointmentRoutes.js
const express = require('express');
const router = express.Router();
const appointmentController = require('../controllers/appointmentController');
const { verifyToken, restrictTo } = require('../middleware/authMiddleware');

// Public routes
router.get('/slots', appointmentController.getAvailableSlots);

// User routes (requires authentication)
router.use(verifyToken);

router.post('/', appointmentController.createAppointment);
router.get('/user/:userId', appointmentController.getUserAppointments);
router.get('/:id', appointmentController.getAppointmentDetails);
router.patch('/:id/cancel', appointmentController.cancelAppointment);

// Admin routes
router.get('/admin/appointments', restrictTo('admin'), appointmentController.getAdminAppointments);
router.get('/admin/appointments/date/:date', restrictTo('admin'), appointmentController.getAppointmentsByDate);
router.patch('/admin/appointments/:id/status', restrictTo('admin'), appointmentController.updateAppointmentStatus);
router.post('/admin/appointments/bulk-update', restrictTo('admin'), appointmentController.bulkUpdateAppointments);

module.exports = router;