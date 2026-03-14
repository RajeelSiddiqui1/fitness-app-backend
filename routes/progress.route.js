import express from "express"
import { authMiddleware } from "../middleware/auth.middleware.js"
import { createProgress, deleteProgress, getAllProgress, getProgressById, updateProgress } from "../controller/progress.controller.js"

const route = express.Router()

route.get("/", authMiddleware,getAllProgress)
route.get("/:id", authMiddleware,getProgressById)
route.post("/create/progress", authMiddleware, createProgress)
route.put("/update/progress/:id", authMiddleware, updateProgress)
route.delete("/delete/progress/:id", authMiddleware, deleteProgress)

export default route