import FhirResource from "../models/fhirResource.Model.js";
import { searchsetBundle } from "./bundle.js";

export async function buildEverythingBundle(fhirId, baseUrl) {
  const patientDoc = await FhirResource.findOne({
    resourceType: "Patient", fhirId, deleted: false,
  });

  if (!patientDoc) return null;

  const patientRef = `Patient/${fhirId}`;

  const linked = await FhirResource.find({
    resourceType: { $ne: "Patient" },
    deleted: false,
    $or: [
      { "resource.subject.reference": patientRef },
      { "resource.patient.reference": patientRef },
    ],
  });

  const allResources = [patientDoc.resource].concat(linked.map((d) => d.resource));
  return searchsetBundle(allResources, baseUrl);
}