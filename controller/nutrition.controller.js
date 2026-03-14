import { nutritionAchievementEmail } from "../lib/emails/nutritionAchievementEmail.js"
import { sendMail } from "../lib/mail.js"
import Notification from "../model/notificationSchema.js"
import Nutrition from "../model/nutritionSchema.js"
import User from "../model/userSchema.js"
import { sendNotificationToUser, sendNotificationCountUpdate } from "../lib/socket.js"
import { sendFollowerNotifications } from "../lib/backgroundNotifications.js"

export async function getAllNutrition(req, res) {
    try {
        const userId = req.user?._id

        const nutritions = await Nutrition.find({ userId })

        if (!nutritions || nutritions.length === 0) {
            return res.status(404).json({ message: "Nutrition not found" })
        }

        return res.status(200).json({ nutritions })

    } catch (error) {
        console.log(error)
        return res.status(500).json({ message: "Internal server error" })
    }
}


export async function createnutritions(req, res) {
    try {

        const { mealType, foodItem, quantity, calories, protein, carbs, fats, alertTime,
            alertRecurring, } = req.body

        if (
            !foodItem ||
            quantity == null ||
            calories == null ||
            protein == null ||
            carbs == null ||
            fats == null ||
            !mealType
        ) {
            return res.status(400).json({ message: "All fields are required" })
        }

        const newNutrition = new Nutrition({
            mealType,
            foodItem,
            quantity,
            calories,
            protein,
            carbs,
            fats,
            alertTime,
            alertRecurring,
            userId: req.user?._id
        })

        await newNutrition.save()


        const notification = new Notification({
            sender: { id: req.user._id, name: req.user.userName },
            receiver: [{ id: req.user._id }],
            type: "nutrition",
            referenceId: newNutrition._id,
            referenceModel: "Nutrition",
            title: "Nutrition Created!",
            message: `Your nutrition  has been successfully created.`,
            link: `/nutrition/${newNutrition._id}`
        });

        await notification.save();

        // Send real-time notification
        sendNotificationToUser(req.user._id.toString(), notification);
        sendNotificationCountUpdate(req.user._id.toString(), 1);

        return res.status(201).json({ message: "Nutrition created successfully" })

    } catch (error) {
        console.log(error)
        return res.status(500).json({ message: "Internal server error" })
    }
}


export async function getNutritionById(req, res) {
    try {
        const nutritionId = req.params.id
        const userId = req.user.id

            const nutrition = await Nutrition.findOne({ _id: nutritionId, userId: userId });

        if (!nutrition) return res.status(404).json({ message: "Nutrition not found" })


        return res.status(200).json({ nutrition })

    } catch (error) {
        console.log(error)
        return res.status(500).json({ message: "Internal server error" })
    }
}


export async function updateNutrition(req, res) {
    try {
        const nutritionId = req.params.id


        const nutrition = await Nutrition.findById(nutritionId)

        if (!nutrition) {
            return res.status(404).json({ message: "Nutrition not found" })
        }

        if (nutrition.userId.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: "Not authorized to update this nutrition" })
        }

        const { mealType, foodItem, quantity, calories, protein, carbs, fats, alertTime,
            alertRecurring, } = req.body

        if (mealType !== undefined) nutrition.mealType = mealType
        if (foodItem !== undefined) nutrition.foodItem = foodItem
        if (quantity !== undefined) nutrition.quantity = quantity
        if (calories !== undefined) nutrition.calories = calories
        if (protein !== undefined) nutrition.protein = protein
        if (carbs !== undefined) nutrition.carbs = carbs
        if (fats !== undefined) nutrition.fats = fats
        if (alertTime !== undefined) nutrition.alertTime = alertTime;
        if (alertRecurring !== undefined) nutrition.alertRecurring = alertRecurring;

        await nutrition.save()

        return res.status(200).json({
            message: "Nutrition updated successfully",
            nutrition
        })

    } catch (error) {
        console.log(error)
        return res.status(500).json({ message: "Internal server error" })
    }
}


export async function deleteNutrition(req, res) {
    try {

        const nutritionId = req.params.id

        const nutrition = await Nutrition.findById(nutritionId)

        if (!nutrition) return res.status(404).json({ message: "Nutrition not found" })

        if (nutrition.userId.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: "Not authorized to delete this nutrition" })
        }

        await nutrition.deleteOne()

        return res.status(200).json({ message: "Nutrition deleted successfully" })

    } catch (error) {
        console.log(error)
        return res.status(500).json({ message: "Internal server error" })
    }

}


export async function nutritionStatus(req, res) {
    try {
        const nutritionId = req.params.id

        const nutrition = await Nutrition.findById(nutritionId)

        if (!nutrition) return res.status(404).json({ message: "Nutrition not found" })

        if (nutrition.userId.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: "Not authorized to update this nutrition" })
        }


        nutrition.status = nutrition.status === "Completed" ? "Pending" : "Completed"

        await nutrition.save()

        return res.status(200).json({
            message: "Nutrition status updated",
            status: nutrition.status
        })

    } catch (error) {
        console.log(error)
        return res.status(500).json({ message: "Internal server error" })
    }
}

export async function toggleNutrition(req, res) {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        const nutrition = await Nutrition.findOne({ _id: id, userId });
        if (!nutrition) {
            return res.status(404).json({ message: "Nutrition not found" });
        }

        const order = ["Private", "Public"];
        const currentIndex = order.indexOf(nutrition.shared);
        const wasPrivate = nutrition.shared === "Private";
        nutrition.shared = order[(currentIndex + 1) % order.length];
        await nutrition.save();

        // If making it public, trigger background notification process
        // This allows the response to return immediately without waiting for all notifications
        if (wasPrivate) {
            // Fire and forget - don't await
            sendFollowerNotifications({
                userId: userId,
                userName: req.user.userName,
                referenceId: nutrition._id,
                referenceModel: "Nutrition",
                emailTemplate: nutritionAchievementEmail,
                type: "achievement",
                title: "New Achievement!",
                message: `${req.user.userName} just completed an achievement!`,
                link: `/achievements/nutrition/${nutrition._id}`
            }).catch(err => console.error("Background notification error:", err));
        }

        return res.status(200).json({
            message: nutrition.shared === "Public" 
                ? "Shared as public. Followers will be notified shortly." 
                : "Shared updated to private",
            shared: nutrition.shared
        });

    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
}