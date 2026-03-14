// For Vercel serverless: io will be undefined in serverless environment
// Socket.io only works with persistent servers, not serverless functions
let io = null;
let userSockets = new Map();

// Export setter functions to be called from index.js when server runs persistently
export const setSocketIO = (socketIO) => {
  io = socketIO;
};

export const setUserSockets = (sockets) => {
  userSockets = sockets;
};

/**
 * Send notification to a specific user via Socket.io
 * @param {string} userId - The user ID to send notification to
 * @param {object} notification - The notification object
 */
export const sendNotificationToUser = (userId, notification) => {
  if (!io) {
    // Socket.io not available (running in serverless or no persistent server)
    console.log(`[Socket] Notification (mock): to user ${userId}:`, notification.title);
    return;
  }
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
  if (!io) {
    // Socket.io not available (running in serverless or no persistent server)
    console.log(`[Socket] Notification count (mock): to user ${userId}: ${unreadCount}`);
    return;
  }
  io.to(`user_${userId}`).emit('notificationCountUpdate', { unreadCount });
  console.log(`Notification count update sent to user ${userId}: ${unreadCount}`);
};
