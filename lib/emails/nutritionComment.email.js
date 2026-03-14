export function nutritionCommentEmailTemplate({ ownerName, actorName, comment, link }) {
  return {
    subject: "New comment on your nutrition",
    html: `
      <h3>Hello ${ownerName}</h3>
      <p><b>${actorName}</b> commented on your nutrition entry.</p>
      <p>${comment}</p>
      <a href="${link}">View comment</a>
    `
  };
}