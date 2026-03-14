import mongoose from "mongoose";

const  { model, models, Schema } = mongoose

const progressSchema = new Schema(
    {
        bodyMeasurements: {
            chest: Number,
            waist: Number,
            hips: Number
        },
        weight: { type: Number },
        performanceMetrics: {
            runTime: Number,
            maxLift: Number
        },
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        }

    }, {
    timestamps: true
}
)


const Progress = models.Progress || model("Progress", progressSchema)

export default Progress