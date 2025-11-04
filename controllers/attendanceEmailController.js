import { sendEmail } from "../utils/sendEmail.js";

export const notifyFingerprintAssignment = async (req, res) => {
  const { employeeName, employeeEmail, assignedBy, employeeId, sendTo } =
    req.body;

  if (!employeeName || !employeeEmail || !assignedBy || !employeeId) {
    return res.status(400).json({ message: "Missing required fields" });
  }

  if (!sendTo) {
    return res.status(400).json({ message: "Missing email target option" });
  }

  try {
    const sent = [];

    // Email to Employee
    if (sendTo === "employee" || sendTo === "both") {
      const employeeSubject = "Fingerprint Attendance System Assignment";
      const employeeHtml = `
        <p>Hello ${employeeName},</p>
        <p>You have been assigned to the fingerprint attendance system by ${assignedBy}.</p>
        <p>Please acknowledge this assignment.</p>
        <p>Thank you.</p>
      `;

      await sendEmail({
        to: employeeEmail,
        cc: process.env.ADMIN_EMAIL,
        subject: employeeSubject,
        html: employeeHtml,
      });
      sent.push("employee");
    }

    // Email to HR Team
    if (sendTo === "hr" || sendTo === "both") {
      const hrSubject = "New Employee Enrollment in Attendance System";
      const hrHtml = `
        <p>Dear HR Team,</p>
        <p>As requested by HR, I have enrolled User ${employeeId} – ${employeeName} into the attendance fingerprint system.</p>
        <p>Please let me know if any further action is required.</p>
        <p>Best regards,<br>${assignedBy}</p>
      `;

      await sendEmail({
        to: process.env.HR_EMAIL,
        subject: hrSubject,
        html: hrHtml,
      });
      sent.push("hr");
    }

    res.status(200).json({
      message: `Email(s) sent successfully to: ${sent.join(", ")}`,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to send emails" });
  }
};
