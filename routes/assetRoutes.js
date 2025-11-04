import express from "express";
import {
  addAsset,
  getAssets,
  getAssetById,
  updateAsset,
  deleteAsset,
  exportAssetsExcel,
  getAssetByQR,
} from "../controllers/assetController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// All routes protected
router.use(protect);

router.post("/", addAsset);
router.get("/", getAssets);
router.get("/scan/:assetTag", getAssetByQR);
router.get("/:id", getAssetById);
router.get("/export/excel", exportAssetsExcel);
router.put("/:id", updateAsset);
router.delete("/:id", deleteAsset);

export default router;
