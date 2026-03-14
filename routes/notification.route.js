import express from "express";
import { getNotifications, markAsSeen, markAllAsRead } from "../controller/notification.controller.js";
import { authMiddleware } from "../middleware/auth.middleware.js";


const route = express.Router();

route.get("/", authMiddleware, getNotifications);
route.post("/seen", authMiddleware, markAsSeen);
route.post("/read-all", authMiddleware, markAllAsRead);

export default route;