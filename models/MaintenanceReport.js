import mongoose from "mongoose";

const MaintenanceReportSchema = new mongoose.Schema(
  {
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      required: true,
    },
    asset: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Asset",
      required: true,
    },
    reminderDate: { type: Date, required: true },
    notes: { type: String },
    returnedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export default mongoose.model("MaintenanceReport", MaintenanceReportSchema);
