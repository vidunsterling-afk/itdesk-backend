import mongoose from "mongoose";

const repairSchema = new mongoose.Schema({
  asset: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Asset",
    required: true,
  },
  reason: { type: String, required: true },
  vendor: { type: String, required: true }, // e.g. repair shop name
  gatePassNumber: { type: String, unique: true },
  dispatchDate: { type: Date, default: Date.now },
  returnDate: { type: Date },
  status: {
    type: String,
    enum: ["dispatched", "returned"],
    default: "dispatched",
  },
  gatePassProof: { type: String }, // Image URL (uploaded photo of proof)
  notes: { type: String },
  qrCode: { type: String },
});

export default mongoose.model("Repair", repairSchema);
