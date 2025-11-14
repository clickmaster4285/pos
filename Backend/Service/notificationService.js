// services/notificationService.js
const Notification = require('../models/notification');

async function createAndSendNotification(io, payload) {
  const {
    companyId,
    userId = null,
    type = 'SYSTEM',
    title,
    message,
    meta = {},
  } = payload;

  // 1) Save in DB
  const notification = await Notification.create({
    companyId,
    userId,
    type,
    title,
    message,
    meta,
  });

  // 2) Emit in real-time
  if (userId) {
    // specific user
    io.to(`user:${userId}`).emit('notification:new', notification);
  } else {
    // whole company
    io.to(`company:${companyId}`).emit('notification:new', notification);
  }

  return notification;
}

module.exports = { createAndSendNotification };
