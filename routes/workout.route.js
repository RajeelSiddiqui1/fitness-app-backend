import expres from "express"
import { createWorkout, deleteWorkout, getAllWorkouts, getWorkoutById, toggleWorkout, updateWorkout, workoutStatus } from "../controller/workout.controller.js"
import { authMiddleware } from "../middleware/auth.middleware.js"


const route = expres.Router()

route.get("/", authMiddleware, getAllWorkouts)
route.get("/:id", authMiddleware, getWorkoutById)
route.post("/create/workout", authMiddleware, createWorkout)
route.put("/update/workout/:id", authMiddleware, updateWorkout)
route.delete("/delete/workout/:id", authMiddleware, deleteWorkout)
route.patch("/status-update/workout/:id", authMiddleware, workoutStatus)
route.patch("/toggle/workout/:id", authMiddleware, toggleWorkout)

export default route