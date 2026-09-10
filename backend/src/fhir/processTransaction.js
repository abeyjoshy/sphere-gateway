import crypto from "node:crypto";
import FhirResource from "../models/fhirResource.Model.js";
import { findPatientByIdentifier, rewriteReferences } from "./patientResolver.js";

const SUPPORTED = [
"Patient", "Condition", "AllergyIntolerance",
"Observation", "MedicationStatement", "DocumentReference", "Encounter",
];

export async function processTransaction(bundle, sourceSystem){

 if (!bundle || bundle.resourceType !== "Bundle" || !["transaction", "batch"].includes(bundle.type)) {
    const err = new Error("Body must be a Bundle of type 'transaction' or 'batch'");
    err.isValidation = true;
    throw err;
  }

    const entries = bundle.entry || [];
    const now = new Date().toISOString();
    const idMap = {};
    const stashed = [];

    for (const entry of entries) {
    const res = entry.resource;

    if (!res || !SUPPORTED.includes(res.resourceType)) {
      const err = new Error(`Unsupported resource in bundle: ${res?.resourceType}`);
      err.isValidation = true;
      throw err;
    }

    let realId;
    if (res.resourceType === "Patient") {
      const existing = await findPatientByIdentifier(res.identifier);
      realId = existing ? existing.id : crypto.randomUUID();
    } else {
      realId = crypto.randomUUID();
    }

    idMap[entry.fullUrl] = `${res.resourceType}/${realId}`;
    stashed.push({ resourceType: res.resourceType, realId, resource: res });
  }

    const toStore = stashed.map((item) => {
    const resource = rewriteReferences(item.resource, idMap);

    resource.id = item.realId;

    // meta is optional — the sender may not have included it.
    // create it before we write fields into it, or the next lines crash.
    if (!resource.meta) {
        resource.meta = {};
    }
    resource.meta.versionId = "1";
    resource.meta.lastUpdated = now;
    resource.meta.source = sourceSystem;

    return { resourceType: item.resourceType, fhirId: item.realId, resource };
    });



  for (const item of toStore) {
    await FhirResource.findOneAndUpdate(
      { resourceType: item.resourceType, fhirId: item.fhirId },
      { $set: { resource: item.resource, deleted: false } },
      { upsert: true }
    );
  }

  return toStore;

}