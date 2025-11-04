import express from "express";
import {
  addSoftware,
  getSoftware,
  updateSoftware,
  deleteSoftware,
} from "../controllers/softwareController.js";

const router = express.Router();

router.post("/", addSoftware);
router.get("/", getSoftware);
router.put("/:id", updateSoftware);
router.delete("/:id", deleteSoftware);

export default router;
