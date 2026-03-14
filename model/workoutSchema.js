import mongoose from "mongoose";

const { model, models, Schema } = mongoose;

const workoutSchema = new Schema(
    {
        exrciseName: {
            type: String,
            required: true,
        },
        sets: {
            type: Number
        },
        reps: {
            type: Number
        },
        weight: {
            type: Number
        },
        notes: {
            type: String
        },
        category: {
            type: String,
            enum: ['Strength', 'Cardio', 'Flexibility'],
            required: true
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
        isShared: {
            type: Boolean,
            default: false
        },
        shared: {
            type: String,
            enum: ["Private", "Public"],
            default: "Private"
        },
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        }

    },
    {
        timestamps: true
    }
)

const Workout = models.Workout || model("Workout", workoutSchema)

export default Workout