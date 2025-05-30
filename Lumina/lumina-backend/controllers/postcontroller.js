const Post = require('../models/Post');
const User = require('../models/User');
const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');
const uploadToCloudinary = require('../utils/fileUpload');

// @desc    Get all posts
// @route   GET /api/v1/posts
// @route   GET /api/v1/communities/:communityId/posts
// @access  Public
exports.getPosts = asyncHandler(async (req, res, next) => {
  if (req.params.communityId) {
    const posts = await Post.find({ community: req.params.communityId })
      .populate('user', 'firstName lastName profileImage')
      .sort('-createdAt');

    return res.status(200).json({
      success: true,
      count: posts.length,
      data: posts
    });
  } else {
    res.status(200).json(res.advancedResults);
  }
});

// @desc    Get single post
// @route   GET /api/v1/posts/:id
// @access  Public
exports.getPost = asyncHandler(async (req, res, next) => {
  const post = await Post.findById(req.params.id).populate(
    'user',
    'firstName lastName profileImage'
  );

  if (!post) {
    return next(
      new ErrorResponse(`Post not found with id of ${req.params.id}`, 404)
    );
  }

  res.status(200).json({
    success: true,
    data: post
  });
});

// @desc    Create new post
// @route   POST /api/v1/posts
// @route   POST /api/v1/communities/:communityId/posts
// @access  Private
exports.createPost = asyncHandler(async (req, res, next) => {
  // Add user to req.body
  req.body.user = req.user.id;

  // If posting to a community, add community to req.body
  if (req.params.communityId) {
    req.body.community = req.params.communityId;
  }

  // Handle image upload if exists
  if (req.files && req.files.image) {
    const result = await uploadToCloudinary(req.files.image.tempFilePath);
    req.body.image = result.secure_url;
  }

  const post = await Post.create(req.body);

  res.status(201).json({
    success: true,
    data: post
  });
});

// @desc    Update post
// @route   PUT /api/v1/posts/:id
// @access  Private
exports.updatePost = asyncHandler(async (req, res, next) => {
  let post = await Post.findById(req.params.id);

  if (!post) {
    return next(
      new ErrorResponse(`Post not found with id of ${req.params.id}`, 404)
    );
  }

  // Make sure user is post owner
  if (post.user.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(
      new ErrorResponse(
        `User ${req.user.id} is not authorized to update this post`,
        401
      )
    );
  }

  // Handle image upload if exists
  if (req.files && req.files.image) {
    const result = await uploadToCloudinary(req.files.image.tempFilePath);
    req.body.image = result.secure_url;
  }

  post = await Post.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  });

  res.status(200).json({
    success: true,
    data: post
  });
});

// @desc    Delete post
// @route   DELETE /api/v1/posts/:id
// @access  Private
exports.deletePost = asyncHandler(async (req, res, next) => {
  const post = await Post.findById(req.params.id);

  if (!post) {
    return next(
      new ErrorResponse(`Post not found with id of ${req.params.id}`, 404)
    );
  }

  // Make sure user is post owner
  if (post.user.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(
      new ErrorResponse(
        `User ${req.user.id} is not authorized to delete this post`,
        401
      )
    );
  }

  await post.remove();

  res.status(200).json({
    success: true,
    data: {}
  });
});

// @desc    Like a post
// @route   PUT /api/v1/posts/:id/like
// @access  Private
exports.likePost = asyncHandler(async (req, res, next) => {
  const post = await Post.findById(req.params.id);

  if (!post) {
    return next(
      new ErrorResponse(`Post not found with id of ${req.params.id}`, 404)
    );
  }

  // Check if the post has already been liked
  if (post.likes.includes(req.user.id)) {
    return next(new ErrorResponse('Post already liked', 400));
  }

  post.likes.push(req.user.id);
  await post.save();

  res.status(200).json({
    success: true,
    data: post
  });
});

// @desc    Unlike a post
// @route   PUT /api/v1/posts/:id/unlike
// @access  Private
exports.unlikePost = asyncHandler(async (req, res, next) => {
  const post = await Post.findById(req.params.id);

  if (!post) {
    return next(
      new ErrorResponse(`Post not found with id of ${req.params.id}`, 404)
    );
  }

  // Check if the post has not been liked
  if (!post.likes.includes(req.user.id)) {
    return next(new ErrorResponse('Post has not yet been liked', 400));
  }

  // Get remove index
  const removeIndex = post.likes.indexOf(req.user.id);
  post.likes.splice(removeIndex, 1);

  await post.save();

  res.status(200).json({
    success: true,
    data: post
  });
});

// @desc    Pray for a post
// @route   PUT /api/v1/posts/:id/pray
// @access  Private
exports.prayForPost = asyncHandler(async (req, res, next) => {
  const post = await Post.findById(req.params.id);

  if (!post) {
    return next(
      new ErrorResponse(`Post not found with id of ${req.params.id}`, 404)
    );
  }

  // Check if the user has already prayed for this post
  if (post.prayers.includes(req.user.id)) {
    return next(new ErrorResponse('Already prayed for this post', 400));
  }

  post.prayers.push(req.user.id);
  await post.save();

  res.status(200).json({
    success: true,
    data: post
  });
});

// @desc    Add comment to post
// @route   POST /api/v1/posts/:id/comments
// @access  Private
exports.addComment = asyncHandler(async (req, res, next) => {
  const post = await Post.findById(req.params.id);

  if (!post) {
    return next(
      new ErrorResponse(`Post not found with id of ${req.params.id}`, 404)
    );
  }

  const newComment = {
    user: req.user.id,
    text: req.body.text
  };

  post.comments.unshift(newComment);
  await post.save();

  res.status(200).json({
    success: true,
    data: post.comments
  });
});

// @desc    Delete comment from post
// @route   DELETE /api/v1/posts/:id/comments/:commentId
// @access  Private
exports.deleteComment = asyncHandler(async (req, res, next) => {
  const post = await Post.findById(req.params.id);

  if (!post) {
    return next(
      new ErrorResponse(`Post not found with id of ${req.params.id}`, 404)
    );
  }

  // Pull out comment
  const comment = post.comments.find(
    comment => comment.id === req.params.commentId
  );

  // Make sure comment exists
  if (!comment) {
    return next(
      new ErrorResponse(`Comment not found with id of ${req.params.commentId}`, 404)
    );
  }

  // Make sure user is comment owner or admin
  if (comment.user.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(
      new ErrorResponse(
        `User ${req.user.id} is not authorized to delete this comment`,
        401
      )
    );
  }

  // Get remove index
  const removeIndex = post.comments
    .map(comment => comment.id)
    .indexOf(req.params.commentId);

  post.comments.splice(removeIndex, 1);
  await post.save();

  res.status(200).json({
    success: true,
    data: post.comments
  });
});