import express from "express";
import { registerUser, loginUser } from "../controllers/authController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/register", registerUser);
router.post("/login", loginUser);

// Example protected route
router.get("/profile", protect, (req, res) => {
  res.json({ message: `Welcome ${req.user.username}` });
});

export default router;
