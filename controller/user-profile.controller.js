import User from "../model/userSchema.js"
import Workout from "../model/workoutSchema.js"
import Nutrition from "../model/nutritionSchema.js"

export async function getUserProfile(req, res) {
  try {
    const { userId } = req.params
    const currentUserId = req.user._id

    // Find the user
    const user = await User.findById(userId).select("-password")
    
    if (!user) {
      return res.status(404).json({ message: "User not found" })
    }

    // Get current user's data to check if they follow the target user
    const currentUser = await User.findById(currentUserId).select("followers following")

    // Check relationship between current user and target user
    const isFollowing = user.followers.includes(currentUserId)  // I follow them (they have me in their followers)
    const hasPendingRequest = user.followRequests.includes(currentUserId)
    const isOwnProfile = userId === currentUserId.toString()
    // Check if target user follows me (they are in my followers list)
    const isFollowedBy = currentUser.followers.includes(userId)

    // Get public workouts
    const publicWorkouts = await Workout.find({ 
      userId: userId, 
      shared: "Public" 
    }).sort({ createdAt: -1 }).limit(10)

    // Get public nutrition
    const publicNutrition = await Nutrition.find({ 
      userId: userId, 
      shared: "Public" 
    }).sort({ createdAt: -1 }).limit(10)

    // Get followers and following count
    const followersCount = user.followers.length
    const followingCount = user.following.length

    return res.status(200).json({
      user: {
        _id: user._id,
        userName: user.userName,
        avatar: user.avatar,
        country: user.country,
        city: user.city,
        gender: user.gender,
        age: user.age,
        createdAt: user.createdAt,
        followers: user.followers,
        following: user.following
      },
      relationship: {
        isFollowing,
        hasPendingRequest,
        isOwnProfile,
        isFollowedBy
      },
      stats: {
        followersCount,
        followingCount,
        publicWorkoutsCount: publicWorkouts.length,
        publicNutritionCount: publicNutrition.length
      },
      publicWorkouts,
      publicNutrition
    })

  } catch (error) {
    console.log(error)
    return res.status(500).json({ message: "Internal server error" })
  }
}

export async function getUserFollowers(req, res) {
  try {
    const { userId } = req.params

    const user = await User.findById(userId)
      .select("followers")
      .populate("followers", "userName avatar age gender country city")

    if (!user) {
      return res.status(404).json({ message: "User not found" })
    }

    res.status(200).json({
      followers: user.followers
    })

  } catch (error) {
    console.log(error)
    return res.status(500).json({ message: "Internal server error" })
  }
}

export async function getUserFollowing(req, res) {
  try {
    const { userId } = req.params

    const user = await User.findById(userId)
      .select("following")
      .populate("following", "userName avatar age gender country city")

    if (!user) {
      return res.status(404).json({ message: "User not found" })
    }

    res.status(200).json({
      following: user.following
    })

  } catch (error) {
    console.log(error)
    return res.status(500).json({ message: "Internal server error" })
  }
}
