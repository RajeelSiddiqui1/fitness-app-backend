export function workoutCommentEmailTemplate({ ownerName, actorName, comment, link }) {
  return {
    subject: "New comment on your workout",
    html: `
      <h3>Hello ${ownerName}</h3>
      <p><b>${actorName}</b> commented on your workout.</p>
      <p>${comment}</p>
      <a href="${link}">View comment</a>
    `
  };
}