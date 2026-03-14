import express from "express"
import { 
  submitSupportRequest, 
  getAllTickets, 
  getTicketById, 
  updateTicketStatus,
  getAdminStats 
} from "../controller/support.controller.js"
import { authMiddleware, adminMiddleware } from "../middleware/auth.middleware.js"

const route = express.Router()

// User routes
route.post("/submit", authMiddleware, submitSupportRequest)

// Admin routes
route.get("/admin/tickets", authMiddleware, adminMiddleware, getAllTickets)
route.get("/admin/ticket/:id", authMiddleware, adminMiddleware, getTicketById)
route.put("/admin/ticket/:id", authMiddleware, adminMiddleware, updateTicketStatus)
route.get("/admin/stats", authMiddleware, adminMiddleware, getAdminStats)

export default route
