import Maintenance from "../models/Maintenance.js";
import MaintenanceReport from "../models/MaintenanceReport.js";
import Employee from "../models/Employee.js";
import Asset from "../models/Asset.js";
import { sendEmail } from "../utils/sendEmail.js";
import ExcelJS from "exceljs";

// ✅ Create Reminder
export const createReminder = async (req, res) => {
  try {
    const { employeeId, assetId, reminderDate, notes } = req.body;

    if (!employeeId || !assetId || !reminderDate)
      return res.status(400).json({ message: "Missing required fields" });

    const employee = await Employee.findById(employeeId);
    const asset = await Asset.findById(assetId);
    if (!employee || !asset)
      return res.status(404).json({ message: "Employee or Asset not found" });

    const reminder = new Maintenance({
      employee: employeeId,
      asset: assetId,
      reminderDate,
      notes,
      returned: false,
    });

    await reminder.save();

    // Notify employee
    if (employee.email) {
      await sendEmail({
        to: employee.email,
        cc: process.env.ADMIN_EMAIL,
        subject: `🧩 You’ve been added to the Maintenance System`,
        html: `
          <p>Hello ${employee.name},</p>
          <p>You’ve been added to the company’s <b>Asset Maintenance System</b>.</p>
          <p>Your assigned asset: <b>${asset.name}</b> (${asset.assetTag})</p>
          <p>Maintenance / checkup date: <b>${new Date(
          reminderDate
        ).toLocaleDateString()}</b></p>
          <p>Thank you for helping us keep our equipment in good condition!</p>
          <p>– IT Department</p>
        `,
      });

      console.log(`📧 Notified ${employee.email} about maintenance assignment`);
    }

    res
      .status(201)
      .json({ message: "Reminder created and employee notified.", reminder });
  } catch (err) {
    console.error("❌ Error creating reminder:", err.message);
    res.status(500).json({ message: "Server Error" });
  }
};

// ✅ Get All Active Reminders
export const getReminders = async (req, res) => {
  try {
    const reminders = await Maintenance.find()
      .populate("employee", "name")
      .populate("asset", "name assetTag");
    res.json(reminders);
  } catch (err) {
    res.status(500).json({ message: "Server Error" });
  }
};

// ✅ Export Maintenance Reports to Excel
export const exportMaintenanceReportsExcel = async (req, res) => {
  try {
    const reports = await MaintenanceReport.find()
      .populate("employee", "name email department")
      .populate("asset", "name assetTag");

    // Create workbook + sheet
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Maintenance Reports");

    // Define columns
    worksheet.columns = [
      { header: "Employee Name", key: "employee", width: 25 },
      { header: "Email", key: "email", width: 25 },
      { header: "Department", key: "department", width: 20 },
      { header: "Asset Tag", key: "assetTag", width: 15 },
      { header: "Asset Name", key: "assetName", width: 20 },
      { header: "Reminder Date", key: "reminderDate", width: 20 },
      { header: "Returned At", key: "returnedAt", width: 20 },
      { header: "Notes", key: "notes", width: 40 },
    ];

    // Style header row
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
        employee: r.employee?.name || "N/A",
        email: r.employee?.email || "",
        department: r.employee?.department || "",
        assetTag: r.asset?.assetTag || "",
        assetName: r.asset?.name || "",
        reminderDate: r.reminderDate
          ? new Date(r.reminderDate).toLocaleDateString()
          : "",
        returnedAt: r.returnedAt
          ? new Date(r.returnedAt).toLocaleDateString()
          : "",
        notes: r.notes || "",
      });

      // Add borders to each row
      row.eachCell((cell) => {
        cell.border = {
          top: { style: "thin" },
          left: { style: "thin" },
          bottom: { style: "thin" },
          right: { style: "thin" },
        };
      });
    });

    // Add autofilter
    worksheet.autoFilter = {
      from: "A1",
      to: "H1",
    };

    // Set response headers
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=maintenance_reports.xlsx"
    );

    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    console.error("❌ Excel export error:", err);
    res.status(500).json({ message: err.message });
  }
};

// ✅ Get All Historical Maintenance Reports
export const getMaintenanceReports = async (req, res) => {
  try {
    const reports = await MaintenanceReport.find()
      .populate("employee", "name")
      .populate("asset", "name assetTag");
    res.json(reports);
  } catch (err) {
    res.status(500).json({ message: "Server Error" });
  }
};

// ✅ Mark Returned and Move to MaintenanceReport
export const markReturned = async (req, res) => {
  try {
    const reminder = await Maintenance.findById(req.params.id)
      .populate("employee", "name email")
      .populate("asset", "name assetTag");

    if (!reminder)
      return res.status(404).json({ message: "Reminder not found" });

    // ✅ Create a record in MaintenanceReport
    await MaintenanceReport.create({
      employee: reminder.employee._id,
      asset: reminder.asset._id,
      reminderDate: reminder.reminderDate,
      notes: reminder.notes,
      returnedAt: new Date(),
    });

    // ✅ Remove from active reminders using deleteOne()
    await Maintenance.deleteOne({ _id: reminder._id });

    res.json({ message: "Marked as returned and moved to report." });

    // Optional: Auto-circulate next month's reminder
    setTimeout(async () => {
      try {
        const nextMonthDate = new Date(reminder.reminderDate);
        nextMonthDate.setMonth(nextMonthDate.getMonth() + 1);

        const newReminder = await Maintenance.create({
          employee: reminder.employee._id,
          asset: reminder.asset._id,
          reminderDate: nextMonthDate,
          notes: reminder.notes || "Auto-circulated after return",
          returned: false,
        });

        if (reminder.employee?.email) {
          await sendEmail({
            to: reminder.employee.email,
            subject: `🔁 Maintenance Reminder Auto-Created: ${reminder.asset.name} (${reminder.asset.assetTag})`,
            html: `
              <p>Hello ${reminder.employee.name},</p>
              <p>The maintenance reminder for your asset <b>${reminder.asset.name
              }</b> (${reminder.asset.assetTag})
              has been automatically scheduled for next month.</p>
              <p><b>Next maintenance date:</b> ${nextMonthDate.toLocaleDateString()}</p>
              <p>Thank you for keeping your equipment maintained!</p>
              <p>– IT Department</p>
            `,
          });
        }
      } catch (err) {
        console.error("❌ Auto-circulate error:", err.message);
      }
    }, 5000);
  } catch (err) {
    console.error("❌ Error in markReturned:", err.message);
    res.status(500).json({ message: "Server Error" });
  }
};

// ✅ Delete Reminder
export const deleteReminder = async (req, res) => {
  try {
    const reminder = await Maintenance.findByIdAndDelete(req.params.id);
    if (!reminder)
      return res.status(404).json({ message: "Reminder not found" });

    res.json({ message: "Reminder deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: "Server Error" });
  }
};
