const express = require('express');
const {
  getPosts,
  getPost,
  createPost,
  updatePost,
  deletePost,
  likePost,
  unlikePost,
  prayForPost,
  addComment,
  deleteComment
} = require('../controllers/postController');

const router = express.Router({ mergeParams: true });
const { protect } = require('../middleware/auth');

router
  .route('/')
  .get(getPosts)
  .post(protect, createPost);

router
  .route('/:id')
  .get(getPost)
  .put(protect, updatePost)
  .delete(protect, deletePost);

router.put('/:id/like', protect, likePost);
router.put('/:id/unlike', protect, unlikePost);
router.put('/:id/pray', protect, prayForPost);

router
  .route('/:id/comments')
  .post(protect, addComment);

router
  .route('/:id/comments/:commentId')
  .delete(protect, deleteComment);

module.exports = router;