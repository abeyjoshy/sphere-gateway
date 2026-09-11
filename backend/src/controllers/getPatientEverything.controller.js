import FhirResource from "../models/fhirResource.Model.js";
import { operationOutcome } from "../fhir/operationOutcome.js";
import { searchsetBundle } from "../fhir/bundle.js";

const FHIR_JSON = "application/fhir+json";

export default async function getPatientEverything(req, res) {
  const { id } = req.params;

  try {
    const patientDoc = await FhirResource.findOne({
      resourceType: "Patient", fhirId: id, deleted: false,
    });

    if (!patientDoc) {
      return res.status(404).type(FHIR_JSON).json(
        operationOutcome("error", "not-found", `No Patient with id '${id}'`)
      );
    }

    const patientRef = `Patient/${id}`;

    const linked = await FhirResource.find({
      resourceType: { $ne: "Patient" },
      deleted: false,
      $or: [
        { "resource.subject.reference": patientRef },
        { "resource.patient.reference": patientRef },
      ],
    });

    const baseUrl = `${req.protocol}://${req.get("host")}/fhir`;

    // build one plain array: the patient's own data, then every linked resource
    const allResources = [];
    allResources.push(patientDoc.resource);

    for (const doc of linked) {
      allResources.push(doc.resource);
    }

    const bundle = searchsetBundle(allResources, baseUrl);

    return res.status(200).type(FHIR_JSON).json(bundle);
  } catch (error) {
    console.error(`Error building $everything for Patient ${id}: ${error}`);
    return res.status(500).type(FHIR_JSON).json(
      operationOutcome("error", "exception", "Failed to build patient record")
    );
  }
}