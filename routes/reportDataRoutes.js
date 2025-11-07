import express from "express";
import { uploadReport, getReports } from "../controllers/reportDataController.js";

const router = express.Router();

router.post("/upload", uploadReport);
router.get("/", getReports);

export default router;
