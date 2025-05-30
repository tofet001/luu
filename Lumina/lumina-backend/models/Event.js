const mongoose = require('mongoose');

const EventSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Please add an event title'],
    maxlength: [100, 'Event title cannot be more than 100 characters']
  },
  description: {
    type: String,
    required: [true, 'Please add a description'],
    maxlength: [1000, 'Description cannot be more than 1000 characters']
  },
  image: {
    type: String
  },
  startDate: {
    type: Date,
    required: [true, 'Please add a start date']
  },
  endDate: {
    type: Date,
    required: [true, 'Please add an end date']
  },
  location: {
    type: String,
    required: [true, 'Please add a location'],
    maxlength: [200, 'Location cannot be more than 200 characters']
  },
  isOnline: {
    type: Boolean,
    default: false
  },
  onlineLink: {
    type: String
  },
  creator: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true
  },
  attendees: [{
    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'User'
    },
    status: {
      type: String,
      enum: ['going', 'interested'],
      default: 'going'
    }
  }],
  community: {
    type: mongoose.Schema.ObjectId,
    ref: 'Community'
  },
  isPublic: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Event', EventSchema);