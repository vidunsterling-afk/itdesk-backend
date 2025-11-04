import mongoose from "mongoose";

const softwareSchema = new mongoose.Schema({
  name: { type: String, required: true },
  category: { type: String }, // e.g. Antivirus, SaaS, OS, Subscription
  vendor: { type: String },
  licenseKey: { type: String },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Employee",
  },
  purchaseDate: { type: Date },
  expiryDate: { type: Date, required: true },
  renewalCycle: {
    type: String,
    enum: ["monthly", "yearly", "none"],
    default: "yearly",
  },
  cost: { type: Number },
  paymentMethod: { type: String },
  invoiceFile: { type: String }, // optional file URL
  autoRenew: { type: Boolean, default: true },
  status: {
    type: String,
    enum: ["active", "expiring", "expired"],
    default: "active",
  },
  notes: { type: String },
  notified: { type: Boolean, default: false }, // for email alert tracking
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model("Software", softwareSchema);
