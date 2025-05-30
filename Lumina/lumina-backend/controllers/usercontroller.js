const User = require('../models/User');
const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');
const uploadToCloudinary = require('../utils/fileUpload');

// @desc    Get all users
// @route   GET /api/v1/users
// @access  Private/Admin
exports.getUsers = asyncHandler(async (req, res, next) => {
  res.status(200).json(res.advancedResults);
});

// @desc    Get single user
// @route   GET /api/v1/users/:id
// @access  Private
exports.getUser = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.params.id).populate('communities');

  if (!user) {
    return next(
      new ErrorResponse(`User not found with id of ${req.params.id}`, 404)
    );
  }

  // Make sure user is requesting their own profile or is admin
  if (req.user.id !== req.params.id && req.user.role !== 'admin') {
    return next(
      new ErrorResponse(
        `User ${req.user.id} is not authorized to view this profile`,
        401
      )
    );
  }

  res.status(200).json({
    success: true,
    data: user
  });
});

// @desc    Get current logged in user
// @route   GET /api/v1/users/me
// @access  Private
exports.getMe = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user.id).populate('communities');

  res.status(200).json({
    success: true,
    data: user
  });
});

// @desc    Update user profile
// @route   PUT /api/v1/users/:id
// @access  Private
exports.updateUser = asyncHandler(async (req, res, next) => {
  let user = await User.findById(req.params.id);

  if (!user) {
    return next(
      new ErrorResponse(`User not found with id of ${req.params.id}`, 404)
    );
  }

  // Make sure user is updating their own profile or is admin
  if (req.user.id !== req.params.id && req.user.role !== 'admin') {
    return next(
      new ErrorResponse(
        `User ${req.user.id} is not authorized to update this profile`,
        401
      )
    );
  }

  // Handle image upload if exists
  if (req.files && req.files.profileImage) {
    const result = await uploadToCloudinary(req.files.profileImage.tempFilePath);
    req.body.profileImage = result.secure_url;
  }

  user = await User.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  });

  res.status(200).json({
    success: true,
    data: user
  });
});

// @desc    Delete user
// @route   DELETE /api/v1/users/:id
// @access  Private/Admin
exports.deleteUser = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    return next(
      new ErrorResponse(`User not found with id of ${req.params.id}`, 404)
    );
  }

  // Make sure user is admin or deleting themselves
  if (req.user.id !== req.params.id && req.user.role !== 'admin') {
    return next(
      new ErrorResponse(
        `User ${req.user.id} is not authorized to delete this profile`,
        401
      )
    );
  }

  await user.remove();

  res.status(200).json({
    success: true,
    data: {}
  });
});

// @desc    Get user's prayer requests
// @route   GET /api/v1/users/:id/prayers
// @access  Private
exports.getUserPrayers = asyncHandler(async (req, res, next) => {
  // Make sure user is requesting their own prayers or is admin
  if (req.user.id !== req.params.id && req.user.role !== 'admin') {
    return next(
      new ErrorResponse(
        `User ${req.user.id} is not authorized to view these prayers`,
        401
      )
    );
  }

  const prayers = await PrayerRequest.find({ user: req.params.id })
    .sort('-createdAt')
    .populate('prayers', 'firstName lastName profileImage');

  res.status(200).json({
    success: true,
    count: prayers.length,
    data: prayers
  });
});

// @desc    Get user's events
// @route   GET /api/v1/users/:id/events
// @access  Private
exports.getUserEvents = asyncHandler(async (req, res, next) => {
  // Make sure user is requesting their own events or is admin
  if (req.user.id !== req.params.id && req.user.role !== 'admin') {
    return next(
      new ErrorResponse(
        `User ${req.user.id} is not authorized to view these events`,
        401
      )
    );
  }

  const events = await Event.find({ 'attendees.user': req.params.id })
    .sort('startDate')
    .populate('creator', 'firstName lastName profileImage');

  res.status(200).json({
    success: true,
    count: events.length,
    data: events
  });
});

// @desc    Get user's posts
// @route   GET /api/v1/users/:id/posts
// @access  Private
exports.getUserPosts = asyncHandler(async (req, res, next) => {
  // Make sure user is requesting their own posts or is admin
  if (req.user.id !== req.params.id && req.user.role !== 'admin') {
    return next(
      new ErrorResponse(
        `User ${req.user.id} is not authorized to view these posts`,
        401
      )
    );
  }

  const posts = await Post.find({ user: req.params.id })
    .sort('-createdAt')
    .populate('user', 'firstName lastName profileImage');

  res.status(200).json({
    success: true,
    count: posts.length,
    data: posts
  });
});

// @desc    Follow user
// @route   PUT /api/v1/users/:id/follow
// @access  Private
exports.followUser = asyncHandler(async (req, res, next) => {
  if (req.user.id === req.params.id) {
    return next(new ErrorResponse('You cannot follow yourself', 400));
  }

  const userToFollow = await User.findById(req.params.id);
  const currentUser = await User.findById(req.user.id);

  if (!userToFollow) {
    return next(
      new ErrorResponse(`User not found with id of ${req.params.id}`, 404)
    );
  }

  // Check if already following
  if (currentUser.following.includes(req.params.id)) {
    return next(new ErrorResponse('Already following this user', 400));
  }

  // Add to current user's following list
  currentUser.following.push(req.params.id);
  await currentUser.save();

  // Add to other user's followers list
  userToFollow.followers.push(req.user.id);
  await userToFollow.save();

  res.status(200).json({
    success: true,
    data: {
      currentUser,
      userToFollow
    }
  });
});

// @desc    Unfollow user
// @route   PUT /api/v1/users/:id/unfollow
// @access  Private
exports.unfollowUser = asyncHandler(async (req, res, next) => {
  if (req.user.id === req.params.id) {
    return next(new ErrorResponse('You cannot unfollow yourself', 400));
  }

  const userToUnfollow = await User.findById(req.params.id);
  const currentUser = await User.findById(req.user.id);

  if (!userToUnfollow) {
    return next(
      new ErrorResponse(`User not found with id of ${req.params.id}`, 404)
    );
  }

  // Check if not following
  if (!currentUser.following.includes(req.params.id)) {
    return next(new ErrorResponse('Not following this user', 400));
  }

  // Remove from current user's following list
  currentUser.following.pull(req.params.id);
  await currentUser.save();

  // Remove from other user's followers list
  userToUnfollow.followers.pull(req.user.id);
  await userToUnfollow.save();

  res.status(200).json({
    success: true,
    data: {
      currentUser,
      userToUnfollow
    }
  });
});