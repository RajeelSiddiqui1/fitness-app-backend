import jwt from "jsonwebtoken"
import User from "../model/userSchema.js"
import mongoose from "mongoose"
import dotenv from "dotenv"

dotenv.config()

export const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization
    if (!authHeader?.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Unauthorized: No token" })
    }

    const token = authHeader.split(" ")[1]
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    const userId = decoded.id

    const user = await User.findById(userId).select("-password")
    if (!user) return res.status(401).json({ message: "User not found" })

    req.user = user
    next()
  } catch (error) {
    console.log("AuthMiddleware Error:", error.message)
    return res.status(401).json({ message: "Invalid token" })
  }
}

export const adminMiddleware = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" })
    }

    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Access denied. Admin only." })
    }

    next()
  } catch (error) {
    console.log("AdminMiddleware Error:", error.message)
    return res.status(403).json({ message: "Access denied" })
  }
}
