import Notification from "../model/notificationSchema.js";
import Progress from "../model/progressSchema.js";
import User from "../model/userSchema.js";
import { sendNotificationToUser, sendNotificationCountUpdate } from "../lib/socket.js";


export async function getAllProgress(req, res) {
    try {

        const userId = req.user.id

        const progress = await Progress.find({ userId: userId })
        const user = await User.findById(userId).select("measurementUnit");

        if (!progress)
            return res.status(404).json({ message: "Progress not found" })

       const converted = progress.map(w => {
            let weight = w.weight;

            
            if (user?.measurementUnit === "lb" && typeof w.weight === "number") {
                weight = Number((w.weight * 2.20462).toFixed(2));
            }

            return {
                ...w.toObject(),
                weight
            };
        });

        return res.status(200).json({
            measurementUnit: user.measurementUnit,
            workouts: converted
        });
    } catch (error) {
        return res.status(500).json({ message: "Failed tp fetch progress" })
    }
}

export async function createProgress(req,res) {
    try {
        const { bodyMeasurements, weight, performanceMetrics } = req.body;
        const userId = req.user.id

        const newProgress = new Progress({
            bodyMeasurements,
            weight,
            performanceMetrics,
            userId:userId
        })

        await newProgress.save()

           const notification = new Notification({
                    sender: { id: req.user._id, name: req.user.userName },
                    receiver: [{ id: req.user._id }],
                    type: "progress",
                    referenceId: newProgress._id,
                    referenceModel: "Progress",
                    title: "Progress Created!",
                    message: `Your Progress  has been successfully created.`,
                    link: `/progress/${newProgress._id}`
                });
        
                await notification.save();

                // Send real-time notification
                sendNotificationToUser(req.user._id.toString(), notification);
                sendNotificationCountUpdate(req.user._id.toString(), 1);

        res.status(201).json({ message: "Progress recorded!", data: newProgress });

    } catch (error) {
        res.status(500).json({ message: "Error saving progress", error: error.message });
    }
}



export async function getProgressById(req, res) {
    try {
        const progressId = req.params.id;
        const userId = req.user.id; 

        const progress = await Progress.findOne({ 
            _id: progressId, 
            userId: userId 
        });

        if (!progress) {
            return res.status(404).json({ message: "Progress not found" });
        }

      
        const user = await User.findById(userId).select("measurementUnit");

    
        let weight = progress.weight;
        if (user?.measurementUnit === "lb" && typeof progress.weight === "number") {
            weight = Number((progress.weight * 2.20462).toFixed(2));
        }

   
        const convertedProgress = {
            ...progress.toObject(),
            weight
        };

      
        return res.status(200).json({ 
            progress: convertedProgress,
            measurementUnit: user?.measurementUnit || 'kg' 
        });

    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Internal server error" });
    }
}

export async function updateProgress(req, res) {
    try {
        const { bodyMeasurements, weight, performanceMetrics } = req.body;
        const userId = req.user.userid
        const { id } = req.params

        const updateProgress = await Progress.findByIdAndUpdate(
            { _id: id, userId: userId },
          {  $set: { 
                    bodyMeasurements, 
                    weight, 
                    performanceMetrics 
                }},
            { new: true }
        )
        if (!updateProgress) {
            return res.status(404).json({ message: "Progress record not found or unauthorized" });
        }

        res.status(200).json({ message: "Progress updated", data: updateProgress });

    } catch (error) {
        res.status(500).json({ message: "Update failed", error: error.message });
    }
}

export async function deleteProgress(req, res) {
    try {
        const userId = req.user.id
        const { id } = req.params

        await Progress.findByIdAndDelete({
            _id: id,
            userId: userId
        })

        return res.status(201).json({
            message: "Progress deleted successfully"
        })

    } catch (error) {
        return res.status(500).json({ message: "Failed tp delete progress" })
    }
}