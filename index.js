import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import cookieParser from "cookie-parser";
import dbConnect from "./lib/db.js";

import authRoute from "./routes/auth.route.js";
import followRoute from "./routes/follow.route.js";
import workoutRoute from "./routes/workout.route.js";
import nutritionRoute from "./routes/nutrition.route.js";
import likeRoute from "./routes/like.route.js";
import commentRoute from "./routes/comment.route.js";
import progressRoute from "./routes/progress.route.js";
import userDailyRoutineRoute from "./routes/user-daily-routine.route.js";
import alretRoute from "./routes/alret.route.js";
import notificationRoute from "./routes/notification.route.js";
import supportRoute from "./routes/support.route.js";

dotenv.config();

const app = express();

// CORS for frontend
app.use(cors({
  origin: ["https://fitness-app-frontend-blush.vercel.app", "http://localhost:5173", "https://fitness-app-frontend-*.vercel.app"],
  credentials: true
}));

app.use(express.json());
app.use(cookieParser());

// Connect DB
dbConnect();

// Static uploads (optional)
app.use("/uploads", express.static("uploads"));

// Routes
app.get("/", (req, res) => res.send("API running"));

app.use("/api/auth", authRoute);
app.use("/api/follow", followRoute);
app.use("/api/workout", workoutRoute);
app.use("/api/nutrition", nutritionRoute);
app.use("/api/likes", likeRoute);
app.use("/api/comments", commentRoute);
app.use("/api/progress", progressRoute);
app.use("/api/user-daily-routine", userDailyRoutineRoute);
app.use("/api/alret", alretRoute);
app.use("/api/notifications", notificationRoute);
app.use("/api/support", supportRoute);

export default app;
