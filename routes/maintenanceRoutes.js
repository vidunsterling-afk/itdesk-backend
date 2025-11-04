import express from "express";
import {
  createReminder,
  getReminders,
  markReturned,
  deleteReminder,
  getMaintenanceReports,
  exportMaintenanceReportsExcel,
} from "../controllers/maintenanceController.js";
import { sendEmail } from "../utils/sendEmail.js";

const router = express.Router();

router.post("/", createReminder);
router.get("/", getReminders);
router.get("/report", getMaintenanceReports);
router.get("/report/export", exportMaintenanceReportsExcel);
router.put("/return/:id", markReturned);
router.delete("/:id", deleteReminder);

router.get("/test-email", async (req, res) => {
  try {
    await sendEmail({
      to: "hettividun@gmail.com",
      subject: "Test Maintenance Email",
      html: "<h2>Maintenance email system working ✅</h2>",
    });
    res.json({ message: "Test email sent" });
  } catch (err) {
    res.status(500).json({ message: "Failed to send test email" });
  }
});

export default router;
