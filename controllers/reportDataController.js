import ReportData from "../models/ReportData.js";

// POST /api/reports/upload
export const uploadReport = async (req, res) => {
  try {
    const reports = req.body;

    if (!Array.isArray(reports)) {
      return res.status(400).json({ message: "Data must be an array" });
    }

    const saved = await ReportData.insertMany(reports);
    res
      .status(201)
      .json({ message: "Report uploaded successfully", count: saved.length });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error uploading report" });
  }
};

// GET /api/reports
export const getReports = async (req, res) => {
  try {
    const reports = await ReportData.find().sort({ uploadDate: -1 });
    res.json(reports);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error fetching reports" });
  }
};
