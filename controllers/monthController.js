import MonthData from "../models/MonthData.js";

// Add new month record
export const createMonth = async (req, res) => {
  try {
    const month = new MonthData(req.body);

    // Save to MongoDB
    await month.save();

    // Return the saved document
    res.status(201).json(month);
  } catch (err) {
    // Handle duplicate month+provider
    if (err.code === 11000) {
      return res.status(400).json({
        message: "This provider already has an entry for that month.",
      });
    }

    // Other errors
    console.error("❌ Error in createMonth:", err);
    res.status(500).json({ message: "Error creating month", error: err });
  }
};

// Get all months
export const getMonths = async (req, res) => {
  try {
    const months = await MonthData.find().sort({ month: -1 });
    res.json(months);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get single month
export const getMonth = async (req, res) => {
  try {
    const month = await MonthData.findById(req.params.id);
    if (!month) return res.status(404).json({ error: "Month not found" });
    res.json(month);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Update usage or base details
export const updateMonth = async (req, res) => {
  try {
    const updated = await MonthData.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Add an add-on
export const addAddon = async (req, res) => {
  try {
    const month = await MonthData.findById(req.params.id);
    if (!month) return res.status(404).json({ error: "Month not found" });

    month.addons.push(req.body);
    await month.save();
    res.json(month);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Delete month
export const deleteMonth = async (req, res) => {
  try {
    await MonthData.findByIdAndDelete(req.params.id);
    res.json({ message: "Month deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
