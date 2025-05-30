const express = require('express');
const {
  getEvents,
  getEvent,
  createEvent,
  updateEvent,
  deleteEvent,
  rsvpToEvent,
  cancelRsvp,
  sendEventReminder
} = require('../controllers/eventController');

const router = express.Router({ mergeParams: true });
const { protect, authorize } = require('../middleware/auth');

router
  .route('/')
  .get(getEvents)
  .post(protect, createEvent);

router
  .route('/:id')
  .get(getEvent)
  .put(protect, updateEvent)
  .delete(protect, deleteEvent);

router.put('/:id/rsvp', protect, rsvpToEvent);
router.put('/:id/cancel', protect, cancelRsvp);
router.post('/:id/reminder', protect, sendEventReminder);

module.exports = router;