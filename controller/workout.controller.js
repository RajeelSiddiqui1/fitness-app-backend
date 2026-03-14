import { WorkoutAchievementEmail } from "../lib/emails/WorkoutAchievementEmail.js";
import { sendMail } from "../lib/mail.js";
import Notification from "../model/notificationSchema.js";
import User from "../model/userSchema.js";
import Workout from "../model/workoutSchema.js";
import { sendNotificationToUser, sendNotificationCountUpdate } from "../lib/socket.js";
import { sendFollowerNotifications } from "../lib/backgroundNotifications.js";

export async function getAllWorkouts(req, res) {
  try {
    const userId = req.user._id;

    const workouts = await Workout.find({ userId: userId });

    const user = await User.findById(userId).select("measurementUnit");

    if (!workouts) {
      res.status(404).json({ message: "Workout not found" });
    }

    const converted = workouts.map((w) => {
      let weight = w.weight;

      if (user?.measurementUnit === "lb" && typeof w.weight === "number") {
        weight = Number((w.weight * 2.20462).toFixed(2));
      }

      return {
        ...w.toObject(),
        weight,
      };
    });

    return res.status(200).json({
      measurementUnit: user.measurementUnit,
      workouts: converted,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Internal server erro" });
  }
}

export async function createWorkout(req, res) {
  try {
    const {
      exrciseName,
      sets,
      reps,
      weight,
      notes,
      category,
      alertTime,
      alertRecurring,
    } = req.body;

    if (!exrciseName || sets == null || reps == null || weight == null) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const exrciseNameExists = await Workout.findOne({
      exrciseName: exrciseName,
      userId: req.user._id,
    });

    if (exrciseNameExists) {
      return res.status(409).json({ message: "Exercise name already exists" });
    }

    const newWorkout = new Workout({
      exrciseName,
      sets,
      reps,
      weight,
      notes,
      category,
      alertTime,
      alertRecurring,
      userId: req.user?._id,
    });

    await newWorkout.save();

    const notification = new Notification({
      sender: { id: req.user._id, name: req.user.userName },
      receiver: [{ id: req.user._id }],
      type: "workout",
      referenceId: newWorkout._id,
      referenceModel: "Workout",
      title: "Workout Created!",
      message: `Your workout "${newWorkout.exrciseName}" has been successfully created.`,
      link: `/workout/${newWorkout._id}`,
    });

    await notification.save();

    // Send real-time notification
    sendNotificationToUser(req.user._id.toString(), notification);
    sendNotificationCountUpdate(req.user._id.toString(), 1);

    return res.status(201).json({
      message: "Workout created successfully",
      workout: newWorkout,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Internal server error" });
  }
}

export async function getWorkoutById(req, res) {
  try {
    const workoutId = req.params.id;
    const userId = req.user.id

    const workout = await Workout.findOne({
      _id: workoutId,
      userId: userId,
    });

    if (!workout) return res.status(404).json({ message: "Workout not found" });

    return res.status(200).json({ workout });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Internal server error" });
  }
}

export async function updateWorkout(req, res) {
  try {
    const workoutId = req.params.id;

    const workout = await Workout.findById(workoutId);
    if (!workout) {
      return res.status(404).json({ message: "Workout not found" });
    }

    if (workout.userId.toString() !== req.user._id.toString()) {
      return res
        .status(403)
        .json({ message: "Not authorized to update this workout" });
    }

    const {
      exrciseName,
      sets,
      reps,
      weight,
      notes,
      category,
      alertTime,
      alertRecurring,
    } = req.body;
    if (exrciseName !== undefined) workout.exrciseName = exrciseName;
    if (sets !== undefined) workout.sets = sets;
    if (reps !== undefined) workout.reps = reps;
    if (weight !== undefined) workout.weight = weight;
    if (notes !== undefined) workout.notes = notes;
    if (category !== undefined) workout.category = category;
    if (alertTime !== undefined) workout.alertTime = alertTime;
    if (alertRecurring !== undefined) workout.alertRecurring = alertRecurring;

    await workout.save();

    return res
      .status(200)
      .json({ message: "Workout updated successfully", workout });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Internal server error" });
  }
}

export async function deleteWorkout(req, res) {
  try {
    const workoutId = req.params.id;
    const workout = await Workout.findById(workoutId);

    if (!workout) return res.status(404).json({ message: "Workout not found" });

    if (workout.userId.toString() !== req.user._id.toString()) {
      return res
        .status(403)
        .json({ message: "Not authorized to delete this workout" });
    }

    await workout.deleteOne();

    return res.status(200).json({ message: "Workout deleted successfully" });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Internal server error" });
  }
}

export async function workoutStatus(req, res) {
  try {
    const workoutId = req.params.id;

    const workout = await Workout.findById(workoutId);

    if (!workout) return res.status(404).json({ message: "Workout not found" });

    if (workout.userId.toString() !== req.user._id.toString()) {
      return res
        .status(403)
        .json({ message: "Not authorized to update this Workout" });
    }

    workout.status = workout.status === "Completed" ? "Pending" : "Completed";

    await workout.save();

    return res.status(200).json({
      message: "Workout status updated",
      status: workout.status,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Internal server error" });
  }
}

export async function toggleWorkout(req, res) {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const workout = await Workout.findOne({ _id: id, userId });
    if (!workout) {
      return res.status(404).json({ message: "Workout not found" });
    }

    const order = ["Private", "Public"];
    const currentIndex = order.indexOf(workout.shared);
    const wasPrivate = workout.shared === "Private";
    workout.shared = order[(currentIndex + 1) % order.length];
    await workout.save();


    if (wasPrivate) {
    
      sendFollowerNotifications({
        userId: userId,
        userName: req.user.userName,
        referenceId: workout._id,
        referenceModel: "Workout",
        emailTemplate: WorkoutAchievementEmail,
        type: "achievement",
        title: "New Achievement!",
        message: `${req.user.userName} just completed an achievement!`,
        link: `/achievements/workout/${workout._id}`
      }).catch(err => console.error("Background notification error:", err));
    }

    return res.status(200).json({
      message: workout.shared === "Public" 
        ? "Shared as public. Followers will be notified shortly." 
        : "Shared updated to private",
      shared: workout.shared,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
}
