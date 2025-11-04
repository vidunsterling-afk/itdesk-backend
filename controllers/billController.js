import Bill from "../models/Bill.js";
import BillReport from "../models/BillReport.js";
import nodemailer from "nodemailer";
import ExcelJS from "exceljs";

const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.SMTP_EMAIL,
        pass: process.env.SMTP_PASS,
    },
});

export const createBill = async (req, res) => {
    try {
        const bill = new Bill(req.body);
        await bill.save();
        res.json(bill);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

export const getBills = async (req, res) => {
    try {
        const bills = await Bill.find().sort({ reminderDate: 1 });
        res.json(bills);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

export const payBill = async (req, res) => {
    try {
        const bill = await Bill.findById(req.params.id);
        if (!bill) return res.status(404).json({ message: "Bill not found" });

        // Move to report safely
        try {
            await BillReport.create({
                name: bill.name,
                originalReminderDate: bill.reminderDate,
                priority: bill.priority,
                paidDate: new Date(), // add this if your schema requires it
            });
        } catch (reportErr) {
            console.error("Failed to create report:", reportErr);
            return res.status(500).json({ error: "Failed to move bill to report" });
        }

        // Auto-renew next month if recurring
        if (bill.recurring) {
            const nextMonth = new Date(bill.reminderDate);
            nextMonth.setMonth(nextMonth.getMonth() + 1);

            const newBill = new Bill({
                name: bill.name,
                reminderDate: nextMonth,
                status: "Pending",
                priority: bill.priority,
                recurring: true,
            });
            await newBill.save();
        }

        // Remove old bill
        await bill.deleteOne(); // slightly safer than remove()
        res.json({ message: "Paid, reported & renewed if recurring" });
    } catch (err) {
        console.error("payBill error:", err);
        res.status(500).json({ error: err.message });
    }
};


export const deleteBill = async (req, res) => {
    try {
        await Bill.findByIdAndDelete(req.params.id);
        res.json({ message: "Deleted" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

export const sendEmailReminders = async (req, res) => {
    try {
        const today = new Date();
        const billsToday = await Bill.find({
            reminderDate: {
                $gte: new Date(today.setHours(0, 0, 0, 0)),
                $lte: new Date(today.setHours(23, 59, 59, 999)),
            },
            status: "Pending",
        });

        if (!billsToday.length) return res.json({ message: "No bills today" });

        for (let bill of billsToday) {
            await transporter.sendMail({
                from: process.env.SMTP_EMAIL,
                to: process.env.ALERT_EMAIL,
                subject: `Bill Reminder: ${bill.name}`,
                text: `Reminder for bill "${bill.name}" on ${bill.reminderDate.toDateString()} (Priority: ${bill.priority})`,
            });
        }

        res.json({ message: "Emails sent", count: billsToday.length });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

export const getReports = async (req, res) => {
    try {
        const reports = await BillReport.find().sort({ paidDate: -1 });
        res.json(reports);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// ✅ Export Paid Bills / Reports to Excel
export const exportBillsExcel = async (req, res) => {
    try {
        const reports = await BillReport.find().sort({ paidDate: -1 });

        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet("Paid Bills");

        // Define columns
        worksheet.columns = [
            { header: "Bill Name", key: "name", width: 30 },
            { header: "Original Reminder Date", key: "originalReminderDate", width: 20 },
            { header: "Paid Date", key: "paidDate", width: 20 },
            { header: "Priority", key: "priority", width: 15 },
        ];

        // Style header
        worksheet.getRow(1).eachCell((cell) => {
            cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
            cell.fill = {
                type: "pattern",
                pattern: "solid",
                fgColor: { argb: "FF4472C4" },
            };
            cell.alignment = { vertical: "middle", horizontal: "center" };
            cell.border = {
                top: { style: "thin" },
                left: { style: "thin" },
                bottom: { style: "thin" },
                right: { style: "thin" },
            };
        });

        // Add data rows
        reports.forEach((r) => {
            const row = worksheet.addRow({
                name: r.name,
                originalReminderDate: r.originalReminderDate
                    ? new Date(r.originalReminderDate).toLocaleDateString()
                    : "",
                paidDate: r.paidDate ? new Date(r.paidDate).toLocaleDateString() : "",
                priority: r.priority,
            });

            row.eachCell((cell) => {
                cell.border = {
                    top: { style: "thin" },
                    left: { style: "thin" },
                    bottom: { style: "thin" },
                    right: { style: "thin" },
                };
            });
        });

        // Autofilter
        worksheet.autoFilter = { from: "A1", to: "D1" };

        // Set response headers
        res.setHeader(
            "Content-Type",
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        );
        res.setHeader(
            "Content-Disposition",
            "attachment; filename=paid_bills.xlsx"
        );

        await workbook.xlsx.write(res);
        res.end();
    } catch (err) {
        console.error("❌ Excel export error:", err);
        res.status(500).json({ message: err.message });
    }
};

export const getPendingBillCount = async (req, res) => {
    try {
        const count = await Bill.countDocuments({ status: "Pending" });
        res.json({ count });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};