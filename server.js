import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import path from "path";
import fs from "fs";
import cron from "node-cron";
import connectDB from "./config/db.js";
import { updateM365Usage } from "./services/m365Usage.service.js";

// Routes
import authRoutes from "./routes/authRoutes.js";
import employeeRoutes from "./routes/employeeRoutes.js";
import assetRoutes from "./routes/assetRoutes.js";
import maintenanceRoutes from "./routes/maintenanceRoutes.js";
import softwareRoutes from "./routes/softwareRoutes.js";
import testRoutes from "./routes/testRoutes.js";
import billRoutes from "./routes/billRoutes.js";
import repairRoutes from "./routes/repairRoutes.js";
import monthRoutes from "./routes/monthRoutes.js";
import tagRoutes from "./routes/tagRoutes.js";
import m365Routes from "./routes/m365.routes.js";
import attendanceEmailRoutes from "./routes/attendanceEmailRoutes.js";

dotenv.config();
connectDB();
import "./scheduler/maintenanceScheduler.js";
import "./scheduler/softwareScheduler.js";
import "./scheduler/billScheduler.js";

const app = express();
app.use(cors());
app.use(express.json());

// Simulate network delay
// app.use((req, res, next) => {
//     const delay = 1000;
//     console.log("Simulate network delay");
//     setTimeout(next, delay);
// });

app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    return res.status(400).json({ message: `Upload error: ${err.message}` });
  } else if (err.message === "Invalid file type. Only JPG/PNG allowed.") {
    return res.status(400).json({ message: err.message });
  }
  next(err);
});

const uploadDir = path.join(process.cwd(), "uploads/gatepass");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

cron.schedule("0 3 * * *", async () => {
  console.log("Syncing Microsoft 365 usage...");
  await updateM365Usage();
});

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/employees", employeeRoutes);
app.use("/api/assets", assetRoutes);
app.use("/api/maintenance", maintenanceRoutes);
app.use("/api/software", softwareRoutes);
app.use("/api/test", testRoutes);
app.use("/api/bills", billRoutes);
app.use("/api/months", monthRoutes);
app.use("/api/repair", repairRoutes);
app.use("/uploads/gatepass", express.static(uploadDir));
app.use("/api/tags", tagRoutes);
app.use("/api/m365", m365Routes);
app.use("/api/attendance", attendanceEmailRoutes);

// Health Check
app.get("/api/health", (req, res) => {
  res.status(200).json({ status: "ok", message: "Backend is running.." });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port: ${PORT}`);
});
