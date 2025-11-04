import mongoose from "mongoose";

const assetSchema = new mongoose.Schema(
  {
    assetTag: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    category: { type: String, required: true },
    brand: { type: String },
    model: { type: String },
    serialNumber: { type: String, unique: false, default: null, unique: false },
    purchaseDate: { type: Date },
    warrantyExpiry: { type: Date },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      default: null,
    },
    status: {
      type: String,
      enum: ["in-use", "available", "maintenance", "under-repair"],
      default: "available",
    },
    location: { type: String },
    remarks: { type: String },
    qrCode: { type: String },
  },
  { timestamps: true }
);

export default mongoose.model("Asset", assetSchema);
