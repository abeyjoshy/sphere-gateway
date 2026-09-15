import { Router } from "express";
import authenticateToken from "../middlewre/authenticateToken.js";
import createPatient from "../controllers/createPatient.controller.js";
import getPatientById from "../controllers/getPatientBySphereId.controller.js";
import searchPatients from "../controllers/getAllPatients.controller.js";
import handleTransaction from "../controllers/fhirTransaction.controller.js";
import requireRole from "../middlewre/requireRole.js";
import getPatientEverything from "../controllers/getPatientEverything.controller.js";
import deleteResource from "../controllers/deleteResource.controller.js";

const router = Router();

router.post("/Patient", authenticateToken, requireRole("doctor","admin"), createPatient);
router.get("/Patient", authenticateToken, requireRole("doctor","admin"), searchPatients);
router.get("/Patient/:id", authenticateToken, requireRole("doctor","admin"), getPatientById);
router.get("/Patient/:id/\\$everything", authenticateToken, requireRole("doctor", "admin"), getPatientEverything);

router.post("/",authenticateToken, requireRole("doctor","admin"), handleTransaction);   // = POST /fhir

router.delete("/:resourceType/:id", authenticateToken, requireRole("patient"), deleteResource);

export default router;
