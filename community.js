const mongoose = require('mongoose');

const CommunitySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please add a community name'],
    unique: true,
    trim: true,
    maxlength: [50, 'Community name cannot be more than 50 characters']
  },
  description: {
    type: String,
    required: [true, 'Please add a description'],
    maxlength: [500, 'Description cannot be more than 500 characters']
  },
  image: {
    type: String,
    default: 'default-community.jpg'
  },
  category: {
    type: String,
    enum: ['bible-study', 'prayer', 'worship', 'fellowship', 'ministry', 'other'],
    default: 'fellowship'
  },
  members: [{
    type: mongoose.Schema.ObjectId,
    ref: 'User'
  }],
  moderators: [{
    type: mongoose.Schema.ObjectId,
    ref: 'User'
  }],
  creator: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true
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

module.exports = mongoose.model('Community', CommunitySchema);