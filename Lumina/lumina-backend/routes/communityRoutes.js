const express = require('express');
const {
  getCommunities,
  getCommunity,
  createCommunity,
  updateCommunity,
  deleteCommunity,
  joinCommunity,
  leaveCommunity,
  addModerator,
  removeModerator
} = require('../controllers/communityController');

const router = express.Router();
const { protect, authorize } = require('../middleware/auth');

// Re-route into other resource routers
const postRouter = require('./postRoutes');
const prayerRouter = require('./prayerRoutes');
const eventRouter = require('./eventRoutes');

router.use('/:communityId/posts', postRouter);
router.use('/:communityId/prayers', prayerRouter);
router.use('/:communityId/events', eventRouter);

router
  .route('/')
  .get(getCommunities)
  .post(protect, createCommunity);

router
  .route('/:id')
  .get(getCommunity)
  .put(protect, updateCommunity)
  .delete(protect, deleteCommunity);

router.put('/:id/join', protect, joinCommunity);
router.put('/:id/leave', protect, leaveCommunity);
router.put('/:id/moderators/:userId', protect, addModerator);
router.delete('/:id/moderators/:userId', protect, removeModerator);

module.exports = router;