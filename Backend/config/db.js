import mongoose from "mongoose";
const url = process.env.MONGO_URI;
const connectDb = async () => {
  try {
    const res = await mongoose.connect(url);
    console.log(`MongoDB connected: ${res.connection.host}`);
  } catch (err) {
    console.error("error Occurred While Connecting To MONGODB", err);
  }
};

export default connectDb;
