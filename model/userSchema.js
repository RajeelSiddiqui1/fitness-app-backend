import mongoose from "mongoose";

const { model, models, Schema } = mongoose;

const userSchema = new Schema(
  {
    userName: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    password: {
      type: String,
      required: true,
    },

    age: {
      type: Number,
      required: true,
    },

    gender: {
      type: String,
      enum: ["Male", "Female", "Other"],
      required: true,
    },

    country: {
      type: String,
    },

    city: {
      type: String,
    },

    avatar: {
      type: String,
      default: "",
    },

    followers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],

    following: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],

    followRequests: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],

    isVerified: {
      type: Boolean,
      default: false
    },
    otp: {
      type: String
    },
    otpPassword: {
      type: String
    },
    otpExpiresAt: {
      type: Date
    },
    notification: {
      type: Boolean,
      default: true
    },
    mail: {
      type: Boolean,
      default: true
    },
    measurementUnit: {
      type: String,
      enum: ["kg", "lb"],
      default: "kg"
    },
    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user"
    }
  },
  { timestamps: true }
);

const User = models.User || model("User", userSchema);

export default User;
