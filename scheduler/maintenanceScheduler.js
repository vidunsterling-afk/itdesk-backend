import cron from "node-cron";
import Maintenance from "../models/Maintenance.js";
import Employee from "../models/Employee.js";
import Asset from "../models/Asset.js";
import { sendEmail } from "../utils/sendEmail.js";

// Daily at midnight
cron.schedule("0 0 * * *", async () => {
  console.log("🔁 Running daily maintenance reminder auto-circulation...");

  try {
    const today = new Date();
    const startOfToday = new Date(today.setHours(0, 0, 0, 0));
    const endOfToday = new Date(today.setHours(23, 59, 59, 999));

    // 1️⃣ Find reminders due today
    const dueReminders = await Maintenance.find({
      reminderDate: { $gte: startOfToday, $lte: endOfToday },
    });

    if (dueReminders.length === 0) {
      console.log("✅ No reminders to circulate today.");
      await sendAdminSummary(0, 0);
      return;
    }

    let emailsSent = 0;

    // 2️⃣ Duplicate each reminder for the next month & notify employee
    for (const reminder of dueReminders) {
      const nextDate = new Date(reminder.reminderDate);
      nextDate.setMonth(nextDate.getMonth() + 1);

      await Maintenance.create({
        employee: reminder.employee,
        asset: reminder.asset,
        reminderDate: nextDate,
        notes: reminder.notes || "Auto-circulated from previous reminder",
        returned: false,
      });

      const emp = await Employee.findById(reminder.employee);
      const asset = await Asset.findById(reminder.asset);

      if (emp?.email) {
        await sendEmail({
          to: emp.email,
          subject: `Asset Reminder: ${asset.name} (${asset.assetTag})`,
          html: `
            <p>Hello ${emp.name},</p>
            <p>This is a reminder that your asset <b>${asset.name}</b> (${
            asset.assetTag
          }) has a new scheduled maintenance date on 
            <b>${nextDate.toLocaleDateString()}</b>.</p>
            <p>Please ensure it is checked and ready for maintenance.</p>
            <p>– IT Department</p>
          `,
        });
        emailsSent++;
      }
    }

    console.log(
      `✅ Circulated ${dueReminders.length} reminders and sent ${emailsSent} emails.`
    );
    await sendAdminSummary(dueReminders.length, emailsSent);
  } catch (err) {
    console.error("❌ Error during auto-circulation:", err.message);
  }
});

// 🧾 Helper function to email the admin a daily summary
async function sendAdminSummary(reminderCount, emailCount) {
  const adminEmail = process.env.ADMIN_EMAIL; // Set this in your .env file
  const dateStr = new Date().toLocaleDateString();

  const html = `
    <h3>🧩 Daily Maintenance Auto-Circulation Report</h3>
    <p>Date: <b>${dateStr}</b></p>
    <p>Reminders Circulated: <b>${reminderCount}</b></p>
    <p>Employee Emails Sent: <b>${emailCount}</b></p>
    <p>Status: ${reminderCount > 0 ? "✅ Success" : "ℹ️ No reminders today"}</p>
    <br/>
    <p>– Automated Maintenance Scheduler</p>
  `;

  try {
    await sendEmail({
      to: adminEmail,
      subject: `Daily Maintenance Summary – ${dateStr}`,
      html,
    });
    console.log(`📧 Admin summary email sent to ${adminEmail}`);
  } catch (err) {
    console.error("❌ Failed to send admin summary email:", err.message);
  }
}
