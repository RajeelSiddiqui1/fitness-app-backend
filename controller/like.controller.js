import Like from "../model/likeSchema.js";
import Comment from "../model/commentSchema.js";
import Workout from "../model/workoutSchema.js";
import Nutrition from "../model/nutritionSchema.js";
import User from "../model/userSchema.js";
import { notifyOwner } from "../lib/notifyOwner.js";
import { workoutLikeEmailTemplate } from "../lib/emails/workoutLike.email.js";
import { nutritionLikeEmailTemplate } from "../lib/emails/nutritionLike.email.js";

export async function getLikes(req, res) {
  try {
    const userId = req.user.id;
    const { targetId, targetType } = req.query;


    const likes = await Like.find({ targetId, targetType })
      .populate("userId", "userName avatar")
      .sort({ createdAt: -1 });

    const userLiked = likes.some((l) => String(l.userId._id) === String(userId));

    return res.status(200).json({
      total: likes.length,
      userLiked,
      users: likes.map((l) => l.userId)
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
}

export async function toggleLike(req, res) {
  try {
    const userId = req.user.id;
    const { targetId, targetType } = req.body;

    const existing = await Like.findOne({ userId, targetId, targetType });

    if (existing) {
      await Like.findByIdAndDelete(existing._id);
      return res.status(200).json({ liked: false });
    }

    await Like.create({ userId, targetId, targetType });

    // ---- Handle notifications based on target type ----
    let ownerDoc = null;
    let shouldNotify = false;

    if (targetType === "Workout") {
      ownerDoc = await Workout.findById(targetId).select("userId");
      // Only notify if liking someone else's workout
      shouldNotify = ownerDoc && String(ownerDoc.userId) !== String(userId);
    } else if (targetType === "Nutrition") {
      ownerDoc = await Nutrition.findById(targetId).select("userId");
      // Only notify if liking someone else's nutrition
      shouldNotify = ownerDoc && String(ownerDoc.userId) !== String(userId);
    } else if (targetType === "Comment") {
      // Check if the comment belongs to the user
      ownerDoc = await Comment.findById(targetId).select("userId");
      
      // Only notify if liking someone else's comment
      // Also check if the comment is a reply to their own comment
      if (ownerDoc && String(ownerDoc.userId) !== String(userId)) {
        // This is a like on someone else's comment - check if it's a reply
        const commentDoc = await Comment.findById(targetId);
        
        if (commentDoc && commentDoc.parentComment) {
          // This is a reply - also check if the parent comment belongs to the liker
          const parentComment = await Comment.findById(commentDoc.parentComment).select("userId");
          // Notify only if neither the reply nor the parent comment belongs to the liker
          shouldNotify = parentComment && String(parentComment.userId) !== String(userId);
        } else {
          shouldNotify = true;
        }
      } else {
        shouldNotify = false;
      }
    }

    // fire & forget - only notify for others' content
    if (shouldNotify && ownerDoc) {
      const targetLabel = targetType === "Comment" ? "comment" : targetType.toLowerCase();
      
      notifyOwner({
        ownerId: ownerDoc.userId,
        actorId: userId,
        actorName: req.user.userName,
        type: "like",
        referenceId: targetId,
        referenceModel: targetType,
        title: "New like",
        message: `${req.user.userName} liked your ${targetLabel}`,
        link: targetType === "Comment" ? undefined : `/achievements/${targetType.toLowerCase()}/${targetId}`,
        emailTemplate:
          targetType === "Workout"
            ? workoutLikeEmailTemplate
            : targetType === "Nutrition"
            ? nutritionLikeEmailTemplate
            : undefined
      }).catch(console.error);
    }

    return res.status(201).json({ liked: true });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
}