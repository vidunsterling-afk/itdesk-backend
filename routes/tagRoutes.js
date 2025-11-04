import express from "express";
import { createTag, getTags, deleteTag } from "../controllers/tagController.js";

const router = express.Router();

router.post("/", createTag);
router.get("/", getTags);
router.delete("/:id", deleteTag);

export default router;
