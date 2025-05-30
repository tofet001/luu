// utils/notificationService.js
const Notification = require('../models/Notification');

exports.createNotification = async (userId, message, type, relatedId) => {
  await Notification.create({
    user: userId,
    message,
    type, // 'like', 'comment', 'prayer', 'follow', etc.
    relatedId, // ID of the related post/prayer/event
    isRead: false
  });
  
  // Emit real-time notification via Socket.io
  io.to(userId).emit('newNotification', { message });
};