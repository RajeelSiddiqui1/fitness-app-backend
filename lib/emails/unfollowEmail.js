export const unfollowEmail = (myName) => {
  return `
    <div style="font-family: sans-serif; text-align:center;">
      <h2>Someone unfollowed you</h2>
      <p><strong>${myName}</strong> has unfollowed you on R-fit.</p>
      <p>Don't worry, there are many more connections waiting!</p>
      <br/>
      <p>Thanks,<br/>The R-fit Team</p>
    </div>
  `
}