import User from "../models/user.Model.js";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

export default async function generateAuthToken(req, res) {

    const email = req.body?.email || null;
    const password = req.body?.password || null;

    if (!email || !password) {
        return res.status(400).json({
            status: "BAD_REQUEST",
            message: "email and password are required"
        });
    }

    try {

        const user = await User.findOne({
            email: email.toLowerCase()
        });

        if (!user) {
            return res.status(401).json({
                status: "FAILED",
                message: "Invalid email or password"
            });
        }

        if (!user.is_active) {
            return res.status(403).json({
                status: "FAILED",
                message: "User account is inactive"
            });
        }

        const isPasswordValid = await user.comparePassword(password);

        if (!isPasswordValid) {
            return res.status(401).json({
                status: "FAILED",
                message: "Invalid email or password"
            });
        }

        const token = jwt.sign(
            {
                id: user._id,
                email: user.email,
                roles: user.roles
            },
            process.env.JWT_SECRET,
            {
                expiresIn: process.env.JWT_EXPIRES_IN || "1d"
            }
        );

        return res.status(200).json({
            status: "SUCCESS",
            message: "Successfully generated token",
            payLoad: {
                token,
                user: {
                    id: user._id,
                    name: user.name,
                    email: user.email,
                    roles: user.roles,
                    organization: user.organization
                }
            }
        });

    } catch (error) {

        console.error(`Error in user authentication: ${error}`);

        return res.status(500).json({
            status: "ERROR",
            message: "Error in user authentication",
            error: error.message
        });
    }
}