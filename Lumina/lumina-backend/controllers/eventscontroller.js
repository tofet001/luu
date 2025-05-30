const Event = require('../models/Event');
const User = require('../models/User');
const Community = require('../models/Community');
const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');
const uploadToCloudinary = require('../utils/fileUpload');
const sendEmail = require('../utils/emailService');

// @desc    Get all events
// @route   GET /api/v1/events
// @route   GET /api/v1/communities/:communityId/events
// @access  Public
exports.getEvents = asyncHandler(async (req, res, next) => {
  if (req.params.communityId) {
    const events = await Event.find({ community: req.params.communityId })
      .sort('startDate')
      .populate('creator', 'firstName lastName profileImage');

    return res.status(200).json({
      success: true,
      count: events.length,
      data: events
    });
  } else {
    res.status(200).json(res.advancedResults);
  }
});

// @desc    Get single event
// @route   GET /api/v1/events/:id
// @access  Public
exports.getEvent = asyncHandler(async (req, res, next) => {
  const event = await Event.findById(req.params.id)
    .populate('creator', 'firstName lastName profileImage')
    .populate('attendees.user', 'firstName lastName profileImage');

  if (!event) {
    return next(
      new ErrorResponse(`Event not found with id of ${req.params.id}`, 404)
    );
  }

  res.status(200).json({
    success: true,
    data: event
  });
});

// @desc    Create new event
// @route   POST /api/v1/events
// @route   POST /api/v1/communities/:communityId/events
// @access  Private
exports.createEvent = asyncHandler(async (req, res, next) => {
  // Add user to req.body as creator
  req.body.creator = req.user.id;

  // If creating for a community, add community to req.body
  if (req.params.communityId) {
    req.body.community = req.params.communityId;
  }

  // Handle image upload if exists
  if (req.files && req.files.image) {
    const result = await uploadToCloudinary(req.files.image.tempFilePath);
    req.body.image = result.secure_url;
  }

  const event = await Event.create(req.body);

  // Add creator as attendee
  event.attendees.push({ user: req.user.id, status: 'going' });
  await event.save();

  res.status(201).json({
    success: true,
    data: event
  });
});

// @desc    Update event
// @route   PUT /api/v1/events/:id
// @access  Private (creator or admin)
exports.updateEvent = asyncHandler(async (req, res, next) => {
  let event = await Event.findById(req.params.id);

  if (!event) {
    return next(
      new ErrorResponse(`Event not found with id of ${req.params.id}`, 404)
    );
  }

  // Make sure user is event creator or admin
  if (event.creator.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(
      new ErrorResponse(
        `User ${req.user.id} is not authorized to update this event`,
        401
      )
    );
  }

  // Handle image upload if exists
  if (req.files && req.files.image) {
    const result = await uploadToCloudinary(req.files.image.tempFilePath);
    req.body.image = result.secure_url;
  }

  event = await Event.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  });

  res.status(200).json({
    success: true,
    data: event
  });
});

// @desc    Delete event
// @route   DELETE /api/v1/events/:id
// @access  Private (creator or admin)
exports.deleteEvent = asyncHandler(async (req, res, next) => {
  const event = await Event.findById(req.params.id);

  if (!event) {
    return next(
      new ErrorResponse(`Event not found with id of ${req.params.id}`, 404)
    );
  }

  // Make sure user is event creator or admin
  if (event.creator.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(
      new ErrorResponse(
        `User ${req.user.id} is not authorized to delete this event`,
        401
      )
    );
  }

  await event.remove();

  res.status(200).json({
    success: true,
    data: {}
  });
});

// @desc    RSVP to event
// @route   PUT /api/v1/events/:id/rsvp
// @access  Private
exports.rsvpToEvent = asyncHandler(async (req, res, next) => {
  const { status } = req.body;
  const event = await Event.findById(req.params.id);

  if (!event) {
    return next(
      new ErrorResponse(`Event not found with id of ${req.params.id}`, 404)
    );
  }

  // Check if status is valid
  if (!['going', 'interested'].includes(status)) {
    return next(
      new ErrorResponse(`Invalid RSVP status: ${status}`, 400)
    );
  }

  // Check if user has already RSVP'd
  const attendeeIndex = event.attendees.findIndex(
    attendee => attendee.user.toString() === req.user.id
  );

  if (attendeeIndex !== -1) {
    // Update existing RSVP
    event.attendees[attendeeIndex].status = status;
  } else {
    // Add new RSVP
    event.attendees.push({ user: req.user.id, status });
  }

  await event.save();

  res.status(200).json({
    success: true,
    data: event
  });
});

// @desc    Cancel RSVP to event
// @route   PUT /api/v1/events/:id/cancel
// @access  Private
exports.cancelRsvp = asyncHandler(async (req, res, next) => {
  const event = await Event.findById(req.params.id);

  if (!event) {
    return next(
      new ErrorResponse(`Event not found with id of ${req.params.id}`, 404)
    );
  }

  // Check if user has RSVP'd
  const attendeeIndex = event.attendees.findIndex(
    attendee => attendee.user.toString() === req.user.id
  );

  if (attendeeIndex === -1) {
    return next(
      new ErrorResponse(`User has not RSVP'd to this event`, 400)
    );
  }

  // Remove RSVP
  event.attendees.splice(attendeeIndex, 1);
  await event.save();

  res.status(200).json({
    success: true,
    data: event
  });
});

// @desc    Send event reminder
// @route   POST /api/v1/events/:id/reminder
// @access  Private (creator or admin)
exports.sendEventReminder = asyncHandler(async (req, res, next) => {
  const event = await Event.findById(req.params.id)
    .populate('attendees.user', 'email firstName');

  if (!event) {
    return next(
      new ErrorResponse(`Event not found with id of ${req.params.id}`, 404)
    );
  }

  // Make sure user is event creator or admin
  if (event.creator.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(
      new ErrorResponse(
        `User ${req.user.id} is not authorized to send reminders for this event`,
        401
      )
    );
  }

  // Send email to all attendees who are going
  const goingAttendees = event.attendees
    .filter(attendee => attendee.status === 'going')
    .map(attendee => attendee.user);

  const emailsSent = [];
  const errors = [];

  for (const attendee of goingAttendees) {
    const message = `Hello ${attendee.firstName},\n\nThis is a reminder about the upcoming event "${event.title}" on ${event.startDate.toLocaleString()}.\n\nLocation: ${event.location}\n\nDescription: ${event.description}\n\nWe look forward to seeing you there!`;

    try {
      await sendEmail({
        email: attendee.email,
        subject: `Reminder: ${event.title}`,
        message
      });
      emailsSent.push(attendee.email);
    } catch (err) {
      console.error(`Error sending email to ${attendee.email}:`, err);
      errors.push(attendee.email);
    }
  }

  res.status(200).json({
    success: true,
    data: {
      totalAttendees: goingAttendees.length,
      emailsSent,
      errors
    }
  });
});