export const followRequestEmail = (senderName) => {
  return `
    <div style="font-family: sans-serif; text-align:center;">
      <h2>You have a new follow request!</h2>
      <p><strong>${senderName}</strong> has sent you a follow request on R-fit.</p>
      <p>Visit your profile to accept or reject this request.</p>
      <br/>
      <p>Thanks,<br/>The R-fit Team</p>
    </div>
  `
}