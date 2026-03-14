import User from "../model/userSchema.js";
import { sendMail } from "./mail.js";
import { createNotification } from "./notification.js";

export async function notifyOwner({
  ownerId,
  actorId,
  actorName,
  type,
  referenceId,
  referenceModel,
  title,
  message,
  link,
  emailTemplate
}) {

  const owner = await User.findById(ownerId)
    .select("email userName mail notification");

  if (!owner) return;

  const jobs = [];

  // -----------------
  // mail
  // -----------------
  if (owner.mail === true && emailTemplate) {

    const mailPayload = emailTemplate({
      ownerName: owner.userName,
      actorName,
      link
    });

    jobs.push(
      sendMail({
        to: owner.email,
        subject: mailPayload.subject,
        html: mailPayload.html
      })
    );
  }

  // -----------------
  // in-app notification
  // -----------------
  if (owner.notification === true) {

    jobs.push(
      createNotification({
        senderId: actorId,
        senderName: actorName,
        receiverId: ownerId,
        type,
        referenceId,
        referenceModel,
        title,
        message,
        link
      })
    );
  }

  await Promise.allSettled(jobs);
}