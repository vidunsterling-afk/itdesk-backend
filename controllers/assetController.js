import Asset from "../models/Asset.js";
import ExcelJS from "exceljs";
import QRCode from "qrcode";

// Helper to generate full QR code from asset
const generateFullQR = async (asset) => {
  const fullData = {
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
    assignedTo: asset.assignedTo
      ? {
          name: asset.assignedTo.name,
          email: asset.assignedTo.email,
          department: asset.assignedTo.department,
        }
      : null,
    remarks: asset.remarks,
  };
  return await QRCode.toDataURL(JSON.stringify(fullData));
};

// Add new asset
export const addAsset = async (req, res) => {
  try {
    const assetData = req.body;
    const asset = await Asset.create(assetData);

    // Populate assignedTo for QR
    await asset.populate("assignedTo", "name email department");

    asset.qrCode = await generateFullQR(asset);
    await asset.save();

    res.status(201).json(asset);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get all assets
export const getAssets = async (req, res) => {
  try {
    const assets = await Asset.find()
      .populate("assignedTo", "name email department")
      .sort({ createdAt: -1 });

    const assetsWithQR = await Promise.all(
      assets.map(async (asset) => {
        const fullQR = await generateFullQR(asset);
        if (asset.qrCode !== fullQR) {
          asset.qrCode = fullQR;
          await asset.save();
        }
        return asset;
      })
    );

    res.json(assetsWithQR);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get asset by ID
export const getAssetById = async (req, res) => {
  try {
    const asset = await Asset.findById(req.params.id).populate(
      "assignedTo",
      "name email department"
    );
    if (!asset) return res.status(404).json({ message: "Asset not found" });

    asset.qrCode = await generateFullQR(asset);
    await asset.save();

    res.json(asset);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get asset by QR (assetTag)
export const getAssetByQR = async (req, res) => {
  try {
    const asset = await Asset.findOne({
      assetTag: req.params.assetTag,
    }).populate("assignedTo", "name email department");
    if (!asset) return res.status(404).json({ message: "Asset not found" });

    asset.qrCode = await generateFullQR(asset);
    await asset.save();

    res.json(asset);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Update asset
export const updateAsset = async (req, res) => {
  try {
    const asset = await Asset.findById(req.params.id).populate(
      "assignedTo",
      "name email department"
    );
    if (!asset) return res.status(404).json({ message: "Asset not found" });

    Object.assign(asset, req.body);

    asset.qrCode = await generateFullQR(asset);
    await asset.save();

    res.json(asset);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Delete asset
export const deleteAsset = async (req, res) => {
  try {
    const asset = await Asset.findByIdAndDelete(req.params.id);
    if (!asset) return res.status(404).json({ message: "Asset not found" });
    res.json({ message: "Asset deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

function calculateAge(purchaseDate) {
  if (!purchaseDate) return "";

  const now = new Date();
  let years = now.getFullYear() - purchaseDate.getFullYear();
  let months = now.getMonth() - purchaseDate.getMonth();
  let days = now.getDate() - purchaseDate.getDate();

  if (days < 0) {
    months -= 1;
    days += new Date(now.getFullYear(), now.getMonth(), 0).getDate();
  }

  if (months < 0) {
    years -= 1;
    months += 12;
  }

  return `${years}y ${months}m ${days}d`;
}

// Export assets to Excel
export const exportAssetsExcel = async (req, res) => {
  try {
    const assets = await Asset.find().populate(
      "assignedTo",
      "name email department"
    );

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Assets Report");

    worksheet.columns = [
      { header: "Asset Tag", key: "assetTag", width: 15 },
      { header: "Name", key: "name", width: 20 },
      { header: "Brand", key: "brand", width: 15 },
      { header: "Model", key: "model", width: 15 },
      { header: "Serial Number", key: "serialNumber", width: 20 },
      { header: "Purchase Date", key: "purchaseDate", width: 15 },
      { header: "Age", key: "age", width: 20 },
      { header: "Warranty Expiry", key: "warrantyExpiry", width: 15 },
      { header: "Location", key: "location", width: 15 },
      { header: "Assigned To", key: "assignedTo", width: 20 },
      { header: "Email", key: "email", width: 25 },
      { header: "Department", key: "department", width: 15 },
      { header: "Remarks", key: "remarks", width: 30 },
    ];

    // Style headers
    worksheet.getRow(1).eachCell((cell) => {
      cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FF4472C4" },
      };
      cell.alignment = { vertical: "middle", horizontal: "center" };
      cell.border = {
        top: { style: "thin" },
        left: { style: "thin" },
        bottom: { style: "thin" },
        right: { style: "thin" },
      };
    });

    assets.forEach((asset) => {
      const purchaseDate = asset.purchaseDate
        ? new Date(asset.purchaseDate)
        : null;
      const age = calculateAge(purchaseDate);

      const row = worksheet.addRow({
        assetTag: asset.assetTag,
        name: asset.name,
        brand: asset.brand,
        model: asset.model,
        serialNumber: asset.serialNumber,
        purchaseDate: asset.purchaseDate
          ? asset.purchaseDate.toISOString().split("T")[0]
          : "",
        age: age,
        warrantyExpiry: asset.warrantyExpiry
          ? asset.warrantyExpiry.toISOString().split("T")[0]
          : "",
        location: asset.location,
        assignedTo: asset.assignedTo ? asset.assignedTo.name : "",
        email: asset.assignedTo ? asset.assignedTo.email : "",
        department: asset.assignedTo ? asset.assignedTo.department : "",
        remarks: asset.remarks || "",
      });

      row.eachCell((cell) => {
        cell.border = {
          top: { style: "thin" },
          left: { style: "thin" },
          bottom: { style: "thin" },
          right: { style: "thin" },
        };
      });
    });

    worksheet.autoFilter = { from: "A1", to: "L1" };

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=assets_report.xlsx"
    );

    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
};
