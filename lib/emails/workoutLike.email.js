export function workoutLikeEmailTemplate({ ownerName, actorName, link }) {
  return {
    subject: "Someone liked your workout",
    html: `
      <h3>Hello ${ownerName}</h3>
      <p><b>${actorName}</b> liked your workout.</p>
      <a href="${link}">View workout</a>
    `
  };
}