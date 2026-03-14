export function nutritionLikeEmailTemplate({ ownerName, actorName, link }) {
  return {
    subject: "Someone liked your nutrition",
    html: `
      <h3>Hello ${ownerName}</h3>
      <p><b>${actorName}</b> liked your nutrition entry.</p>
      <a href="${link}">View nutrition</a>
    `
  };
}