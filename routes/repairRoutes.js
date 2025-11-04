import express from "express";
import multer from "multer";
import path from "path";
import {
  createRepair,
  markAsReturned,
  getRepairs,
  getRepairById,
  deleteRepair,
} from "../controllers/repairController.js";

const router = express.Router();

// Configure Multer for file uploads
const storage = multer.diskStorage({
  destination: "uploads/gatepass/",
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

const fileFilter = (req, file, cb) => {
  const allowed = ["image/jpeg", "image/png", "image/jpg"];
  if (allowed.includes(file.mimetype)) cb(null, true);
  else cb(new Error("Invalid file type. Only JPG/PNG allowed."), false);
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 },
});

// Routes
router.post("/", createRepair);
router.get("/", getRepairs);
router.get("/:id", getRepairById);
router.put("/:id/return", upload.single("proofImage"), markAsReturned);
router.delete("/:id", deleteRepair);

export default router;
