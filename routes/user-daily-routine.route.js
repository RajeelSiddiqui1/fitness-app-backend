import express from "express"
import { authMiddleware } from "../middleware/auth.middleware.js"
import { getPublicNutritionDetail, getPublicWorkoutDetail, getUserNutritions, getUserWorkout, getMyAchievements } from "../controller/user-daily-routine.controller.js"

const route = express.Router()

route.get("/nutrition", authMiddleware, getUserNutritions)
route.get("/workout", authMiddleware, getUserWorkout)
route.get("/workout/:id", authMiddleware, getPublicWorkoutDetail)
route.get("/nutrition/:id", authMiddleware, getPublicNutritionDetail)
route.get("/my-achievements", authMiddleware, getMyAchievements)

export default route    