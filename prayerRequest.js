const mongoose = require('mongoose');

const PrayerRequestSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true
  },
  content: {
    type: String,
    required: [true, 'Please add your prayer request'],
    maxlength: [2000, 'Prayer request cannot be more than 2000 characters']
  },
  privacy: {
    type: String,
    enum: ['public', 'community', 'private'],
    default: 'public'
  },
  communities: [{
    type: mongoose.Schema.ObjectId,
    ref: 'Community'
  }],
  prayers: [{
    type: mongoose.Schema.ObjectId,
    ref: 'User'
  }],
  isAnswered: {
    type: Boolean,
    default: false
  },
  answeredDetails: {
    type: String,
    maxlength: [2000, 'Answered details cannot be more than 2000 characters']
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('PrayerRequest', PrayerRequestSchema);