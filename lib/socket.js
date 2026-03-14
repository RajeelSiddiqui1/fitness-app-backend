import { io, userSockets } from '../index.js';

/**
 * Send notification to a specific user via Socket.io
 * @param {string} userId - The user ID to send notification to
 * @param {object} notification - The notification object
 */
export const sendNotificationToUser = (userId, notification) => {
  // Send to the specific user's room
  io.to(`user_${userId}`).emit('newNotification', notification);
  console.log(`Notification sent to user ${userId}:`, notification.title);
};

/**
 * Send notification count update to a specific user
 * @param {string} userId - The user ID to send update to
 * @param {number} unreadCount - The new unread count
 */
export const sendNotificationCountUpdate = (userId, unreadCount) => {
  io.to(`user_${userId}`).emit('notificationCountUpdate', { unreadCount });
  console.log(`Notification count update sent to user ${userId}: ${unreadCount}`);
};
