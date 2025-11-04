import express from "express";
import {
  createMonth,
  getMonths,
  getMonth,
  updateMonth,
  deleteMonth,
  addAddon,
} from "../controllers/monthController.js";

const router = express.Router();

router.post("/", createMonth);
router.get("/", getMonths);
router.get("/:id", getMonth);
router.put("/:id", updateMonth);
router.delete("/:id", deleteMonth);
router.post("/:id/addon", addAddon);

export default router;
