// routes/testRoutes.js
import express from "express";
import Maintenance from "../models/Maintenance.js";
import Employee from "../models/Employee.js";
import Asset from "../models/Asset.js";
import { sendEmail } from "../utils/sendEmail.js";

const router = express.Router();

router.get("/maintenance-alerts", async (req, res) => {
  try {
    const now = new Date();
    const threeDays = 3 * 24 * 60 * 60 * 1000; // 3 days in ms

    // Find reminders due within 3 days or overdue
    const upcoming = await Maintenance.find({
      reminderDate: { $lte: new Date(now.getTime() + threeDays) },
      returned: false,
    });

    let emailsSent = 0;

    if (upcoming.length === 0) {
      await sendAdminSummary(0, 0);
      return res
        .status(200)
        .json({ message: "No upcoming reminders. Admin notified." });
    }

    for (const reminder of upcoming) {
      const emp = await Employee.findById(reminder.employee);
      const asset = await Asset.findById(reminder.asset);

      if (!emp || !asset) continue;

      const isOverdue = new Date(reminder.reminderDate) < now;

      await sendEmail({
        to: emp.email,
        subject: isOverdue
          ? `⚠️ Overdue Maintenance: ${asset.name} (${asset.assetTag})`
          : `🛠 Upcoming Maintenance: ${asset.name} (${asset.assetTag})`,
        html: `
          <p>Hello ${emp.name},</p>
          <p>Your asset <b>${asset.name}</b> (${asset.assetTag}) is ${
          isOverdue
            ? "<b style='color:red;'>overdue for maintenance</b>"
            : "due for maintenance soon"
        }.</p>
          <p>Date: <b>${new Date(
            reminder.reminderDate
          ).toLocaleDateString()}</b></p>
          <p>– IT Department</p>
        `,
      });

      emailsSent++;
    }

    // After sending to employees, send admin summary
    await sendAdminSummary(upcoming.length, emailsSent);

    res.status(200).json({
      message: `✅ ${emailsSent} reminder email(s) sent to employees. Admin summary sent.`,
    });
  } catch (err) {
    console.error("❌ Test alert error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// 📩 Helper: Send admin summary email
async function sendAdminSummary(reminderCount, emailCount) {
  const adminEmail = process.env.ADMIN_EMAIL;
  const dateStr = new Date().toLocaleString();

  const html = `
    <h3>🧩 Maintenance Alert Test Report</h3>
    <p>Date: <b>${dateStr}</b></p>
    <p>Reminders Found: <b>${reminderCount}</b></p>
    <p>Employee Emails Sent: <b>${emailCount}</b></p>
    <p>Status: ${
      reminderCount > 0
        ? "✅ Alerts sent successfully"
        : "ℹ️ No reminders found"
    }</p>
    <br/>
    <p>– Automated Maintenance System</p>
  `;

  try {
    await sendEmail({
      to: adminEmail,
      subject: `Maintenance Alert Summary – ${dateStr}`,
      html,
    });
    console.log(`📧 Admin summary email sent to ${adminEmail}`);
  } catch (err) {
    console.error("❌ Failed to send admin summary email:", err.message);
  }
}

export default router;
