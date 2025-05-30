const express = require('express');
const {
  getUsers,
  getUser,
  updateUser,
  deleteUser,
  getUserPrayers,
  getUserEvents,
  getUserPosts,
  followUser,
  unfollowUser
} = require('../controllers/userController');

const router = express.Router();
const { protect, authorize } = require('../middleware/auth');

router.use(protect);

router.get('/', authorize('admin'), getUsers);

router
  .route('/:id')
  .get(getUser)
  .put(updateUser)
  .delete(authorize('admin'), deleteUser);

router.get('/:id/prayers', getUserPrayers);
router.get('/:id/events', getUserEvents);
router.get('/:id/posts', getUserPosts);
router.put('/:id/follow', followUser);
router.put('/:id/unfollow', unfollowUser);

module.exports = router;