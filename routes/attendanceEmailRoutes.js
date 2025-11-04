import express from "express";
import { notifyFingerprintAssignment } from "../controllers/attendanceEmailController.js";

const router = express.Router();

// POST /api/attendance/notify
router.post("/notify", notifyFingerprintAssignment);

export default router;
