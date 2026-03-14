import cron from 'node-cron';
import Workout from '../model/workoutSchema.js';
import Nutrition from '../model/nutritionSchema.js';
import User from '../model/userSchema.js';
import Notification from '../model/notificationSchema.js';
import { sendMail } from '../lib/mail.js';

cron.schedule('* * * * *', async () => {
    const now = new Date();

    const workouts = await Workout.find({ alertTime: { $ne: null, $lte: now } });
    const nutritions = await Nutrition.find({ alertTime: { $ne: null, $lte: now } });

    const items = [...workouts, ...nutritions];

    for (let item of items) {
        const user = await User.findById(item.userId);

        // Create notification
        await Notification.create({
            sender: { id: user._id, name: user.userName },
            receiver: [{ id: user._id }],
            type: "alert",
            referenceId: item._id,
            referenceModel: item.constructor.modelName,
            title: "Reminder!",
            message: `It's time for your ${item.constructor.modelName.toLowerCase()}: ${item.exrciseName || item.foodItem}`,
            link: `/${item.constructor.modelName.toLowerCase()}/${item._id}`
        });

        // Send email
        if (user.email) {
            await sendMail({
                to: user.email,
                subject: "R-fit Reminder",
                html: `<p>It's time for your ${item.constructor.modelName.toLowerCase()}: ${item.exrciseName || item.foodItem}</p>`
            });
        }

        // Update alertTime based on recurrence
        if (item.alertRecurring === 'once') {
            item.alertTime = null; 
        } else if (item.alertRecurring === 'daily') {
            const nextAlert = new Date(item.alertTime);
            nextAlert.setDate(nextAlert.getDate() + 1);
            item.alertTime = nextAlert;
        } else if (item.alertRecurring === 'weekly') {
            const nextAlert = new Date(item.alertTime);
            nextAlert.setDate(nextAlert.getDate() + 7);
            item.alertTime = nextAlert;
        }

        await item.save();
    }
});