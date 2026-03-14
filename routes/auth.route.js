import express from "express"
import { fetchUsersForExplore, passwordReset, passwordResetOtp, passwordVerifyOtp, resendOtp, toggleMail, toggleMeasurementUnit, toggleNotification, updateProfile, userLogin, userLogout, userRegister, verifyOtp, verifyToken } from "../controller/auth.controller.js"
import { getUserProfile, getUserFollowers, getUserFollowing } from "../controller/user-profile.controller.js"
import { authMiddleware } from "../middleware/auth.middleware.js"
import uploadImage from "../middleware/upload-image.middleware.js"


const route = express.Router()

route.post("/register", userRegister)
route.post("/verify-otp", verifyOtp)
route.post("/resend-otp", resendOtp)
route.post("/password-reset-otp", passwordResetOtp)
route.post("/verify-password-otp", passwordVerifyOtp)
route.post("/password-reset", passwordReset)
route.post("/login", userLogin)
route.get('/verify', authMiddleware, verifyToken);
route.put("/update-profile", authMiddleware, uploadImage.single("avatar") ,updateProfile)
route.post("/logout", authMiddleware, userLogout)
route.patch("/notification-toggle", authMiddleware, toggleNotification)
route.patch("/mail-toggle", authMiddleware, toggleMail)
route.patch("/measurement-toggle", authMiddleware, toggleMeasurementUnit)
route.patch("/fetch-users", authMiddleware, fetchUsersForExplore)

route.get("/me", authMiddleware, (req,res)=>{
    res.status(200).json({
        user:req.user
    })
})

route.get("/user/:userId", authMiddleware, getUserProfile)
route.get("/user/:userId/followers", authMiddleware, getUserFollowers)
route.get("/user/:userId/following", authMiddleware, getUserFollowing)

export default route