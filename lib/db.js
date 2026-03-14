import mongoose from "mongoose"
import dotenv from "dotenv"

dotenv.config()

const MONGODB_URI = process.env.MONGODB_URI

console.log("variable npt found")

const dbConnect = async () => {
    try {
        mongoose.connect(MONGODB_URI)
        console.log("connect db successfully")
    } catch (error) {
        console.error("Failed to connect")
    }
}

export default dbConnect