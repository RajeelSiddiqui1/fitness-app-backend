/**
 * Background helper for sending notifications and emails
 * This allows the main request to complete instantly while
 * notifications are processed in the background
 */

import Notification from "../model/notificationSchema.js";
import User from "../model/userSchema.js";
import { sendNotificationToUser, sendNotificationCountUpdate } from "../lib/socket.js";
import { sendMail } from "../lib/mail.js";

/**
 * Send notifications and emails to followers in the background
 * @param {Object} options - Configuration options
 * @param {string} options.userId - The user who made the content public
 * @param {string} options.userName - Username of the content owner
 * @param {string} options.referenceId - ID of the nutrition/workout
 * @param {string} options.referenceModel - "Nutrition" or "Workout"
 * @param {Object} options.emailTemplate - Email template function
 * @param {string} options.type - Notification type (default: "achievement")
 * @param {string} options.title - Notification title
 * @param {string} options.message - Notification message
 * @param {string} options.link - Link for the notification
 */
export async function sendFollowerNotifications({
  userId,
  userName,
  referenceId,
  referenceModel,
  emailTemplate,
  type = "achievement",
  title,
  message,
  link
}) {
  try {
    // Fetch user and their followers
    const user = await User.findById(userId).populate("followers");
    
    if (!user || !user.followers || user.followers.length === 0) {
      console.log("No followers to notify");
      return;
    }

    const followers = user.followers;
    
    // Filter followers by notification preferences
    const inAppFollowers = followers.filter(f => f.notification === true);
    const emailFollowers = followers.filter(f => f.mail === true && f.email);

    // Send in-app notifications
    if (inAppFollowers.length > 0) {
      const notification = new Notification({
        sender: { id: user._id, name: user.userName },
        receiver: inAppFollowers.map(f => ({ id: f._id })),
        type: type,
        referenceId: referenceId,
        referenceModel: referenceModel,
        title: title,
        message: message,
        link: link
      });
      
      await notification.save();

      // Send real-time notifications to all followers
      // Use a separate process to avoid blocking
      setImmediate(() => {
        inAppFollowers.forEach(follower => {
          try {
            sendNotificationToUser(follower._id.toString(), notification);
            sendNotificationCountUpdate(follower._id.toString(), 1);
          } catch (err) {
            console.error(`Failed to send real-time notification to ${follower._id}:`, err);
          }
        });
      });
    }

    // Send emails in the background with a small delay to not block the main thread
    if (emailFollowers.length > 0) {
      setImmediate(async () => {
        for (const follower of emailFollowers) {
          try {
            await sendMail({
              to: follower.email,
              subject: `${userName} achieved a milestone!`,
              html: emailTemplate({
                followerName: follower.userName,
                userName: userName,
                [referenceModel === "Nutrition" ? "nutritionId" : "WorkoutId"]: referenceId,
                link: link
              })
            });
            // Small delay between emails to avoid overwhelming the mail server
            await new Promise(resolve => setTimeout(resolve, 100));
          } catch (err) {
            console.error(`Failed to send email to ${follower.email}:`, err);
          }
        }
      });
    }

    console.log(`Background notifications triggered for ${inAppFollowers.length} in-app and ${emailFollowers.length} email followers`);
    
  } catch (error) {
    console.error("Error in sendFollowerNotifications:", error);
  }
}
