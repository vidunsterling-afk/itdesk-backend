import mongoose from "mongoose";

const maintenanceSchema = new mongoose.Schema({
  employee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Employee",
    required: true,
  },
  asset: { type: mongoose.Schema.Types.ObjectId, ref: "Asset", required: true },
  reminderDate: { type: Date, required: true },
  notes: { type: String },
  returned: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model("Maintenance", maintenanceSchema);
