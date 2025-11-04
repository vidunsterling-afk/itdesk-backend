import express from "express";
import M365Usage from "../models/m365Usage.model.js";
import { updateM365Usage } from "../services/m365Usage.service.js";

const router = express.Router();

// 📊 Get all usage data
router.get("/usage", async (req, res) => {
  const data = await M365Usage.find().sort({ displayName: 1 });
  res.json(data);
});

// 🔄 Manual refresh
router.get("/refresh", async (req, res) => {
  await updateM365Usage();
  res.json({ message: "Microsoft 365 data refreshed successfully." });
});

// 🕒 Last sync date
router.get("/lastSync", async (req, res) => {
  const latest = await M365Usage.findOne().sort({ reportDate: -1 });
  res.json({ lastSync: latest?.reportDate || null });
});

// 1️⃣ High usage alerts (70%+)
router.get("/alerts/high-usage", async (req, res) => {
  const users = await M365Usage.find();
  const highUsage = users.filter(
    (u) =>
      u.mailboxUsedMB / u.mailboxQuotaMB >= 0.7 ||
      u.onedriveUsedMB / u.onedriveTotalMB >= 0.7
  );
  res.json({ data: highUsage });
});

// 2️⃣ Inactive accounts (default 60 days)
router.get("/alerts/inactive", async (req, res) => {
  const days = parseInt(req.query.days) || 60;
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);

  const inactive = await M365Usage.find({ lastActivityDate: { $lt: cutoff } });
  res.json({ data: inactive });
});

// 3️⃣ Growth trends per user
router.get("/analytics/trends/:user", async (req, res) => {
  const user = req.params.user.toLowerCase();
  const data = await M365Usage.find({ userPrincipalName: user }).sort({
    reportDate: 1,
  });
  res.json({ data });
});

// 4️⃣ Top storage users (OneDrive)
router.get("/analytics/top-storage", async (req, res) => {
  const topUsers = await M365Usage.find()
    .sort({ onedriveUsedMB: -1 })
    .limit(10);
  res.json({ data: topUsers });
});

export default router;
