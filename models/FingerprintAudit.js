import mongoose from "mongoose";

const fingerprintAuditSchema = new mongoose.Schema(
  {
    employeeId: { type: String, required: true },
    employeeName: { type: String, required: true },
    employeeEmail: { type: String, required: true },
    assignedBy: { type: String, required: true },
    sendTo: { type: String, enum: ["employee", "hr", "both"], required: true },
    emailsSent: [
      {
        to: String,
        subject: String,
        status: {
          type: String,
          enum: ["success", "failed"],
          default: "success",
        },
        error: String,
      },
    ],
  },
  { timestamps: true }
);

export default mongoose.model("FingerprintAudit", fingerprintAuditSchema);