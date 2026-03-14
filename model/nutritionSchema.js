import mongoose from "mongoose";

const { model, models, Schema } = mongoose

const nutritionSchema = new Schema(
    {
        mealType: {
            type: String,
            enum: ['Breakfast', 'Lunch', 'Dinner', 'Snack']
        },
        foodItem: {
            type: String,
            required: true
        },
        quantity: {
            type: Number
        },
        calories: {
            type: Number
        },
        protein: {
            type: Number
        },
        carbs: {
            type: Number
        },
        fats: {
            type: Number
        },
        status: {
            type: String,
            enum: ['Pending', 'Completed', 'Missed'],
            default: 'Pending'
        },
        alertTime: {
            type: Date,
            default: null
        },
        alertRecurring: {
            type: String,
            enum: ['once', 'daily', 'weekly'],
            default: 'once'
        },

        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },
        shared: {
            type: String,
            enum: ["Private", "Public"],
            default: "Private"
        },
    },
    {
        timestamps: true
    }
)

const Nutrition = models.Nutrition || model("Nutrition", nutritionSchema)

export default Nutrition