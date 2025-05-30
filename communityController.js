const Community = require('../models/Community');
const User = require('../models/User');
const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');
const uploadToCloudinary = require('../utils/fileUpload');

// @desc    Get all communities
// @route   GET /api/v1/communities
// @access  Public
exports.getCommunities = asyncHandler(async (req, res, next) => {
  res.status(200).json(res.advancedResults);
});

// @desc    Get single community
// @route   GET /api/v1/communities/:id
// @access  Public
exports.getCommunity = asyncHandler(async (req, res, next) => {
  const community = await Community.findById(req.params.id)
    .populate('members', 'firstName lastName profileImage')
    .populate('moderators', 'firstName lastName profileImage');

  if (!community) {
    return next(
      new ErrorResponse(`Community not found with id of ${req.params.id}`, 404)
    );
  }

  res.status(200).json({
    success: true,
    data: community
  });
});

// @desc    Create new community
// @route   POST /api/v1/communities
// @access  Private
exports.createCommunity = asyncHandler(async (req, res, next) => {
  // Add user to req.body as creator
  req.body.creator = req.user.id;

  // Handle image upload if exists
  if (req.files && req.files.image) {
    const result = await uploadToCloudinary(req.files.image.tempFilePath);
    req.body.image = result.secure_url;
  }

  const community = await Community.create(req.body);

  // Add creator as member and moderator
  community.members.push(req.user.id);
  community.moderators.push(req.user.id);
  await community.save();

  // Add community to user's communities list
  await User.findByIdAndUpdate(req.user.id, {
    $push: { communities: community._id }
  });

  res.status(201).json({
    success: true,
    data: community
  });
});

// @desc    Update community
// @route   PUT /api/v1/communities/:id
// @access  Private (creator or admin)
exports.updateCommunity = asyncHandler(async (req, res, next) => {
  let community = await Community.findById(req.params.id);

  if (!community) {
    return next(
      new ErrorResponse(`Community not found with id of ${req.params.id}`, 404)
    );
  }

  // Make sure user is community creator or admin
  if (
    community.creator.toString() !== req.user.id &&
    req.user.role !== 'admin'
  ) {
    return next(
      new ErrorResponse(
        `User ${req.user.id} is not authorized to update this community`,
        401
      )
    );
  }

  // Handle image upload if exists
  if (req.files && req.files.image) {
    const result = await uploadToCloudinary(req.files.image.tempFilePath);
    req.body.image = result.secure_url;
  }

  community = await Community.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  });

  res.status(200).json({
    success: true,
    data: community
  });
});

// @desc    Delete community
// @route   DELETE /api/v1/communities/:id
// @access  Private (creator or admin)
exports.deleteCommunity = asyncHandler(async (req, res, next) => {
  const community = await Community.findById(req.params.id);

  if (!community) {
    return next(
      new ErrorResponse(`Community not found with id of ${req.params.id}`, 404)
    );
  }

  // Make sure user is community creator or admin
  if (
    community.creator.toString() !== req.user.id &&
    req.user.role !== 'admin'
  ) {
    return next(
      new ErrorResponse(
        `User ${req.user.id} is not authorized to delete this community`,
        401
      )
    );
  }

  // Remove community from all users' communities lists
  await User.updateMany(
    { communities: req.params.id },
    { $pull: { communities: req.params.id } }
  );

  await community.remove();

  res.status(200).json({
    success: true,
    data: {}
  });
});

// @desc    Join community
// @route   PUT /api/v1/communities/:id/join
// @access  Private
exports.joinCommunity = asyncHandler(async (req, res, next) => {
  const community = await Community.findById(req.params.id);

  if (!community) {
    return next(
      new ErrorResponse(`Community not found with id of ${req.params.id}`, 404)
    );
  }

  // Check if community is private
  if (!community.isPublic && req.user.role !== 'admin') {
    return next(
      new ErrorResponse(
        `This community is private. You need an invitation to join.`,
        401
      )
    );
  }

  // Check if user is already a member
  if (community.members.includes(req.user.id)) {
    return next(new ErrorResponse('User is already a member', 400));
  }

  // Add user to community members
  community.members.push(req.user.id);
  await community.save();

  // Add community to user's communities list
  await User.findByIdAndUpdate(req.user.id, {
    $push: { communities: community._id }
  });

  res.status(200).json({
    success: true,
    data: community
  });
});

// @desc    Leave community
// @route   PUT /api/v1/communities/:id/leave
// @access  Private
exports.leaveCommunity = asyncHandler(async (req, res, next) => {
  const community = await Community.findById(req.params.id);

  if (!community) {
    return next(
      new ErrorResponse(`Community not found with id of ${req.params.id}`, 404)
    );
  }

  // Check if user is a member
  if (!community.members.includes(req.user.id)) {
    return next(new ErrorResponse('User is not a member', 400));
  }

  // Remove user from community members
  community.members.pull(req.user.id);
  
  // Remove user from moderators if they are one
  if (community.moderators.includes(req.user.id)) {
    community.moderators.pull(req.user.id);
  }
  
  await community.save();

  // Remove community from user's communities list
  await User.findByIdAndUpdate(req.user.id, {
    $pull: { communities: community._id }
  });

  res.status(200).json({
    success: true,
    data: community
  });
});

// @desc    Add moderator to community
// @route   PUT /api/v1/communities/:id/moderators/:userId
// @access  Private (creator or admin)
exports.addModerator = asyncHandler(async (req, res, next) => {
  const community = await Community.findById(req.params.id);

  if (!community) {
    return next(
      new ErrorResponse(`Community not found with id of ${req.params.id}`, 404)
    );
  }

  // Make sure user is community creator or admin
  if (
    community.creator.toString() !== req.user.id &&
    req.user.role !== 'admin'
  ) {
    return next(
      new ErrorResponse(
        `User ${req.user.id} is not authorized to add moderators`,
        401
      )
    );
  }

  // Check if user to be added exists
  const userToAdd = await User.findById(req.params.userId);
  if (!userToAdd) {
    return next(
      new ErrorResponse(`User not found with id of ${req.params.userId}`, 404)
    );
  }

  // Check if user is already a moderator
  if (community.moderators.includes(req.params.userId)) {
    return next(new ErrorResponse('User is already a moderator', 400));
  }

  // Make sure user is a member first
  if (!community.members.includes(req.params.userId)) {
    community.members.push(req.params.userId);
    await User.findByIdAndUpdate(req.params.userId, {
      $push: { communities: community._id }
    });
  }

  community.moderators.push(req.params.userId);
  await community.save();

  res.status(200).json({
    success: true,
    data: community
  });
});

// @desc    Remove moderator from community
// @route   DELETE /api/v1/communities/:id/moderators/:userId
// @access  Private (creator or admin)
exports.removeModerator = asyncHandler(async (req, res, next) => {
  const community = await Community.findById(req.params.id);

  if (!community) {
    return next(
      new ErrorResponse(`Community not found with id of ${req.params.id}`, 404)
    );
  }

  // Make sure user is community creator or admin
  if (
    community.creator.toString() !== req.user.id &&
    req.user.role !== 'admin'
  ) {
    return next(
      new ErrorResponse(
        `User ${req.user.id} is not authorized to remove moderators`,
        401
      )
    );
  }

  // Check if user is a moderator
  if (!community.moderators.includes(req.params.userId)) {
    return next(new ErrorResponse('User is not a moderator', 400));
  }

  community.moderators.pull(req.params.userId);
  await community.save();

  res.status(200).json({
    success: true,
    data: community
  });
});