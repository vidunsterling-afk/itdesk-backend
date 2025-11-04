import Tag from "../models/TagModel.js";

// ✅ Create Tag
export const createTag = async (req, res) => {
  try {
    const { assetCode, username, serialNumber, purchaseDate } = req.body;

    if (!assetCode || !username || !serialNumber || !purchaseDate) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const newTag = await Tag.create({
      assetCode,
      username,
      serialNumber,
      purchaseDate,
    });

    res.status(201).json(newTag);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error while creating tag" });
  }
};

// ✅ Get all tags
export const getTags = async (req, res) => {
  try {
    const tags = await Tag.find().sort({ createdAt: -1 });
    res.status(200).json(tags);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch tags" });
  }
};

// ✅ Delete tag
export const deleteTag = async (req, res) => {
  try {
    const { id } = req.params;
    await Tag.findByIdAndDelete(id);
    res.status(200).json({ message: "Tag deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to delete tag" });
  }
};
