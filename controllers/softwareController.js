import Software from "../models/Software.js";
import nodemailer from "nodemailer";

// 📧 Email transporter
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.SMTP_EMAIL,
    pass: process.env.SMTP_PASS,
  },
});

// ➕ Add Software / License
export const addSoftware = async (req, res) => {
  try {
    const data = req.body;
    const software = new Software(data);
    await software.save();
    res.status(201).json(software);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to add software" });
  }
};

// 🧾 Get All Software
export const getSoftware = async (req, res) => {
  try {
    const software = await Software.find().populate("assignedTo", "name email");
    res.json(software);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch software" });
  }
};

// ✏️ Update Software
export const updateSoftware = async (req, res) => {
  try {
    const updated = await Software.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: "Update failed" });
  }
};

// ❌ Delete Software
export const deleteSoftware = async (req, res) => {
  try {
    await Software.findByIdAndDelete(req.params.id);
    res.json({ message: "Software deleted" });
  } catch (err) {
    res.status(500).json({ message: "Delete failed" });
  }
};

// 🔄 Circulate Renewals Automatically
export const circulateRenewals = async () => {
  const today = new Date();

  const softwares = await Software.find({
    expiryDate: {
      $lte: new Date(
        today.getFullYear(),
        today.getMonth(),
        today.getDate() + 7
      ),
    },
    notified: false,
  }).populate("assignedTo", "email name");

  for (const s of softwares) {
    const msg = `
      <h3>Renewal Reminder</h3>
      <p>Software: <b>${s.name}</b></p>
      <p>Expires on: ${new Date(s.expiryDate).toDateString()}</p>
      <p>Assigned To: ${s.assignedTo?.name || "Unassigned"}</p>
      <p>Notes: ${s.notes || "No notes"}</p>
    `;

    await transporter.sendMail({
      from: process.env.SMTP_EMAIL,
      to: process.env.ALERT_EMAIL || process.env.SMTP_EMAIL,
      subject: `⚠️ Renewal Reminder: ${s.name}`,
      html: msg,
    });

    s.notified = true;
    await s.save();
  }
};

// 🕓 Auto Renew (monthly/yearly)
export const autoRenew = async () => {
  const today = new Date();
  const expired = await Software.find({ expiryDate: { $lt: today } });

  for (const s of expired) {
    if (s.autoRenew) {
      const next = new Date(s.expiryDate);
      s.expiryDate =
        s.renewalCycle === "monthly"
          ? new Date(next.setMonth(next.getMonth() + 1))
          : new Date(next.setFullYear(next.getFullYear() + 1));
      s.status = "active";
      s.notified = false;
      await s.save();
    } else {
      s.status = "expired";
      await s.save();
    }
  }
};
