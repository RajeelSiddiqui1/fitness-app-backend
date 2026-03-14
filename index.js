import express from "express"
import dotenv from "dotenv"
import cors from "cors" 
import dbConnect from "./lib/db.js"
import authRoute from "./routes/auth.route.js"
import followRoute from "./routes/follow.route.js"
import workoutRoute from "./routes/workout.route.js"
import nutritionRoute from "./routes/nutrition.route.js"
import likeRoute from "./routes/like.route.js"
import commentRoute from "./routes/comment.route.js"
import progressRoute from "./routes/progress.route.js"
import userDailyRoutineRoute from "./routes/user-daily-routine.route.js"
import alretRoute from "./routes/alret.route.js"
import notificationRoute from "./routes/notification.route.js"
import supportRoute from "./routes/support.route.js"
import "./cron/alertsCron.js"
import cookieParser from "cookie-parser"
import { createServer } from "http"
import { Server } from "socket.io"




dotenv.config()

const PORT = process.env.PORT


const app = express()
const httpServer = createServer(app)
const io = new Server(httpServer, {
  cors: {
    origin: [
      "http://localhost:5173",
      "https://tcfkn8x6-5173.inc1.devtunnels.ms"
    ],
    credentials: true
  }
})

// Store user sockets: userId -> socketId
const userSockets = new Map()

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log('User connected:', socket.id)
  
  // User joins with their userId
  socket.on('join', (userId) => {
    userSockets.set(userId, socket.id)
    socket.join(`user_${userId}`)
    console.log(`User ${userId} joined with socket ${socket.id}`)
  })
  
  // Handle disconnect
  socket.on('disconnect', () => {
    // Find and remove user from userSockets
    for (const [userId, socketId] of userSockets.entries()) {
      if (socketId === socket.id) {
        userSockets.delete(userId)
        console.log(`User ${userId} disconnected`)
        break
      }
    }
  })
})

// Export io and userSockets for use in controllers
export { io, userSockets }

app.use(cors({
  origin: [
    "http://localhost:5173",
    "fitness-app-frontend-blush.vercel.app",
    "https://tcfkn8x6-5173.inc1.devtunnels.ms"
  ],
  credentials: true
}))

app.use("/uploads", express.static("uploads"));

app.use(express.json())
app.use(cookieParser())


dbConnect()

app.get("/", (req, res) => {
  res.send("welcome")
})

app.use("/api/auth", authRoute)
app.use("/api/follow", followRoute)
app.use("/api/workout", workoutRoute)
app.use("/api/nutrition", nutritionRoute)
app.use("/api/likes", likeRoute)
app.use("/api/comments", commentRoute)
app.use("/api/progress", progressRoute)
app.use("/api/user-daily-routine", userDailyRoutineRoute)
app.use("/api/alret", alretRoute)
app.use("/api/notifications", notificationRoute)
app.use("/api/support", supportRoute)

httpServer.listen(PORT || 5006,()=>{
    console.log(`PORT running on ${PORT}`)
} )