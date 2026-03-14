export const followBackEmail = (myName) => {
  return `
    <div style="font-family: sans-serif; text-align:center;">
      <h2>You have a new follower!</h2>
      <p><strong>${myName}</strong> has followed you back on R-fit.</p>
      <p>Check out their profile and posts now!</p>
      <br/>
      <p>Thanks,<br/>The R-fit Team</p>
    </div>
  `
}