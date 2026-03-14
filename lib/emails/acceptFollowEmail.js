export const acceptFollowEmail = (currentUserName) => {
  return `
    <div style="font-family: sans-serif; text-align:center;">
      <h2>Your follow request has been accepted!</h2>
      <p><strong>${currentUserName}</strong> has accepted your follow request on R-fit.</p>
      <p>You can now see their posts and interact with them.</p>
      <br/>
      <p>Thanks,<br/>The R-fit Team</p>
    </div>
  `
}