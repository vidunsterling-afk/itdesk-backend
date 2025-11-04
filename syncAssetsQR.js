import mongoose from "mongoose";
import dotenv from "dotenv";
import QRCode from "qrcode";

import Asset from "./models/Asset.js";
import Employee from "./models/Employee.js"; // Needed for populate

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/itdesk";

mongoose
  .connect(MONGO_URI)
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.error("MongoDB connection error:", err));

async function updateAllAssetQRCodes() {
  try {
    const assets = await Asset.find().populate(
      "assignedTo",
      "name email department"
    );

    for (const asset of assets) {
      const qrData = {
        _id: asset._id,
        assetTag: asset.assetTag,
        name: asset.name,
        category: asset.category,
        brand: asset.brand,
        model: asset.model,
        serialNumber: asset.serialNumber,
        purchaseDate: asset.purchaseDate,
        warrantyExpiry: asset.warrantyExpiry,
        location: asset.location,
        status: asset.status,
        remarks: asset.remarks,
        assignedTo: asset.assignedTo
          ? {
              name: asset.assignedTo.name,
              email: asset.assignedTo.email,
              department: asset.assignedTo.department,
            }
          : null,
      };

      // Generate QR code containing the full asset object
      asset.qrCode = await QRCode.toDataURL(JSON.stringify(qrData));

      await asset.save();
      console.log(`Updated QR code for asset: ${asset.assetTag}`);
    }

    console.log("All asset QR codes updated successfully!");
    process.exit(0);
  } catch (err) {
    console.error("Error updating QR codes:", err);
    process.exit(1);
  }
}

updateAllAssetQRCodes();
