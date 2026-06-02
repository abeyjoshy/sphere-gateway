import User from "../models/user.Model.js";

export default async function getAllUsers(req, res) {

    try {

        const users = await User.find();

        const payLoad = users.map(user => ({
            id: user._id,
            name: user.name,
            email: user.email,
            roles: user.roles
        }));

        return res.status(200).json({
            status: "SUCCESS",
            message: "Users fetched successfully",
            payLoad
        });

    } catch (error) {

        console.error(`Error fetching users: ${error}`);

        return res.status(500).json({
            status: "ERROR",
            message: "Failed to fetch users",
            error: error.message
        });
    }
}