import FhirResource from "../models/fhirResource.Model.js";

export async function findPatientByIdentifier(identifiers = []) {
  for (const id of identifiers) {
    const doc = await FhirResource.findOne({
      resourceType: "Patient",
      deleted: false,
      "resource.identifier": { $elemMatch: { system: id.system, value: id.value } },
    });
    if (doc) return doc.resource;
  }
  return null;
}

// Fallback when no identifier matches: naive deterministic match on name + birthDate.
// NOT real patient matching (MPI) — a documented, deliberate simplification.
export async function findPatientByDemographics(patientResource) {
  const family = patientResource.name?.[0]?.family;
  const given = patientResource.name?.[0]?.given?.[0];
  const birthDate = patientResource.birthDate;

  if (!family || !given || !birthDate) return null;

  const doc = await FhirResource.findOne({
    resourceType: "Patient",
    deleted: false,
    "resource.name.family": family,
    "resource.name.given": given,
    "resource.birthDate": birthDate,
  });

  return doc ? doc.resource : null;
}


// After resolving a patient, make sure every identifier on the incoming resource
// is also stored on it — so a future sync from ANY system sharing ANY identifier
// (MRN, PPSN, whatever) matches directly next time, instead of always falling
// back to the weaker demographic match.
export async function mergeIdentifiers(storedPatientFhirId, incomingIdentifiers = []) {
  const doc = await FhirResource.findOne({ resourceType: "Patient", fhirId: storedPatientFhirId });
  if (!doc) return;

  const existing = doc.resource.identifier || [];
  const newOnes = incomingIdentifiers.filter(
    (incoming) => !existing.some((e) => e.system === incoming.system && e.value === incoming.value)
  );

  return existing.concat(newOnes);
}

export function rewriteReferences(resource, idMap) {
  let json = JSON.stringify(resource);
  for (const [tempId, realRef] of Object.entries(idMap)) {
     json = json.replaceAll(`"${tempId}"`, `"${realRef}"`); 
  }
  return JSON.parse(json);
}
// idMap = { "urn:uuid:1111": "Patient/abc-123" }

export async function findResourceBySource(resourceType, sourceSystem, sourceId) {
  if (!sourceId) return null;
  const doc = await FhirResource.findOne({
    resourceType,
    sourceSystem,
    sourceId,
    deleted: false,
  });
  return doc ? doc.resource : null;
}
