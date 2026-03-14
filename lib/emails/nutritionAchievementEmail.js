

export function nutritionAchievementEmail({ followerName, userName, nutritionId,link }) {
  return `
  <div style="font-family: Arial, sans-serif; color: #333; line-height: 1.5;">
    <h2 style="color: #FF69B4;">Hello ${followerName},</h2>
    <p><strong>${userName}</strong> just completed a new achievement in Nutrition !</p>
    <p>Click the button below to check it out:</p>
    <a href="${link}" 
       style="display: inline-block; padding: 10px 20px; background-color: #FF69B4; color: white; text-decoration: none; border-radius: 5px;">
       View Achievement
    </a>
    <p style="margin-top: 20px; font-size: 12px; color: #666;">You are receiving this email because you follow ${userName} on R-fit.</p>
  </div>
  `;
}