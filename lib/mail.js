import nodemailer from "nodemailer"

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER, 
    pass: process.env.EMAIL_PASS,  
  }
})


export const sendMail = async ({ to, subject, html }) => {
  try {
    const mailOptions = {
      from: `"R-fit Team" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html,
    }

    const info = await transporter.sendMail(mailOptions)
    console.log("Mail sent:", info.messageId)
    return info
  } catch (err) {
    console.error("Error sending mail:", err.message)
    throw err
  }
}