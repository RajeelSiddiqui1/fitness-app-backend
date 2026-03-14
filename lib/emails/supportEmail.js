export const supportEmail = (userName, userEmail, issueType, message) => {
  return `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #FF69B4; text-align: center;">New Support Request</h2>
      
      <div style="background: #f5f5f5; padding: 20px; border-radius: 10px; margin: 20px 0;">
        <h3 style="margin-bottom: 15px;">User Details</h3>
        <p><strong>Name:</strong> ${userName}</p>
        <p><strong>Email:</strong> ${userEmail}</p>
        <p><strong>Issue Type:</strong> ${issueType}</p>
      </div>

      <div style="background: #fff; padding: 20px; border-radius: 10px; border: 1px solid #e0e0e0;">
        <h3 style="margin-bottom: 15px;">Message</h3>
        <p style="line-height: 1.6;">${message.replace(/\n/g, '<br>')}</p>
      </div>

      <p style="text-align: center; color: #888; margin-top: 20px;">
        This request was submitted through R-fit Support System
      </p>
    </div>
  `
}

export const supportConfirmationEmail = (userName, issueType) => {
  return `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; text-align: center;">
      <h2 style="color: #FF69B4;">Support Request Received</h2>
      
      <p>Hi ${userName},</p>
      
      <p>Thank you for contacting R-fit Support. We have received your request regarding <strong>"${issueType}"</strong>.</p>
      
      <p>Our team will review your request and get back to you as soon as possible, usually within 24-48 hours.</p>
      
      <div style="margin: 30px 0; padding: 20px; background: #f5f5f5; border-radius: 10px;">
        <p style="margin: 0;"><strong>Best regards,</strong><br/>The R-fit Team</p>
      </div>
      
      <p style="color: #888; font-size: 12px;">
        This is an automated confirmation. Please do not reply to this email.
      </p>
    </div>
  `
}
