import crypto from "node:crypto";
import FhirResource from "../models/fhirResource.Model.js";
import { findPatientByIdentifier, findPatientByDemographics, mergeIdentifiers, rewriteReferences, findResourceBySource } from "./patientResolver.js";

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

    // the source's own key for this resource: its id, or a hash of its content 
    const sourceId = res.id
      || crypto.createHash("sha256").update(JSON.stringify(res)).digest("hex");

    let realId;
    if (res.resourceType === "Patient") {
    let existing = await findPatientByIdentifier(res.identifier);
    if (!existing) {
      existing = await findPatientByDemographics(res);
    }
    if (existing) {
       res.identifier = await mergeIdentifiers(existing.id, res.identifier);
    }
    realId = existing ? existing.id : crypto.randomUUID();
  } else {
      const existing = await findResourceBySource(res.resourceType, sourceSystem, sourceId);
      realId = existing ? existing.id : crypto.randomUUID();
    }

    idMap[entry.fullUrl] = `${res.resourceType}/${realId}`;
    stashed.push({ resourceType: res.resourceType, realId, sourceId, resource: res });
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

    return { resourceType: item.resourceType, fhirId: item.realId, sourceId: item.sourceId, resource };
    });


for (const item of toStore) {
    const isPatient = item.resourceType === "Patient";

    if (isPatient) {
      await FhirResource.findOneAndUpdate(
        { resourceType: "Patient", fhirId: item.fhirId },
        {
          $set: { resource: item.resource, deleted: false },
          $setOnInsert: { sourceSystem, sourceId: item.sourceId }
        },
        { upsert: true }
      );
    } else {
      await FhirResource.findOneAndUpdate(
        { resourceType: item.resourceType, fhirId: item.fhirId },
        { $set: { resource: item.resource, deleted: false, sourceSystem, sourceId: item.sourceId } },
        { upsert: true }
      );
    }
  }

  return toStore;
}
