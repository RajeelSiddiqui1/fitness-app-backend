export const rejectFollowEmail = (currentUserName) => {
  return `
    <div style="font-family: sans-serif; text-align:center;">
      <h2>Your follow request has been rejected</h2>
      <p><strong>${currentUserName}</strong> has rejected your follow request on R-fit.</p>
      <p>Don't worry, you can try following other users!</p>
      <br/>
      <p>Thanks,<br/>The R-fit Team</p>
    </div>
  `
}