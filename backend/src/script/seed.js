import dotenv from "dotenv";
import mongoose from "mongoose";
import mongooseClient from "../src/config/mongod.conf.js";
import User from "../src/models/user.Model.js";

dotenv.config();

const ADMIN_NAME     = process.env.SEED_ADMIN_NAME     || "SPHERE Admin";
const ADMIN_EMAIL    = process.env.SEED_ADMIN_EMAIL    || "admin";
const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD || "Sphere@123";

async function seed() {
  await mongooseClient.connect();

  // mongooseClient.connect() swallows its own errors, so check the state ourselves
  if (mongoose.connection.readyState !== 1) {
    console.error("Could not connect to MongoDB. Check your .env settings.");
    process.exit(1);
  }

  const existing = await User.findOne({ email: ADMIN_EMAIL.toLowerCase() });

  if (existing) {
    console.log(`Admin already exists: ${existing.email} (roles: ${existing.roles.join(", ")})`);
  } else {
    const admin = new User({
      name: ADMIN_NAME,
      email: ADMIN_EMAIL.toLowerCase(),
      password: ADMIN_PASSWORD,          // hashed automatically by the pre('save') hook
      roles: ["admin"],
    });
    await admin.save();

    console.log("Admin user created:");
    console.log(`  email:    ${ADMIN_EMAIL}`);
    console.log(`  password: ${ADMIN_PASSWORD}`);
    console.log("Log in and change this password.");
  }

  await mongoose.disconnect();
  process.exit(0);
}

seed().catch(async (error) => {
  console.error(`Seed failed: ${error}`);
  await mongoose.disconnect();
  process.exit(1);
});