import dotenv from "dotenv";
import mongoose from "mongoose";
import crypto from "node:crypto";
import mongooseClient from "../src/config/mongod.conf.js";
import User from "../src/models/user.Model.js";
import FhirResource from "../src/models/fhirResource.Model.js";
import { findPatientByIdentifier, findPatientByDemographics, mergeIdentifiers } from "../src/fhir/patientResolver.js";

dotenv.config();

const ADMIN_NAME     = process.env.SEED_ADMIN_NAME     || "admin";
const ADMIN_EMAIL    = process.env.SEED_ADMIN_EMAIL    || "admin@sphere.com";
const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD || "Sphere@123";

const PPSN_SYSTEM = "http://www.hse.ie/ppsn";

// Same email/password as their own local-hospital login — a documented
// coincidence of convenience for the demo, not a real credential link.
const DOCTORS = [
  { name: "Dr. Abey", email: "abey@sphere.com", password: "Sphere@123" },
  { name: "Dr. Joshy", email: "joshy@sphere.com", password: "Sphere@123" },
];

// The two people seeded with matching name/dob/ppsn in both Epic's and
// Evolve's own seed scripts. Resolved here the same way
// registerPatient.controller.js resolves a self-registering patient —
// identifier match, then demographic fallback, then create if neither
// finds anything — so this works whether Epic/Evolve have synced them
// to SPHERE yet or not.
const PATIENTS = [
  { name: "Arjun Mehta", email: "arjun.mehta@example.com", password: "Patient@123", dob: "1985-03-22", ppsn: "1234567A" },
  { name: "Priya Nair", email: "priya.nair@example.com", password: "Patient@123", dob: "1990-11-08", ppsn: "2345678B" },
];

async function seed() {
  await mongooseClient.connect();

  // mongooseClient.connect() swallows its own errors, so check the state ourselves
  if (mongoose.connection.readyState !== 1) {
    console.error("Could not connect to MongoDB. Check your .env settings.");
    process.exit(1);
  }

  await seedAdmin();
  await seedDoctors();
  await seedPatients();

  await mongoose.disconnect();
  process.exit(0);
}

async function seedAdmin() {
  const existing = await User.findOne({ email: ADMIN_EMAIL.toLowerCase() });

  if (existing) {
    console.log(`Admin already exists: ${existing.email} (roles: ${existing.roles.join(", ")})`);
    return;
  }

  const admin = new User({
    name: ADMIN_NAME,
    email: ADMIN_EMAIL.toLowerCase(),
    password: ADMIN_PASSWORD, // hashed automatically by the pre('save') hook
    roles: ["admin"],
  });
  await admin.save();

  console.log("Admin user created:");
  console.log(`  email:    ${ADMIN_EMAIL}`);
  console.log(`  password: ${ADMIN_PASSWORD}`);
  console.log("Log in and change this password.");
}

async function seedDoctors() {
  for (const doc of DOCTORS) {
    const existing = await User.findOne({ email: doc.email.toLowerCase() });
    if (existing) {
      console.log(`Doctor already exists: ${existing.email}`);
      continue;
    }

    const doctor = new User({
      name: doc.name,
      email: doc.email.toLowerCase(),
      password: doc.password,
      roles: ["doctor"],
    });
    await doctor.save();

    console.log(`Doctor created: ${doc.email} / ${doc.password}`);
  }
}

async function seedPatients() {
  for (const p of PATIENTS) {
    const existingUser = await User.findOne({ email: p.email.toLowerCase() });
    if (existingUser) {
      console.log(`Patient user already exists: ${existingUser.email}`);
      continue;
    }

    const nameParts = p.name.trim().split(" ");
    const firstName = nameParts[0];
    const lastName = nameParts.length > 1 ? nameParts.slice(1).join(" ") : firstName;

    let patient = await findPatientByIdentifier([{ system: PPSN_SYSTEM, value: p.ppsn }]);

    if (!patient) {
      patient = await findPatientByDemographics({
        name: [{ given: [firstName], family: lastName }],
        birthDate: p.dob,
      });
    }

    if (patient) {
      // Epic or Evolve already synced this person — attach the PPSN so
      // both are linked to the exact same SPHERE record from here on.
      const mergedIdentifiers = await mergeIdentifiers(patient.id, [{ system: PPSN_SYSTEM, value: p.ppsn }]);
      await FhirResource.findOneAndUpdate(
        { resourceType: "Patient", fhirId: patient.id },
        { $set: { "resource.identifier": mergedIdentifiers } }
      );
    } else {
      // Neither hospital has synced this person yet — create their SPHERE
      // record now; a later sync from either system will merge onto this
      // same record via the shared PPSN.
      const fhirId = crypto.randomUUID();

      const resource = {
        resourceType: "Patient",
        id: fhirId,
        identifier: [{ system: PPSN_SYSTEM, value: p.ppsn }],
        name: [{ given: [firstName], family: lastName }],
        birthDate: p.dob,
        meta: { versionId: "1", lastUpdated: new Date().toISOString(), source: "SPHERE-seed" },
      };

      await FhirResource.create({ resourceType: "Patient", fhirId, resource });
      patient = resource;
    }

    const newUser = new User({
      name: p.name,
      email: p.email.toLowerCase(),
      password: p.password,
      roles: ["patient"],
      spherePatientId: patient.id,
    });
    await newUser.save();

    console.log(`Patient user created: ${p.email} / ${p.password} (linked to Patient/${patient.id})`);
  }
}

seed().catch(async (error) => {
  console.error(`Seed failed: ${error}`);
  await mongoose.disconnect();
  process.exit(1);
});
