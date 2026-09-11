import crypto from "node:crypto";
import FhirResource from "../models/fhirResource.Model.js";
import { operationOutcome } from "../fhir/operationOutcome.js";
import { findPatientByIdentifier } from "../fhir/patientResolver.js";

const FHIR_JSON = "application/fhir+json";

export default async function createPatient(req, res) {
    const body = req.body;

    if (!body || body.resourceType !== "Patient") {
        return res.status(400).type(FHIR_JSON).json(
        operationOutcome("error", "invalid", "Body must be a FHIR Patient resource")
        );
    }

    try{
        
    // conditional create: if a patient with one of these identifiers already exists, return it
    const existing = await findPatientByIdentifier(body.identifier || []);
    if (existing) {
      return res.status(200).type(FHIR_JSON).json(existing);
    }
    const fhirId = crypto.randomUUID();          // server owns the id
    const now = new Date().toISOString();

    const resource = body;
    resource.id = fhirId;
    if (!resource.meta) {
    resource.meta = {};
    }
    resource.meta.versionId = "1";        // first version of this resource
    resource.meta.lastUpdated = now;      // when we stored it


    await FhirResource.create({ resourceType: "Patient", fhirId, resource });

    return res
      .status(201)
      .location(`/fhir/Patient/${fhirId}`)
      .set("ETag", 'W/"1"')
      .type(FHIR_JSON)
      .json(resource);

  } catch (error) {
    console.error(`Error creating Patient: ${error}`);
    return res.status(500).type(FHIR_JSON).json(
      operationOutcome("error", "exception", "Failed to store Patient")
    );
  }
}