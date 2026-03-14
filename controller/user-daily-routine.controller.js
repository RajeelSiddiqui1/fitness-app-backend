import Nutrition from "../model/nutritionSchema.js"
import User from "../model/userSchema.js"
import Workout from "../model/workoutSchema.js"
import Like from "../model/likeSchema.js"
import Comment from "../model/commentSchema.js"

export async function getMyAchievements(req, res) {
  try {
    const userId = req.user.id;
    
    const user = await User.findById(userId).select("measurementUnit");
    
    // Get only PUBLIC workouts and nutritions (achievements shared with others)
    const [myWorkouts, myNutritions] = await Promise.all([
      Workout.find({ userId, shared: "Public" }).populate("userId", "userName email"),
      Nutrition.find({ userId, shared: "Public" }).populate("userId", "userName email")
    ]);

    // Convert weight if needed
    const convertWeight = (w) => {
      let weight = w.weight;
      if (user?.measurementUnit === "lb" && typeof w.weight === "number") {
        weight = Number((w.weight * 2.20462).toFixed(2));
      }
      return { ...w.toObject(), weight };
    };

    // Get engagement stats for each achievement
    const workoutsWithStats = await Promise.all(
      myWorkouts.map(async (w) => {
        const [likes, comments] = await Promise.all([
          Like.countDocuments({ targetId: w._id, targetType: "Workout" }),
          Comment.countDocuments({ targetId: w._id, targetType: "Workout" })
        ]);
        return {
          ...convertWeight(w),
          likes,
          comments,
          isOwner: true
        };
      })
    );

    const nutritionsWithStats = await Promise.all(
      myNutritions.map(async (n) => {
        const [likes, comments] = await Promise.all([
          Like.countDocuments({ targetId: n._id, targetType: "Nutrition" }),
          Comment.countDocuments({ targetId: n._id, targetType: "Nutrition" })
        ]);
        return {
          ...n.toObject(),
          likes,
          comments,
          isOwner: true
        };
      })
    );

    return res.status(200).json({
      measurementUnit: user?.measurementUnit || "kg",
      workouts: workoutsWithStats,
      nutritions: nutritionsWithStats
    });

  } catch (error) {
    return res.status(500).json({ message: error.message })
  }
}

export async function getUserNutritions(req, res) {
  try {
    const userId = req.user.id;
    
    // Get user's own PUBLIC nutritions AND public nutritions from others
    const [myNutritions, publicNutritions] = await Promise.all([
      Nutrition.find({ userId, shared: "Public" }).populate("userId", "userName email"),
      Nutrition.find({ shared: "Public", userId: { $ne: userId } }).populate("userId", "userName email")
    ]);

    // Combine and mark ownership
    const allNutritions = [
      ...myNutritions.map(n => ({ ...n.toObject(), isOwner: true })),
      ...publicNutritions.map(n => ({ ...n.toObject(), isOwner: false }))
    ];

    return res.status(200).json(allNutritions);

  } catch (error) {
    return res.status(500).json({ message: error.message })
  }
}


export async function getPublicNutritionDetail(req, res) {
  try {

    const nutritionId = req.params.id
    const viewerId = req.user.id

    const nutrition = await Nutrition.findById(nutritionId).populate("userId", "userName email")

    if (!nutrition) {
      return res.status(404).json({ message: "Nutrition not found" })
    }

    // Allow owner to view their own nutrition, or any user to view public nutrition
    const isOwner = String(nutrition.userId._id) === String(viewerId)
    const isPublic = nutrition.shared === "Public"

    if (!isOwner && !isPublic) {
      return res.status(403).json({ message: "Not authorized to view this nutrition" })
    }

    return res.status(200).json(nutrition)

  } catch (error) {
    return res.status(500).json({ message: error.message })
  }
}

export async function getUserWorkout(req, res) {
  try {

    const viewerId = req.user.id

     const viewer = await User.findById(viewerId).select("measurementUnit");

    // Get user's own PUBLIC workouts AND public workouts from others
    const [myWorkouts, publicWorkouts] = await Promise.all([
      Workout.find({ userId: viewerId, shared: "Public" }).populate("userId", "userName email"),
      Workout.find({ shared: "Public", userId: { $ne: viewerId } }).populate("userId", "userName email")
    ]);

    const convertWeight = (w) => {
      let weight = w.weight;
      if (viewer?.measurementUnit === "lb" && typeof w.weight === "number") {
        weight = Number((w.weight * 2.20462).toFixed(2));
      }
      return { ...w.toObject(), weight };
    };

    const allWorkouts = [
      ...myWorkouts.map(w => ({ ...convertWeight(w), isOwner: true })),
      ...publicWorkouts.map(w => ({ ...convertWeight(w), isOwner: false }))
    ];

    return res.status(200).json({
      measurementUnit: viewer?.measurementUnit || "kg",
      workouts: allWorkouts
    });

  } catch (error) {
    return res.status(500).json({ message: error.message })
  }
}


export async function getPublicWorkoutDetail(req, res) {
  try {

    const workoutId = req.params.id
    const viewerId = req.user.id

    const viewer = await User.findById(viewerId).select("measurementUnit")

    const workout = await Workout.findById(workoutId).populate("userId", "userName email")

    if (!workout) {
      return res.status(404).json({ message: "Workout not found" })
    }

    // Allow owner to view their own workout, or any user to view public workout
    const isOwner = String(workout.userId._id) === String(viewerId)
    const isPublic = workout.shared === "Public"

    if (!isOwner && !isPublic) {
      return res.status(403).json({ message: "Not authorized to view this workout" })
    }

    let weight = workout.weight

    if (viewer?.measurementUnit === "lb" && typeof workout.weight === "number") {
      weight = Number((workout.weight * 2.20462).toFixed(2))
    }

    return res.status(200).json({
      measurementUnit: viewer?.measurementUnit || "kg",
      workout: {
        ...workout.toObject(),
        weight
      }
    })

  } catch (error) {
    return res.status(500).json({ message: error.message })
  }
}