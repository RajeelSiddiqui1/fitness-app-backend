import Nutrition from "../model/nutritionSchema.js";
import Workout from "../model/workoutSchema.js";


export async function setAlert(req, res) {
    try {
        const { type, id, alertTime, alertRecurring } = req.body;
        const userId = req.user._id;

        let item;

        if (type === 'workout') {
            item = await Workout.findOne({ _id: id, userId });
        } else if (type === 'nutrition') {
            item = await Nutrition.findOne({ _id: id, userId });
        } else {
            return res.status(400).json({ message: "Invalid type" });
        }

        if (!item) return res.status(404).json({ message: `${type} not found` });

        item.alertTime = new Date(alertTime);
        item.alertRecurring = alertRecurring || 'once';
        await item.save();

        return res.status(200).json({ message: "Alert set successfully", item });
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
}