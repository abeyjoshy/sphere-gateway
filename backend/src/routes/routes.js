import Router from "express";
import generateAuthToken from "../controllers/auth.controller.js";
import authenticateToken from "../middlewre/authenticateToken.js";

import createUser from "../controllers/createUser.controller.js";
import getAllUsers from "../controllers/getAllUsers.controller.js";
import requireRole from "../middlewre/requireRole.js";
import registerPatient from "../controllers/registerPatient.controller.js";
import getMyRecord from "../controllers/getMyRecord.controller.js";

import getAccessRequests from "../controllers/getAccessRequests.controller.js";
import approveAccessRequest from "../controllers/approveAccessRequest.controller.js";
import denyAccessRequest from "../controllers/denyAccessRequest.controller.js";
import revokeAccessRequest from "../controllers/revokeAccessRequest.controller.js";
import requestAccess from "../controllers/requestAccess.controller.js";
import getAuditLog from "../controllers/getAuditLog.controller.js";

const router = Router();

router.post("/login", generateAuthToken)

/*Users*/
router.post("/users", authenticateToken, requireRole("admin"), createUser);
router.get("/users",  authenticateToken, requireRole("admin"), getAllUsers);
router.post("/register", registerPatient);
router.get("/getMyRecord", authenticateToken, requireRole("patient"), getMyRecord)

router.get("/consent/requests", authenticateToken, requireRole("patient"), getAccessRequests);
router.post("/consent/requests/:id/approve", authenticateToken, requireRole("patient"), approveAccessRequest);
router.post("/consent/requests/:id/deny", authenticateToken, requireRole("patient"), denyAccessRequest);
router.post("/consent/requests/:id/revoke", authenticateToken, requireRole("patient"), revokeAccessRequest);
router.post("/patients/:id/access-requests", authenticateToken, requireRole("doctor","admin"), requestAccess);
router.get("/audit-log", authenticateToken, requireRole("patient"), getAuditLog);


export default router;
