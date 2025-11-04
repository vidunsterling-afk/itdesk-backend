import express from "express";
import {
  addEmployee,
  getEmployees,
  getEmployeeById,
  updateEmployee,
  deleteEmployee,
  assignAssetsToEmployee,
  unassignAssetsFromEmployee,
  exportEmployeesExcel,
} from "../controllers/employeeController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(protect);

router.post("/", addEmployee); // Add employee
router.get("/", getEmployees); // Get all employees
router.get("/export-excel", exportEmployeesExcel);
router.get("/:id", getEmployeeById); // Get single employee
router.put("/:id", updateEmployee); // Update employee
router.delete("/:id", deleteEmployee); // Delete employee

router.put("/assign/:employeeId", assignAssetsToEmployee);
router.put("/unassign/:employeeId", unassignAssetsFromEmployee);

export default router;
