const PrayerRequest = require('../models/PrayerRequest');
const User = require('../models/User');
const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');
const sendEmail = require('../utils/emailService');

// @desc    Get all prayer requests
// @route   GET /api/v1/prayers
// @route   GET /api/v1/communities/:communityId/prayers
// @access  Public
exports.getPrayerRequests = asyncHandler(async (req, res, next) => {
  if (req.params.communityId) {
    const prayers = await PrayerRequest.find({
      communities: req.params.communityId,
      privacy: { $in: ['public', 'community'] }
    })
      .populate('user', 'firstName lastName profileImage')
      .sort('-createdAt');

    return res.status(200).json({
      success: true,
      count: prayers.length,
      data: prayers
    });
  } else {
    // For general prayer wall, only show public requests
    if (req.user) {
      // If user is logged in, show their private requests too
      const prayers = await PrayerRequest.find({
        $or: [
          { privacy: 'public' },
          { user: req.user.id },
          {
            privacy: 'community',
            communities: { $in: req.user.communities }
          }
        ]
      })
        .populate('user', 'firstName lastName profileImage')
        .sort('-createdAt');

      return res.status(200).json({
        success: true,
        count: prayers.length,
        data: prayers
      });
    } else {
      // For non-logged in users, only show public requests
      const prayers = await PrayerRequest.find({ privacy: 'public' })
        .populate('user', 'firstName lastName profileImage')
        .sort('-createdAt');

      return res.status(200).json({
        success: true,
        count: prayers.length,
        data: prayers
      });
    }
  }
});

// @desc    Get single prayer request
// @route   GET /api/v1/prayers/:id
// @access  Private (if private prayer)
exports.getPrayerRequest = asyncHandler(async (req, res, next) => {
  const prayer = await PrayerRequest.findById(req.params.id).populate(
    'user',
    'firstName lastName profileImage'
  );

  if (!prayer) {
    return next(
      new ErrorResponse(`Prayer request not found with id of ${req.params.id}`, 404)
    );
  }

  // Check privacy settings
  if (
    prayer.privacy === 'private' &&
    prayer.user._id.toString() !== req.user.id &&
    req.user.role !== 'admin'
  ) {
    return next(
      new ErrorResponse(
        `User ${req.user.id} is not authorized to access this prayer request`,
        401
      )
    );
  }

  if (
    prayer.privacy === 'community' &&
    !prayer.communities.some(comm => req.user.communities.includes(comm)) &&
    prayer.user._id.toString() !== req.user.id &&
    req.user.role !== 'admin'
  ) {
    return next(
      new ErrorResponse(
        `User ${req.user.id} is not authorized to access this prayer request`,
        401
      )
    );
  }

  res.status(200).json({
    success: true,
    data: prayer
  });
});

// @desc    Create new prayer request
// @route   POST /api/v1/prayers
// @access  Private
exports.createPrayerRequest = asyncHandler(async (req, res, next) => {
  // Add user to req.body
  req.body.user = req.user.id;

  // If privacy is community, add communities
  if (req.body.privacy === 'community' && req.body.communities) {
    req.body.communities = JSON.parse(req.body.communities);
  }

  const prayer = await PrayerRequest.create(req.body);

  res.status(201).json({
    success: true,
    data: prayer
  });
});

// @desc    Update prayer request
// @route   PUT /api/v1/prayers/:id
// @access  Private
exports.updatePrayerRequest = asyncHandler(async (req, res, next) => {
  let prayer = await PrayerRequest.findById(req.params.id);

  if (!prayer) {
    return next(
      new ErrorResponse(`Prayer request not found with id of ${req.params.id}`, 404)
    );
  }

  // Make sure user is prayer request owner
  if (prayer.user.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(
      new ErrorResponse(
        `User ${req.user.id} is not authorized to update this prayer request`,
        401
      )
    );
  }

  prayer = await PrayerRequest.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  });

  res.status(200).json({
    success: true,
    data: prayer
  });
});

// @desc    Delete prayer request
// @route   DELETE /api/v1/prayers/:id
// @access  Private
exports.deletePrayerRequest = asyncHandler(async (req, res, next) => {
  const prayer = await PrayerRequest.findById(req.params.id);

  if (!prayer) {
    return next(
      new ErrorResponse(`Prayer request not found with id of ${req.params.id}`, 404)
    );
  }

  // Make sure user is prayer request owner
  if (prayer.user.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(
      new ErrorResponse(
        `User ${req.user.id} is not authorized to delete this prayer request`,
        401
      )
    );
  }

  await prayer.remove();

  res.status(200).json({
    success: true,
    data: {}
  });
});

// @desc    Pray for a prayer request
// @route   PUT /api/v1/prayers/:id/pray
// @access  Private
exports.prayForRequest = asyncHandler(async (req, res, next) => {
  const prayer = await PrayerRequest.findById(req.params.id);

  if (!prayer) {
    return next(
      new ErrorResponse(`Prayer request not found with id of ${req.params.id}`, 404)
    );
  }

  // Check privacy settings
  if (
    prayer.privacy === 'private' &&
    prayer.user._id.toString() !== req.user.id &&
    req.user.role !== 'admin'
  ) {
    return next(
      new ErrorResponse(
        `User ${req.user.id} is not authorized to pray for this request`,
        401
      )
    );
  }

  if (
    prayer.privacy === 'community' &&
    !prayer.communities.some(comm => req.user.communities.includes(comm)) &&
    prayer.user._id.toString() !== req.user.id &&
    req.user.role !== 'admin'
  ) {
    return next(
      new ErrorResponse(
        `User ${req.user.id} is not authorized to pray for this request`,
        401
      )
    );
  }

  // Check if the user has already prayed for this request
  if (prayer.prayers.includes(req.user.id)) {
    return next(new ErrorResponse('Already prayed for this request', 400));
  }

  prayer.prayers.push(req.user.id);
  await prayer.save();

  // Notify the request owner if someone prays for their request (unless it's themselves)
  if (prayer.user.toString() !== req.user.id) {
    const user = await User.findById(prayer.user);
    const prayingUser = await User.findById(req.user.id);

    const message = `Hello ${user.firstName},\n\n${prayingUser.firstName} ${prayingUser.lastName} has prayed for your prayer request: "${prayer.content.substring(0, 50)}..."\n\nView your prayer request here: ${req.headers.referer}prayers/${prayer._id}`;

    try {
      await sendEmail({
        email: user.email,
        subject: 'Someone prayed for your request',
        message
      });
    } catch (err) {
      console.error('Error sending prayer notification email:', err);
    }
  }

  res.status(200).json({
    success: true,
    data: prayer
  });
});

// @desc    Mark prayer request as answered
// @route   PUT /api/v1/prayers/:id/answered
// @access  Private
exports.markAsAnswered = asyncHandler(async (req, res, next) => {
  let prayer = await PrayerRequest.findById(req.params.id);

  if (!prayer) {
    return next(
      new ErrorResponse(`Prayer request not found with id of ${req.params.id}`, 404)
    );
  }

  // Make sure user is prayer request owner
  if (prayer.user.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(
      new ErrorResponse(
        `User ${req.user.id} is not authorized to update this prayer request`,
        401
      )
    );
  }

  prayer.isAnswered = true;
  prayer.answeredDetails = req.body.answeredDetails || '';
  prayer = await prayer.save();

  res.status(200).json({
    success: true,
    data: prayer
  });
});