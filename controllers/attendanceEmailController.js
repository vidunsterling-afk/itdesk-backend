import { sendEmail } from "../utils/sendEmail.js";
import FingerprintAudit from "../models/FingerprintAudit.js";

export const notifyFingerprintAssignment = async (req, res) => {
  const { employeeName, employeeEmail, assignedBy, employeeId, sendTo } =
    req.body;

  if (!employeeName || !employeeEmail || !assignedBy || !employeeId) {
    return res.status(400).json({ message: "Missing required fields" });
  }

  const emailsSent = [];

  try {
    // Send to Employee
    if (sendTo === "employee" || sendTo === "both") {
      const subject = "Fingerprint Attendance System Assignment";
      const html = `
        <p>Hello ${employeeName},</p>
        <p>You have been assigned to the fingerprint attendance system by <strong>${assignedBy}</strong>.</p>
        <p>Please acknowledge this assignment.</p>
        <p>Thank you,<br/>IT Department</p>
      `;
      try {
        await sendEmail({
          to: employeeEmail,
          cc: process.env.ADMIN_EMAIL,
          subject,
          html,
        });
        emailsSent.push({ to: employeeEmail, subject, status: "success" });
      } catch (err) {
        emailsSent.push({
          to: employeeEmail,
          subject,
          status: "failed",
          error: err.message,
        });
      }
    }

    // Send to HR
    if (sendTo === "hr" || sendTo === "both") {
      const subject = "New Employee Enrollment in Attendance System";
      const html = `
        <p>Dear HR Team,</p>
        <p>As requested, <strong>${employeeName}</strong> (Employee ID: ${employeeId}) has been enrolled into the fingerprint attendance system by ${assignedBy}.</p>
        <p>Best regards,<br/>${assignedBy}</p>
      `;
      try {
        await sendEmail({
          to: process.env.HR_EMAIL,
          subject,
          html,
        });
        emailsSent.push({
          to: process.env.HR_EMAIL,
          subject,
          status: "success",
        });
      } catch (err) {
        emailsSent.push({
          to: process.env.HR_EMAIL,
          subject,
          status: "failed",
          error: err.message,
        });
      }
    }

    // Save audit record
    await FingerprintAudit.create({
      employeeId,
      employeeName,
      employeeEmail,
      assignedBy,
      sendTo,
      emailsSent,
    });

    res.status(200).json({
      message: "Fingerprint assignment processed successfully",
      summary: emailsSent,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to process assignment" });
  }
};
