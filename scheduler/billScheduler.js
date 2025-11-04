import cron from "node-cron";
import Bill from "../models/Bill.js";
import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.SMTP_EMAIL,
        pass: process.env.SMTP_PASS,
    },
});

cron.schedule("0 8 * * *", async () => {
    try {
        const today = new Date();
        const billsToday = await Bill.find({
            reminderDate: {
                $gte: new Date(today.setHours(0, 0, 0, 0)),
                $lte: new Date(today.setHours(23, 59, 59, 999)),
            },
            status: "Pending",
        });

        if (!billsToday.length) return console.log("No bills today");

        for (let bill of billsToday) {
            await transporter.sendMail({
                from: process.env.SMTP_EMAIL,
                to: process.env.ALERT_EMAIL,
                subject: `Bill Reminder: ${bill.name}`,
                text: `Reminder for bill "${bill.name}" on ${bill.reminderDate.toDateString()} (Priority: ${bill.priority})`,
            });
        }

        console.log(`Sent ${billsToday.length} bill reminder emails`);
    } catch (err) {
        console.error("Error sending bill reminders:", err.message);
    }
}, { timezone: "Asia/Colombo" });
