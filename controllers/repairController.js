import Repair from "../models/Repair.js";
import Asset from "../models/Asset.js";
import { sendEmail } from "../utils/sendEmail.js";
import { v4 as uuidv4 } from "uuid";
import path from "path";
import fs from "fs";
import QRCode from "qrcode";

// Create new repair record (dispatch)
export const createRepair = async (req, res) => {
  try {
    const {
      assetId,
      reason,
      vendor,
      notes,
      sendEmail: sendMail = false,
    } = req.body;

    const asset = await Asset.findById(assetId);
    if (!asset) return res.status(404).json({ message: "Asset not found" });

    const gatePassNumber = "GP-" + uuidv4().slice(0, 8).toUpperCase();

    const repair = new Repair({
      asset: assetId,
      reason,
      vendor,
      notes,
      gatePassNumber,
    });

    await repair.save();

    // Update asset status
    asset.status = "under-repair";
    await asset.save();

    // Generate qr code
    const qrData = `${process.env.FRONTEND_URL}/repair/scan/${repair.id}`;
    const qrCodeUrl = await QRCode.toDataURL(qrData);

    // Save the qr url in the repair documant
    repair.qrCode = qrCodeUrl;
    await repair.save();

    // Optional email notification
    if (sendMail && process.env.ADMIN_EMAIL) {
      await sendEmail({
        to: process.env.ADMIN_EMAIL,
        subject: `🧰 Asset Sent for Repair (${asset.name})`,
        html: `
          <p><b>Asset:</b> ${asset.name} (${asset.assetTag})</p>
          <p><b>Vendor:</b> ${vendor}</p>
          <p><b>Reason:</b> ${reason}</p>
          <p><b>Gate Pass No:</b> ${gatePassNumber}</p>
          <hr/>
          <p style="font-size: 0.9em; color: #555;">
            ⚠️ This is an auto-generated email from IT Desk.
          </p>
        `,
      });
    }

    res.json({ message: "Repair record created", repair });
  } catch (err) {
    console.error(err);
    if (err.code === 11000) {
      return res.status(400).json({
        message: "Duplicate gate pass number detected. Please try again.",
      });
    }
    res.status(500).json({ message: err.message });
  }
};

// Mark as returned
export const markAsReturned = async (req, res) => {
  try {
    const { id } = req.params;
    const { notes } = req.body;
    let proofImagePath = null;

    if (req.file) {
      proofImagePath = `/uploads/gatepass/${req.file.filename}`;
    }

    const repair = await Repair.findById(id).populate("asset");
    if (!repair) return res.status(404).json({ message: "Repair not found" });

    // Update repair and asset in parallel
    repair.status = "returned";
    repair.returnDate = new Date();
    repair.gatePassProof = proofImagePath || repair.gatePassProof;
    repair.notes = notes || repair.notes;

    repair.asset.status = "available";

    await Promise.all([repair.save(), repair.asset.save()]);

    // Send return notification
    if (process.env.ADMIN_EMAIL) {
      await sendEmail({
        to: process.env.ADMIN_EMAIL,
        subject: `✅ Asset Returned from Repair (${repair.asset.name})`,
        html: `
          <p><b>Asset:</b> ${repair.asset.name}</p>
          <p><b>Gate Pass No:</b> ${repair.gatePassNumber}</p>
          <p><b>Returned On:</b> ${new Date().toLocaleString()}</p>
          <p><b>Notes:</b> ${notes || "N/A"}</p>
          <hr/>
          <p style="font-size: 0.9em; color: #555;">
            ✔️ This is an auto-generated email from IT Desk.
          </p>
        `,
      });
    }

    res.json({ message: "Repair marked as returned", repair });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
};

// Fetch all or filtered repair records
export const getRepairs = async (req, res) => {
  try {
    const { status } = req.query;
    const query = status ? { status } : {};

    const repairs = await Repair.find(query)
      .populate("asset", "name assetTag category status")
      .sort({ dispatchDate: -1 });

    res.json(repairs);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get single repair by ID
export const getRepairById = async (req, res) => {
  try {
    const repair = await Repair.findById(req.params.id).populate("asset");
    if (!repair) return res.status(404).json({ message: "Repair not found" });
    res.json(repair);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Delete repair record (Admin only)
export const deleteRepair = async (req, res) => {
  try {
    const { id } = req.params;
    const repair = await Repair.findById(id);
    if (!repair) return res.status(404).json({ message: "Repair not found" });

    await repair.deleteOne();
    res.json({ message: "Repair record deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
