import Router from "express";
import generateAuthToken from "../controllers/auth.controller.js";
import authenticateToken from "../middlewre/authenticateToken.js";

import createUser from "../controllers/createUser.controller.js";
import getAllUsers from "../controllers/getAllUsers.controller.js";
import requireRole from "../middlewre/requireRole.js";



const router = Router();

router.post("/login", generateAuthToken)

/*Users*/
router.post("/users", authenticateToken, requireRole("admin"), createUser);
router.get("/users",  authenticateToken, requireRole("admin"), getAllUsers);


export default router;
