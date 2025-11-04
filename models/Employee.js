import mongoose from "mongoose";

const employeeSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true },
    department: { type: String, required: true },
    assigned: [{ type: mongoose.Schema.Types.ObjectId, ref: "Asset" }],
    tempAssigned: [{ type: mongoose.Schema.Types.ObjectId, ref: "Asset" }],
  },
  { timestamps: true }
);

export default mongoose.model("Employee", employeeSchema);
