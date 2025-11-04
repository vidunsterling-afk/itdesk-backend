import mongoose from "mongoose";

const addonSchema = new mongoose.Schema({
  date: { type: Date, default: Date.now },
  extraGB: Number,
  cost: Number,
  notes: String,
});

const monthDataSchema = new mongoose.Schema({
  month: { type: String, required: true },
  basePlanGB: { type: Number, default: 300 },
  provider: { type: String, default: "SLT" },
  baseCost: { type: Number, default: 30000 },
  totalUsedGB: Number,
  addons: [addonSchema],
});

// ✅ Allow multiple providers for same month
monthDataSchema.index({ month: 1, provider: 1 }, { unique: true });

export default mongoose.model("MonthData", monthDataSchema);
