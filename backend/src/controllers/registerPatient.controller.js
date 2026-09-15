import crypto from "node:crypto";
import User from "../models/user.Model.js";
import FhirResource from "../models/fhirResource.Model.js";
import { findPatientByIdentifier } from "../fhir/patientResolver.js";

const PPSN_SYSTEM = "http://www.hse.ie/ppsn";

export default async function registerPatient(req, res) {
  const name = req.body?.name || null;
  const email = req.body?.email || null;
  const password = req.body?.password || null;
  const dob = req.body?.dob || null;
  const ppsn = req.body?.ppsn || null;

  if (!name || !email || !password || !dob || !ppsn) {
    return res.status(400).json({
      status: "BAD_REQUEST",
      message: "name, email, password, dob and ppsn are required",
    });
  }

  try {
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ status: "FAILED", message: "An account with this email already exists" });
    }

    // Reuses the exact same matching function sync already uses — a person
    // registering is really just "matching by identifier" from the other side.
    let patient = await findPatientByIdentifier([{ system: PPSN_SYSTEM, value: ppsn }]);

    if (!patient) {
      // No hospital has ever synced this person — create their SPHERE record now.
      const nameParts = name.trim().split(" ");
      const firstName = nameParts[0];
      const lastName = nameParts.length > 1 ? nameParts.slice(1).join(" ") : firstName;
      const fhirId = crypto.randomUUID();

      const resource = {
        resourceType: "Patient",
        id: fhirId,
        identifier: [{ system: PPSN_SYSTEM, value: ppsn }],
        name: [{ given: [firstName], family: lastName }],
        birthDate: dob,
        meta: { versionId: "1", lastUpdated: new Date().toISOString(), source: "SPHERE-portal" },
      };

      await FhirResource.create({ resourceType: "Patient", fhirId, resource });
      patient = resource;
    }

    const newUser = new User({
      name,
      email: email.toLowerCase(),
      password,
      roles: ["patient"],
      spherePatientId: patient.id,
    });

    await newUser.save();

    return res.status(201).json({
      status: "SUCCESS",
      message: "Account created",
      payLoad: { id: newUser._id, name: newUser.name, email: newUser.email },
    });
  } catch (error) {
    console.error(`Error registering patient: ${error}`);
    return res.status(500).json({ status: "ERROR", message: "Registration failed", error: error.message });
  }
}