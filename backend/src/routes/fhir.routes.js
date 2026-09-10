import { Router } from "express";
import authenticateToken from "../middlewre/authenticateToken.js";
import createPatient from "../controllers/createPatient.controller.js";
import getPatientById from "../controllers/getPatientBySphereId.controller.js";
import searchPatients from "../controllers/getAllPatients.controller.js";

const router = Router();

router.post("/Patient", createPatient);
router.get("/Patient", authenticateToken, searchPatients);
router.get("/Patient/:id", authenticateToken, getPatientById);

export default router;
