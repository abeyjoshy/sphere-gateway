import User from "../models/user.Model.js";

export default async function createUser(req, res) {

    const name = req.body?.name || null;
    const email = req.body?.email || null;
    const password = req.body?.password || null;
    const role = req.body?.role || "patient";
    const organization = req.body?.organization || null;

    if (name && email && password) {

        try {

            // Check if email already exists
            const existingUser = await User.findOne({
                email: email.toLowerCase()
            });

            if (existingUser) {
                return res.status(400).json({
                    status: "FAILED",
                    message: "User already exists"
                });
            }

            // Create User
            const newUser = new User({
                name,
                email: email.toLowerCase(),
                password,
                role,
                organization
            });

            await newUser.save();

            res.status(201).json({
                status: "SUCCESS",
                message: "User created successfully",
                data: {
                    id: newUser._id,
                    name: newUser.name,
                    email: newUser.email,
                    role: newUser.role
                }
            });

        } catch (error) {

            console.error(`Error creating user: ${error}`);

            return res.status(500).json({
                status: "ERROR",
                message: "Error creating user",
                error: error.message
            });
        }

    } else {

        return res.status(400).json({
            status: "BAD_REQUEST",
            message: "name, email and password are required"
        });
    }
}