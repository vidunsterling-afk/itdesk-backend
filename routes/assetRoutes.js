import express from "express";
import {
  addAsset,
  getAssets,
  getAssetById,
  updateAsset,
  deleteAsset,
  exportAssetsExcel,
  getAssetByQR,
  getPublicAssetById,
} from "../controllers/assetController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/public/:id", getPublicAssetById);

// All routes protected
router.use(protect);

router.post("/", addAsset);
router.get("/", getAssets);
router.get("/scan/:assetTag", getAssetByQR);
router.get("/export/excel", exportAssetsExcel);
router.get("/:id", getAssetById);
router.put("/:id", updateAsset);
router.delete("/:id", deleteAsset);

export default router;
