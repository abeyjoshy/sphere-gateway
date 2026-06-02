import Router from "express";
import generateAuthToken from "../controllers/auth.controller.js";
import authenticateToken from "../middlewre/authenticateToken.js";

import createUser from "../controllers/createUser.controller.js";
import getAllUsers from "../controllers/getAllUsers.controller.js";
import createPatient from "../controllers/createPatient.controller.js";
import getAllPatients from "../controllers/getAllPatients.controller.js";
import getPatientBySphereId from "../controllers/getPatientBySphereId.controller.js";

const router = Router();

router.post("/login", generateAuthToken)

/*Users*/
router.post("/users", createUser);
router.get("/users", authenticateToken, getAllUsers);


router.post("/patients", createPatient);
router.get("/patients", authenticateToken, getAllPatients);
router.get("/patients/:sphere_patient_id", authenticateToken, getPatientBySphereId);

export default router;
