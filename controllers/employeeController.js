import Employee from "../models/Employee.js";
import Asset from "../models/Asset.js";
import { sendEmail } from "../utils/sendEmail.js";
import ExcelJS from "exceljs";

// Get all employees with assigned assets
export const getEmployees = async (req, res) => {
  try {
    const employees = await Employee.find()
      .populate("assigned", "assetTag name category status")
      .populate("tempAssigned", "assetTag name category status")
      .sort({ createdAt: -1 });
    res.json(employees);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Assign assets to employee
// Assign assets to employee
export const assignAssetsToEmployee = async (req, res) => {
  try {
    const { employeeId } = req.params;
    const { assetIds, type, sendEmail: shouldSendEmail = true } = req.body; // ✅ rename flag

    const employee = await Employee.findById(employeeId);
    if (!employee)
      return res.status(404).json({ message: "Employee not found" });

    // Add assets to employee array (assigned or tempAssigned)
    assetIds.forEach((id) => {
      if (!employee[type].includes(id)) employee[type].push(id);
    });
    await employee.save();

    // Update asset documents
    await Asset.updateMany(
      { _id: { $in: assetIds } },
      {
        assignedTo: employeeId,
        status: type === "assigned" ? "in-use" : "available",
      }
    );

    const updatedEmployee = await Employee.findById(employeeId)
      .populate("assigned", "assetTag name category status")
      .populate("tempAssigned", "assetTag name category status");

    // Fetch assets for email content
    const assets = await Asset.find({ _id: { $in: assetIds } });

    // ✅ Send email only if shouldSendEmail is true
    if (shouldSendEmail && employee.email) {
      const assetList = assets
        .map((a) => `<li>${a.name} (${a.assetTag}) - ${a.category}</li>`)
        .join("");

      await sendEmail({
        to: employee.email,
        cc: process.env.ADMIN_EMAIL,
        subject: `💼 You Have Been Added to the IT Asset Management System`,
        html: `
          <p>Hello ${employee.name},</p>
          <p>
            You have been added to the <b>IT Asset Management System (IT Desk)</b>.
            The following asset(s) have been officially assigned to you:
          </p>
          <ul>${assetList}</ul>
          <p>Status: <b>${
            type === "assigned" ? "Permanent" : "Temporary"
          }</b></p>
          <p>
            Please ensure proper care of these assets and report any issues or damages to the IT Department immediately.
          </p>
          <p>Thank you,<br />
          <b>IT Department</b><br />
          Sterling Steels Pvt Ltd</p>
          <hr />
          <p style="font-size: 0.9em; color: #555;">
            ⚠️ This is an automated email from the IT Desk system. Please do not reply to this message.
          </p>
        `,
      });

      console.log(`✅ Email sent to ${employee.email}`);
    } else {
      console.log(
        "ℹ️ Email skipped due to shouldSendEmail=false or missing employee email"
      );
    }

    res.json({
      message: "Assets assigned successfully",
      employee: updatedEmployee,
    });
  } catch (err) {
    console.error("❌ Assign error:", err);
    res.status(500).json({ message: err.message });
  }
};

// Unassign assets from an employee
export const unassignAssetsFromEmployee = async (req, res) => {
  try {
    const { employeeId } = req.params;
    const { assetIds, type } = req.body; // type = "assigned" or "tempAssigned"

    const employee = await Employee.findById(employeeId);
    if (!employee)
      return res.status(404).json({ message: "Employee not found" });

    // Remove assetIds from the array
    employee[type] = employee[type].filter(
      (id) => !assetIds.includes(id.toString())
    );
    await employee.save();

    // Update asset status
    await Asset.updateMany(
      { _id: { $in: assetIds } },
      { assignedTo: null, status: "available" }
    );

    const updatedEmployee = await Employee.findById(employeeId)
      .populate("assigned", "assetTag name category status")
      .populate("tempAssigned", "assetTag name category status");

    res.json({
      message: "Assets unassigned successfully",
      employee: updatedEmployee,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Add new employee
export const addEmployee = async (req, res) => {
  try {
    const { name, email, department } = req.body;

    // const existing = await Employee.findOne({ email });
    // if (existing)
    //   return res.status(400).json({ message: "Employee already exists" });

    const employee = await Employee.create({ name, email, department });
    res.status(201).json(employee);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get single employee
export const getEmployeeById = async (req, res) => {
  try {
    const employee = await Employee.findById(req.params.id);
    if (!employee)
      return res.status(404).json({ message: "Employee not found" });
    res.json(employee);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Update employee
export const updateEmployee = async (req, res) => {
  try {
    const { name, email, department } = req.body;

    const employee = await Employee.findByIdAndUpdate(
      req.params.id,
      { name, email, department },
      { new: true, runValidators: true }
    );

    if (!employee)
      return res.status(404).json({ message: "Employee not found" });

    res.json(employee);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Delete employee
export const deleteEmployee = async (req, res) => {
  try {
    const employee = await Employee.findByIdAndDelete(req.params.id);
    if (!employee)
      return res.status(404).json({ message: "Employee not found" });

    res.json({ message: "Employee deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ✅ Export Employees with Assigned Assets to Excel (Styled)
export const exportEmployeesExcel = async (req, res) => {
  try {
    const employees = await Employee.find()
      .populate("assigned", "assetTag name category status")
      .populate("tempAssigned", "assetTag name category status");

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Employees");

    // Define columns
    worksheet.columns = [
      { header: "Name", key: "name", width: 25 },
      { header: "Email", key: "email", width: 25 },
      { header: "Department", key: "department", width: 20 },
      { header: "Permanent Assets", key: "assigned", width: 40 },
      { header: "Temporary Assets", key: "tempAssigned", width: 40 },
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
    employees.forEach((emp) => {
      const row = worksheet.addRow({
        name: emp.name || "-",
        email: emp.email || "-",
        department: emp.department || "-",
        assigned: (emp.assigned || [])
          .map(
            (a) =>
              `${a.name || "-"} (${a.assetTag || "-"}) - ${a.status || "-"}`
          )
          .join(", "),
        tempAssigned: (emp.tempAssigned || [])
          .map(
            (a) =>
              `${a.name || "-"} (${a.assetTag || "-"}) - ${a.status || "-"}`
          )
          .join(", "),
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
      to: "E1",
    };

    // Set response headers
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=employees_assets.xlsx"
    );

    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    console.error("❌ Excel export error:", err);
    res.status(500).json({ message: err.message });
  }
};
