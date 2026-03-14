import Notification from "../model/notificationSchema.js";
import { sendNotificationToUser, sendNotificationCountUpdate } from "./socket.js";

export async function createNotification({
  senderId,
  senderName,
  receiverId,
  type,
  referenceId,
  referenceModel,
  title,
  message,
  link
}) {

  const notification = await Notification.create({
    sender: {
      id: senderId,
      name: senderName
    },

    receiver: [
      {
        id: receiverId
      }
    ],

    type,
    referenceId,
    referenceModel,
    title,
    message,
    link
  });

  // Send real-time notification via Socket.IO
  sendNotificationToUser(receiverId, {
    _id: notification._id,
    type,
    title,
    message,
    sender: { id: senderId, name: senderName },
    link,
    createdAt: notification.createdAt,
    read: false
  });

  // Update unread count for the receiver
  const unreadCount = await Notification.countDocuments({
    receiver: { $elemMatch: { id: receiverId, read: false } }
  });
  sendNotificationCountUpdate(receiverId, unreadCount);

  return notification;

}