import mongoose from "mongoose";

const { model, models, Schema } = mongoose;

const supportTicketSchema = new Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    userName: {
      type: String,
      required: true
    },
    userEmail: {
      type: String,
      required: true
    },
    issueType: {
      type: String,
      required: true,
      enum: ["account", "workout", "nutrition", "progress", "technical", "feedback", "other"]
    },
    message: {
      type: String,
      required: true
    },
    status: {
      type: String,
      enum: ["pending", "in_progress", "resolved", "closed"],
      default: "pending"
    },
    adminResponse: {
      type: String,
      default: ""
    },    resolvedAt: {
      type: Date
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    }
  },
  { timestamps: true }
);

const SupportTicket = models.SupportTicket || model("SupportTicket", supportTicketSchema);

export default SupportTicket;
