import mongoose from "mongoose";

const M365UsageSchema = new mongoose.Schema({
  userPrincipalName: { type: String, required: true, unique: true },
  displayName: String,
  mailboxUsedMB: Number,
  mailboxQuotaMB: Number,
  onedriveUsedMB: Number,
  onedriveTotalMB: Number,
  lastActivityDate: Date,
  reportDate: { type: Date, default: Date.now },
});

export default mongoose.model("M365Usage", M365UsageSchema);
