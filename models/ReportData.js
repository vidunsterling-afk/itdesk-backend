import mongoose from "mongoose";

const reportDataSchema = new mongoose.Schema({
  mobileNumber: String,
  name: String,
  dataBundle: Number,
  balance: Number,
  usage: Number,
  topupBundle: Number,
  topupUsage: Number,
  timestamp: Date,
  uploadDate: { type: Date, default: Date.now },
});

export default mongoose.model("ReportData", reportDataSchema);
