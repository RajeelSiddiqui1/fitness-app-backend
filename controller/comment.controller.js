import Comment from "../model/commentSchema.js";
import Like from "../model/likeSchema.js";
import Workout from "../model/workoutSchema.js";
import Nutrition from "../model/nutritionSchema.js";
import User from "../model/userSchema.js";

import { notifyOwner } from "../lib/notifyOwner.js";
import { workoutCommentEmailTemplate } from "../lib/emails/workoutComment.email.js";
import { nutritionCommentEmailTemplate } from "../lib/emails/nutritionComment.email.js";


export async function getComments(req, res) {
  try {
    const userId = req.user.id;
    const { targetId, targetType, page = 1, limit = 5 } = req.query;
    const skip = (page - 1) * limit;

    // Helper function to recursively fetch replies (supports infinite nesting like Facebook)
    const fetchRepliesRecursively = async (commentId, depth = 0) => {
      // No depth limit - supports unlimited nesting like Facebook
      const replies = await Comment.find({ parentComment: commentId })
        .populate("userId", "userName avatar")
        .sort({ createdAt: 1 });

      const repliesWithNested = await Promise.all(
        replies.map(async (reply) => {
          const replyLikeCount = await Like.countDocuments({
            targetId: reply._id,
            targetType: "Comment"
          });
          const replyUserLiked = await Like.exists({
            targetId: reply._id,
            targetType: "Comment",
            userId
          });
          
          // Recursively get nested replies (reply to reply to reply...)
          const nestedReplies = await fetchRepliesRecursively(reply._id, depth + 1);
          
          return {
            ...reply.toObject(),
            replies: nestedReplies,
            likeCount: replyLikeCount,
            userLiked: !!replyUserLiked
          };
        })
      );
      
      return repliesWithNested;
    };

    // Top-level comments (parentComment == null)
    const comments = await Comment.find({
      targetId,
      targetType,
      parentComment: null
    })
      .populate("userId", "userName avatar")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const formattedComments = await Promise.all(
      comments.map(async (c) => {
        // Get nested replies recursively (supports infinite levels)
        const replies = await fetchRepliesRecursively(c._id, 0);

        // likes for this comment
        const likeCount = await Like.countDocuments({
          targetId: c._id,
          targetType: "Comment"
        });

        const userLiked = await Like.exists({
          targetId: c._id,
          targetType: "Comment",
          userId
        });

        return {
          ...c.toObject(),
          replies,
          likeCount,
          userLiked: !!userLiked
        };
      })
    );

    return res.status(200).json(formattedComments);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
}

export async function createComment(req, res) {
  try {
    const userId = req.user.id;
    const { targetId, targetType, text, parentComment } = req.body;

    const comment = await Comment.create({
      userId,
      targetId,
      targetType,
      text,
      parentComment: parentComment || null
    });

    // Check if this is a reply to another comment
    if (parentComment) {
      // This is a reply to a comment - find the parent comment owner
      const parentCommentDoc = await Comment.findById(parentComment).select("userId");
      
      // Only notify if replying to someone else's comment
      if (parentCommentDoc && String(parentCommentDoc.userId) !== String(userId)) {
        const parentCommentOwner = await User.findById(parentCommentDoc.userId).select("userName email");
        
        notifyOwner({
          ownerId: parentCommentDoc.userId,
          actorId: userId,
          actorName: req.user.userName,
          type: "comment",
          referenceId: targetId,
          referenceModel: targetType,
          title: "New reply",
          message: `${req.user.userName} replied to your comment`,
          link: `/achievements/${targetType.toLowerCase()}/${targetId}`,
          emailTemplate: (payload) =>
            targetType === "Workout"
              ? workoutCommentEmailTemplate({ ...payload, comment: text })
              : nutritionCommentEmailTemplate({ ...payload, comment: text })
        }).catch(console.error);
      }
    } else {
      // This is a top-level comment on workout/nutrition - find the content owner
      let ownerDoc = null;

      if (targetType === "Workout") {
        ownerDoc = await Workout.findById(targetId).select("userId");
      } else {
        ownerDoc = await Nutrition.findById(targetId).select("userId");
      }

      // fire & forget - only notify if commenting on someone else's content
      if (ownerDoc && String(ownerDoc.userId) !== String(userId)) {
        notifyOwner({
          ownerId: ownerDoc.userId,
          actorId: userId,
          actorName: req.user.userName,
          type: "comment",
          referenceId: targetId,
          referenceModel: targetType,
          title: "New comment",
          message: `${req.user.userName} commented on your ${targetType.toLowerCase()}`,
          link: `/achievements/${targetType.toLowerCase()}/${targetId}`,
          emailTemplate: (payload) =>
            targetType === "Workout"
              ? workoutCommentEmailTemplate({ ...payload, comment: text })
              : nutritionCommentEmailTemplate({ ...payload, comment: text })
        }).catch(console.error);
      }
    }

    return res.status(201).json(comment);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
}



export async function updateComment(req, res) {
  try {

    const userId = req.user.id;
    const commentId = req.params.id;
    const { text } = req.body;

    const updated = await Comment.findOneAndUpdate(
      { _id: commentId, userId },
      { text },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ message: "Comment not found" });
    }

    return res.status(200).json(updated);

  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
}



export async function deleteComment(req, res) {
  try {

    const userId = req.user.id;
    const commentId = req.params.id;

    const deleted = await Comment.findOneAndDelete({
      _id: commentId,
      userId
    });

    if (!deleted) {
      return res.status(404).json({ message: "Comment not found" });
    }


    await Comment.deleteMany({
      parentComment: commentId
    });

    return res.status(200).json({ message: "Comment deleted" });

  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
}