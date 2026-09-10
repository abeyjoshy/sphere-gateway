import { Router } from "express";
import authenticateToken from "../middlewre/authenticateToken.js";
import createPatient from "../controllers/createPatient.controller.js";
import getPatientById from "../controllers/getPatientBySphereId.controller.js";
import searchPatients from "../controllers/getAllPatients.controller.js";
import handleTransaction from "../controllers/fhirTransaction.controller.js";
import requireRole from "../middlewre/requireRole.js";

const router = Router();

router.post("/Patient", authenticateToken, requireRole("doctor","admin"), createPatient);
router.get("/Patient", authenticateToken, requireRole("doctor","admin"), searchPatients);
router.get("/Patient/:id", authenticateToken, requireRole("doctor","admin"), getPatientById);

router.post("/",authenticateToken, requireRole("doctor","admin"), handleTransaction);   // = POST /fhir

export default router;
