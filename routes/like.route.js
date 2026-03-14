import express from "express"

import { authMiddleware } from "../middleware/auth.middleware.js"
import { getLikes, toggleLike } from "../controller/like.controller.js"


const route = express.Router()

route.get("/", authMiddleware, getLikes)
route.post("/", authMiddleware, toggleLike)



export default route