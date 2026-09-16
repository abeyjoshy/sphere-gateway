import User from "../models/user.Model.js";

const ALLOWED_ROLES = ["admin", "doctor"];

export default async function createUser(req, res) {
  const name = req.body?.name || null;
  const email = req.body?.email || null;
  const password = req.body?.password || null;
  const organization = req.body?.organization || null;

  // accept roles: ["doctor"]  OR  role: "doctor"  — default ["patient"]
  
  let roles = req.body?.roles ?? (req.body?.role ? [req.body.role] : ["patient"]);
  if (!Array.isArray(roles)) roles = [roles];

  if (!name || !email || !password) {
    return res.status(400).json({
      status: "BAD_REQUEST",
      message: "name, email and password are required",
    });
  }

  const invalid = roles.filter((r) => !ALLOWED_ROLES.includes(r));
  if (invalid.length) {
    return res.status(400).json({
      status: "BAD_REQUEST",
      message: `Invalid role(s): ${invalid.join(", ")}`,
    });
  }

  try {
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(409).json({ status: "FAILED", message: "User already exists" });
    }

    const newUser = new User({ name, email: email.toLowerCase(), password, roles, organization });
    await newUser.save();

    return res.status(201).json({
      status: "SUCCESS",
      message: "User created successfully",
      data: { id: newUser._id, name: newUser.name, email: newUser.email, roles: newUser.roles },
    });
  } catch (error) {
    console.error(`Error creating user: ${error}`);
    return res.status(500).json({ status: "ERROR", message: "Error creating user" });
  }
}