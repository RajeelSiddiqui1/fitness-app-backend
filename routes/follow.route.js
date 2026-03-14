import express from "express"
import { authMiddleware } from "../middleware/auth.middleware.js"
import {
  sendFollowRequest,
  acceptFollowRequest,
  rejectFollowRequest,
  getMyFollowers,
  getMyFollowing,
  getMyFollowRequests,
  followBack,
  unfollowUser
} from "../controller/follow.controller.js"

const route = express.Router()

route.post("/follow-request", authMiddleware, sendFollowRequest)
route.get("/get-follow-request", authMiddleware, getMyFollowRequests)
route.post("/accept-follow", authMiddleware, acceptFollowRequest)
route.post("/reject-follow", authMiddleware, rejectFollowRequest)
route.get("/my-followers", authMiddleware, getMyFollowers)
route.get("/my-following", authMiddleware, getMyFollowing)
route.post("/follow-back", authMiddleware, followBack)
route.post("/unfollow", authMiddleware, unfollowUser);

export default route