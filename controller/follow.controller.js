import User from "../model/userSchema.js"
import Notification from "../model/notificationSchema.js" 
import mongoose from "mongoose"
import { followRequestEmail } from "../lib/emails/followRequestEmail.js"
import { acceptFollowEmail } from "../lib/emails/acceptFollowEmail.js"
import { rejectFollowEmail } from "../lib/emails/rejectFollowEmail.js"
import { followBackEmail } from "../lib/emails/followBackEmail.js"
import { unfollowEmail } from "../lib/emails/unfollowEmail.js"
import {sendMail} from "../lib/mail.js"
import { sendNotificationToUser, sendNotificationCountUpdate } from "../lib/socket.js"

export async function sendFollowRequest (req, res) {
  try {
    const senderId = req.user._id
    const { userId } = req.body     

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "Invalid user id" })
    }

    if (senderId.toString() === userId) {
      return res.status(400).json({ message: "You cannot follow yourself" })
    }

    const targetUser = await User.findById(userId)
    const senderUser = await User.findById(senderId)

    if (!targetUser) {
      return res.status(404).json({ message: "User not found" })
    }

    if (targetUser.followers.includes(senderId)) {
      return res.status(400).json({ message: "Already following this user" })
    }

    if (targetUser.followRequests.includes(senderId)) {
      return res.status(400).json({ message: "Request already sent" })
    }

    targetUser.followRequests.push(senderId)
    await targetUser.save()


    const notification = new Notification({
      sender: { id: senderId, name: senderUser.userName },
      receiver: [{ id: targetUser._id }],
      type: "follow",
      referenceId: senderId,
      referenceModel: "User",
      title: "New Follow Request",
      message: `${senderUser.userName} wants to follow you.`,
      link: `/explore`
    });
    await notification.save();

    // Send real-time notification
    sendNotificationToUser(targetUser._id.toString(), notification);
    sendNotificationCountUpdate(targetUser._id.toString(), 1);

    await sendMail({
      to: targetUser.email,
      subject: "New Follow Request on R-fit",
      html: followRequestEmail(senderUser.userName)
    })

    res.status(200).json({
      message: "Follow request sent successfully and email notification sent"
    })

  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

export async function acceptFollowRequest (req, res) {
  try {
    const currentUserId = req.user._id   
    const { userId } = req.body          

    const currentUser = await User.findById(currentUserId)
    const requesterUser = await User.findById(userId)

    if (!currentUser || !requesterUser) {
      return res.status(404).json({ message: "User not found" })
    }

    if (!currentUser.followRequests.includes(userId)) {
      return res.status(400).json({ message: "No follow request from this user" })
    }

    currentUser.followRequests = currentUser.followRequests.filter(
      id => id.toString() !== userId
    )

    if (!currentUser.followers.includes(userId)) {
      currentUser.followers.push(userId)
    }

    if (!requesterUser.following.includes(currentUserId)) {
      requesterUser.following.push(currentUserId)
    }

    await currentUser.save()
    await requesterUser.save()


    const notification = new Notification({
      sender: { id: currentUserId, name: currentUser.userName },
      receiver: [{ id: requesterUser._id }],
      type: "follow",
      referenceId: currentUserId,
      referenceModel: "User",
      title: "Follow Request Accepted",
      message: `${currentUser.userName} accepted your follow request.`,
      link: `/explore`
    });
    await notification.save();

    // Send real-time notification
    sendNotificationToUser(requesterUser._id.toString(), notification);
    sendNotificationCountUpdate(requesterUser._id.toString(), 1);

    await sendMail({
      to: requesterUser.email,
      subject: "Follow Request Accepted",
      html: acceptFollowEmail(currentUser.userName)
    })

    res.status(200).json({
      message: "Follow request accepted and email sent"
    })

  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

export async function rejectFollowRequest (req, res) {
  try {
    const currentUserId = req.user._id
    const { userId } = req.body   

    const currentUser = await User.findById(currentUserId)
    const requesterUser = await User.findById(userId)

    if (!currentUser || !requesterUser) {
      return res.status(404).json({ message: "User not found" })
    }

    if (!currentUser.followRequests.includes(userId)) {
      return res.status(400).json({ message: "No follow request from this user" })
    }

    currentUser.followRequests = currentUser.followRequests.filter(
      id => id.toString() !== userId
    )

    await currentUser.save()

    const notification = new Notification({
      sender: { id: currentUserId, name: currentUser.userName },
      receiver: [{ id: requesterUser._id }],
      type: "follow",
      referenceId: currentUserId,
      referenceModel: "User",
      title: "Follow Request Rejected",
      message: `${currentUser.userName} rejected your follow request.`,
      link: `/explore`
    });
    await notification.save();

    // Send real-time notification
    sendNotificationToUser(requesterUser._id.toString(), notification);
    sendNotificationCountUpdate(requesterUser._id.toString(), 1);

    await sendMail({
      to: requesterUser.email,
      subject: "Follow Request Rejected",
      html: rejectFollowEmail(currentUser.userName)
    })

    res.status(200).json({
      message: "Follow request rejected and email sent"
    })

  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

export async function followBack(req, res) {
  try {
    const myId = req.user._id;
    const { userId } = req.body;

    const me = await User.findById(myId);
    const otherUser = await User.findById(userId);

    me.following.push(userId);
    otherUser.followers.push(myId);

    await me.save();
    await otherUser.save();


    const notification = new Notification({
      sender: { id: myId, name: me.userName },
      receiver: [{ id: otherUser._id }],
      type: "follow",
      referenceId: myId,
      referenceModel: "User",
      title: "New Follower",
      message: `${me.userName} started following you.`,
      link: `/explore`
    });
    await notification.save();

    // Send real-time notification
    sendNotificationToUser(otherUser._id.toString(), notification);
    sendNotificationCountUpdate(otherUser._id.toString(), 1);

    await sendMail({
      to: otherUser.email,
      subject: "You have a new follower!",
      html: followBackEmail(me.userName)
    });

    return res.status(200).json({
      message: "Follow back successful and email sent"
    });

  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
}

export async function unfollowUser(req, res) {
  try {
    const currentUserId = req.user._id;
    const { userId } = req.body;

    const currentUser = await User.findById(currentUserId);
    const targetUser = await User.findById(userId);

    currentUser.following = currentUser.following.filter(
      id => id.toString() !== userId
    );

    targetUser.followers = targetUser.followers.filter(
      id => id.toString() !== currentUserId.toString()
    );

    await currentUser.save();
    await targetUser.save();


    const notification = new Notification({
      sender: { id: currentUserId, name: currentUser.userName },
      receiver: [{ id: targetUser._id }],
      type: "follow",
      referenceId: currentUserId,
      referenceModel: "User",
      title: "Unfollowed",
      message: `${currentUser.userName} unfollowed you.`,
      link: `/explore`
    });
    await notification.save();

    // Send real-time notification
    sendNotificationToUser(targetUser._id.toString(), notification);
    sendNotificationCountUpdate(targetUser._id.toString(), 1);

    await sendMail({
      to: targetUser.email,
      subject: "Someone unfollowed you",
      html: unfollowEmail(currentUser.userName)
    });

    res.status(200).json({ message: "User unfollowed successfully and email sent" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}

export async function getMyFollowers (req, res){
  try {

    const userId = req.user._id

    const user = await User.findById(userId)
      .select("followers")
      .populate("followers", "userName email profilePic age gender country city")

    if (!user) {
      return res.status(404).json({ message: "User not found" })
    }

    res.status(200).json({
      followers: user.followers
    })

  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}



export async function getMyFollowing (req, res){
  try {

    const userId = req.user._id

    const user = await User.findById(userId)
      .select("following")
      .populate("following", "userName email profilePic age gender country city")

    if (!user) {
      return res.status(404).json({ message: "User not found" })
    }

    res.status(200).json({
      following: user.following
    })

  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}


export async function getMyFollowRequests(req, res) {
  try {
    const userId = req.user._id;

    const user = await User.findById(userId)
      .select("followRequests")
      .populate(
        "followRequests",
        "userName avatar age gender country city"
      );

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.status(200).json({
      requests: user.followRequests
    });

  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
}

