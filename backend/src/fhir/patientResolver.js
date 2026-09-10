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
