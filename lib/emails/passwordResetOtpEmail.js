export const passwordResetOtpEmail = (otp) => {
  return `
    <div style="font-family: sans-serif; text-align:center;">
      <h2>Welcome to R-fit!</h2>
      <p>Your Password reset otp:</p>
      <h1 style="color: #FF69B4;">${otp}</h1>
      <p>This OTP will expire in 10 minutes.</p>
      <p>Thanks,<br/>The R-fit Team</p>
    </div>
  `
}