import mongoose from "mongoose";

export async function connectToDatabase() {
  const uri = process.env.MONGODB_URI || "mongodb://localhost:27017/ext";

  try {
    await mongoose.connect(uri);
    console.log("Database connected");
  } catch (error) {
    console.error("Database connection error:", error);
    process.exit(1);
  }
}
