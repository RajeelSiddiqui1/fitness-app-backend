import { sendMail } from "../lib/mail.js"
import { supportEmail, supportConfirmationEmail } from "../lib/emails/supportEmail.js"
import SupportTicket from "../model/supportTicketSchema.js"

const SUPPORT_EMAIL = "rajeelsiddiqui3@gmail.com"

// Submit a new support request
export async function submitSupportRequest(req, res) {
  try {
    const userId = req.user.id
    const user = req.user

    const { issueType, message } = req.body

    if (!issueType || !message) {
      return res.status(400).json({ message: "Issue type and message are required" })
    }

    if (!user || !user.email || !user.userName) {
      return res.status(400).json({ message: "User information not found" })
    }

    // Save ticket to database
    const ticket = new SupportTicket({
      userId,
      userName: user.userName,
      userEmail: user.email,
      issueType,
      message
    })
    await ticket.save()

    // Send email to support team (rajeelsiddiqui3@gmail.com)
    await sendMail({
      to: SUPPORT_EMAIL,
      subject: `New Support Request: ${issueType} - From ${user.userName}`,
      html: supportEmail(user.userName, user.email, issueType, message)
    })

    // Send confirmation email to the user
    await sendMail({
      to: user.email,
      subject: "R-fit Support - We received your request",
      html: supportConfirmationEmail(user.userName, issueType)
    })

    return res.status(201).json({ 
      message: "Support request submitted successfully. Check your email for confirmation.",
      ticket
    })

  } catch (error) {
    console.error("Support request error:", error)
    return res.status(500).json({ message: "Failed to submit support request" })
  }
}

// Get all tickets (admin only)
export async function getAllTickets(req, res) {
  try {
    const { status, page = 1, limit = 10 } = req.query
    
    let query = {}
    if (status && status !== 'all') {
      query.status = status
    }

    const tickets = await SupportTicket.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .populate('userId', 'userName email avatar')

    const total = await SupportTicket.countDocuments(query)

    return res.status(200).json({
      tickets,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      total
    })
  } catch (error) {
    console.error("Get tickets error:", error)
    return res.status(500).json({ message: "Failed to fetch tickets" })
  }
}

// Get ticket by ID (admin only)
export async function getTicketById(req, res) {
  try {
    const { id } = req.params
    
    const ticket = await SupportTicket.findById(id).populate('userId', 'userName email avatar')
    
    if (!ticket) {
      return res.status(404).json({ message: "Ticket not found" })
    }

    return res.status(200).json({ ticket })
  } catch (error) {
    console.error("Get ticket error:", error)
    return res.status(500).json({ message: "Failed to fetch ticket" })
  }
}

// Update ticket status (admin only)
export async function updateTicketStatus(req, res) {
  try {
    const { id } = req.params
    const { status, adminResponse } = req.body

    if (!status) {
      return res.status(400).json({ message: "Status is required" })
    }

    const validStatuses = ["pending", "in_progress", "resolved", "closed"]
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: "Invalid status" })
    }

    const ticket = await SupportTicket.findById(id)
    
    if (!ticket) {
      return res.status(404).json({ message: "Ticket not found" })
    }

    ticket.status = status
    if (adminResponse) {
      ticket.adminResponse = adminResponse
    }
    if (status === "resolved" || status === "closed") {
      ticket.resolvedAt = new Date()
    }
    
    await ticket.save()

    // Send email to user about status update
    if (adminResponse) {
      await sendMail({
        to: ticket.userEmail,
        subject: `R-fit Support - Your request has been ${status}`,
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #FF69B4;">Support Request Update</h2>
            <p>Hi ${ticket.userName},</p>
            <p>Your support request regarding <strong>"${ticket.issueType}"</strong> has been updated.</p>
            <div style="background: #f5f5f5; padding: 20px; border-radius: 10px; margin: 20px 0;">
              <p><strong>Status:</strong> ${status}</p>
              <p><strong>Response:</strong></p>
              <p>${adminResponse.replace(/\n/g, '<br>')}</p>
            </div>
            <p>Best regards,<br/>The R-fit Team</p>
          </div>
        `
      })
    }

    return res.status(200).json({ 
      message: "Ticket updated successfully",
      ticket
    })
  } catch (error) {
    console.error("Update ticket error:", error)
    return res.status(500).json({ message: "Failed to update ticket" })
  }
}

// Get admin dashboard stats
export async function getAdminStats(req, res) {
  try {
    const totalTickets = await SupportTicket.countDocuments()
    const pendingTickets = await SupportTicket.countDocuments({ status: "pending" })
    const inProgressTickets = await SupportTicket.countDocuments({ status: "in_progress" })
    const resolvedTickets = await SupportTicket.countDocuments({ status: "resolved" })

    // Get tickets by issue type
    const ticketsByType = await SupportTicket.aggregate([
      { $group: { _id: "$issueType", count: { $sum: 1 } } }
    ])

    // Get recent tickets
    const recentTickets = await SupportTicket.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('userId', 'userName email avatar')

    return res.status(200).json({
      stats: {
        total: totalTickets,
        pending: pendingTickets,
        inProgress: inProgressTickets,
        resolved: resolvedTickets
      },
      ticketsByType,
      recentTickets
    })
  } catch (error) {
    console.error("Get admin stats error:", error)
    return res.status(500).json({ message: "Failed to fetch stats" })
  }
}
