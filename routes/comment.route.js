import express from "express"

import { authMiddleware } from "../middleware/auth.middleware.js"
import { createComment, deleteComment, getComments, updateComment } from "../controller/comment.controller.js"


const route = express.Router()

route.get("/", authMiddleware, getComments)
route.post("/", authMiddleware, createComment)
route.put("/:id", authMiddleware, updateComment)
route.delete("/:id", authMiddleware, deleteComment)



export default route