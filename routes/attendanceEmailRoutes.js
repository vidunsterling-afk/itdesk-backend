import express from "express";
import { notifyFingerprintAssignment } from "../controllers/attendanceEmailController.js";
import FingerprintAudit from "../models/FingerprintAudit.js";

const router = express.Router();

router.post("/notify", notifyFingerprintAssignment);
router.get("/logs", async (req, res) => {
  try {
    const logs = await FingerprintAudit.find().sort({ createdAt: -1 });
    res.status(200).json(logs);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to fetch logs" });
  }
});

export default router;
