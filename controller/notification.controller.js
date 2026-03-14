import Notification from "../model/notificationSchema.js";
import mongoose from "mongoose";

export async function getNotifications(req, res) {
  try {
    const userId = req.user._id;
    const { page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    const notifications = await Notification.find({ "receiver.id": userId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate("sender.id", "userName avatar");

    const total = await Notification.countDocuments({ "receiver.id": userId });

    res.status(200).json({ 
      notifications,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / limit)
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}

export async function markAsSeen(req, res) {
  try {
    const userId = req.user._id;
    const { notificationId } = req.body;

    if (!mongoose.Types.ObjectId.isValid(notificationId)) {
      return res.status(400).json({ message: "Invalid notification id" });
    }

    const notification = await Notification.findById(notificationId);
    if (!notification) {
      return res.status(404).json({ message: "Notification not found" });
    }

    const alreadySeen = notification.seenBy.some(
      s => s.userId.toString() === userId.toString()
    );

    if (!alreadySeen) {
      notification.seenBy.push({ userId });
      notification.seen = true;
      await notification.save();
    }

    res.status(200).json({ message: "Notification marked as seen", link: notification.link });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}

export async function markAllAsRead(req, res) {
  try {
    const userId = req.user._id;

    await Notification.updateMany(
      { "receiver.id": userId, read: false },
      { $set: { read: true } }
    );

    res.status(200).json({ message: "All notifications marked as read" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}