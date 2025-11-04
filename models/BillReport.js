import mongoose from "mongoose";

const BillReportSchema = new mongoose.Schema({
    name: String,
    paidDate: { type: Date, default: Date.now },
    originalReminderDate: Date,
    priority: String,
});

export default mongoose.model("BillReport", BillReportSchema);
