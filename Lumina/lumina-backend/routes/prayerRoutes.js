const express = require('express');
const {
  getPrayerRequests,
  getPrayerRequest,
  createPrayerRequest,
  updatePrayerRequest,
  deletePrayerRequest,
  prayForRequest,
  markAsAnswered
} = require('../controllers/prayerController');

const router = express.Router({ mergeParams: true });
const { protect } = require('../middleware/auth');

router
  .route('/')
  .get(getPrayerRequests)
  .post(protect, createPrayerRequest);

router
  .route('/:id')
  .get(protect, getPrayerRequest)
  .put(protect, updatePrayerRequest)
  .delete(protect, deletePrayerRequest);

router.put('/:id/pray', protect, prayForRequest);
router.put('/:id/answered', protect, markAsAnswered);

module.exports = router;