import crypto from "node:crypto";
import FhirResource from "../models/fhirResource.Model.js";
import { operationOutcome } from "../fhir/operationOutcome.js";

const FHIR_JSON = "application/fhir+json";

export default async function createPatient(req, res) {
    const body = req.body;

    if (!body || body.resourceType !== "Patient") {
        return res.status(400).type(FHIR_JSON).json(
        operationOutcome("error", "invalid", "Body must be a FHIR Patient resource")
        );
    }

    const fhirId = crypto.randomUUID();          // server owns the id
    const now = new Date().toISOString();

    const resource = body;
    resource.id = fhirId;
    // meta is optional in FHIR, so the client may not have sent it.
    // make sure the object exists before we write into it.
    if (!resource.meta) {
    resource.meta = {};
    }
    resource.meta.versionId = "1";        // first version of this resource
    resource.meta.lastUpdated = now;      // when we stored it



  try {
    await FhirResource.create({ resourceType: "Patient", fhirId, resource });
  } catch (error) {
    console.error(`Error creating Patient: ${error}`);
    return res.status(500).type(FHIR_JSON).json(
      operationOutcome("error", "exception", "Failed to store Patient")
    );
  }

  return res
    .status(201)
    .location(`/fhir/Patient/${fhirId}`)
    .set("ETag", 'W/"1"')
    .type(FHIR_JSON)
    .json(resource);
}