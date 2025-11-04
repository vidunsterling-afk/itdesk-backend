import express from "express";
import {
    createBill,
    getBills,
    payBill,
    deleteBill,
    sendEmailReminders,
    getReports,
    exportBillsExcel,
    getPendingBillCount
} from "../controllers/billController.js";

const router = express.Router();

router.post("/", createBill);
router.get("/", getBills);
router.patch("/pay/:id", payBill);
router.delete("/:id", deleteBill);
router.get("/send-email-reminders", sendEmailReminders);
router.get("/reports", getReports);
router.get("/export-excel", exportBillsExcel);
router.get("/pending-count", getPendingBillCount);

export default router;
