const mongoose = require('mongoose');

const PostSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true
  },
  content: {
    type: String,
    required: [true, 'Please add some content'],
    maxlength: [5000, 'Post cannot be more than 5000 characters']
  },
  image: {
    type: String
  },
  verse: {
    text: String,
    reference: String,
    translation: String
  },
  likes: [{
    type: mongoose.Schema.ObjectId,
    ref: 'User'
  }],
  comments: [{
    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'User'
    },
    text: {
      type: String,
      required: true,
      maxlength: [1000, 'Comment cannot be more than 1000 characters']
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  prayers: [{
    type: mongoose.Schema.ObjectId,
    ref: 'User'
  }],
  shares: {
    type: Number,
    default: 0
  },
  tags: [{
    type: String
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

// Add text index for search
PostSchema.index({ content: 'text', 'verse.text': 'text' });

module.exports = mongoose.model('Post', PostSchema);