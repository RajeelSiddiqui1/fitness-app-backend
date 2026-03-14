import expres from "express"

import { authMiddleware } from "../middleware/auth.middleware.js"
import { createnutritions, deleteNutrition, getAllNutrition, getNutritionById, nutritionStatus, toggleNutrition, updateNutrition } from "../controller/nutrition.controller.js"


const route = expres.Router()

route.get("/", authMiddleware, getAllNutrition)
route.get("/:id", authMiddleware, getNutritionById)
route.post("/create/nutrition", authMiddleware, createnutritions)
route.put("/update/nutrition/:id", authMiddleware, updateNutrition)
route.delete("/delete/nutrition/:id", authMiddleware, deleteNutrition)
route.patch("/status-update/nutrition/:id", authMiddleware, nutritionStatus)
route.patch("/toggle/nutrition/:id", authMiddleware, toggleNutrition)


export default route