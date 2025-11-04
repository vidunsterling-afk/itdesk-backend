import mongoose from "mongoose";

const billSchema = new mongoose.Schema({
    name: { type: String, required: true },
    reminderDate: { type: Date, required: true },
    status: { type: String, enum: ["Pending", "Paid"], default: "Pending" },
    priority: { type: String, enum: ["Low", "Medium", "High"], default: "Medium" },
    recurring: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now },
});

export default mongoose.model("Bill", billSchema);
