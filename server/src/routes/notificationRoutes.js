// server/src/routes/notificationRoutes.js
const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const { verifyToken } = require('../middleware/authMiddleware');

router.use(verifyToken);

// ── Notification CRUD ─────────────────────────────────────────────────
router.get('/', notificationController.getNotifications);
router.get('/count', notificationController.getUnreadCount);
router.put('/read-all', notificationController.markAllRead);
router.put('/:id/read', notificationController.markRead);
router.delete('/clear', notificationController.clearAll);
router.delete('/:id', notificationController.deleteOne);

// ── Push subscription management ──────────────────────────────────────
router.post('/push/subscribe', notificationController.subscribePush);
router.delete('/push/unsubscribe', notificationController.unsubscribePush);
router.post('/push/test', notificationController.testPush);

// ── Notification preferences ──────────────────────────────────────────
router.get('/preferences', notificationController.getPreferences);
router.put('/preferences', notificationController.updatePreferences);

module.exports = router;