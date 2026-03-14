import mongoose from "mongoose";

const { Schema, model, models } = mongoose;

const commentSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    targetId: {
      type: Schema.Types.ObjectId,
      required: true
    },

    targetType: {
      type: String,
      enum: ["Workout", "Nutrition"],
      required: true
    },

    text: {
      type: String,
      required: true
    },


    parentComment: {
      type: Schema.Types.ObjectId,
      ref: "Comment",
      default: null
    }

  },
  { timestamps: true }
);

const Comment = models.Comment || model("Comment", commentSchema);

export default Comment;