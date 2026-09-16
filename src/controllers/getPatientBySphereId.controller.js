import FhirResource from "../models/fhirResource.Model.js";
import { operationOutcome } from "../fhir/operationOutcome.js";

const FHIR_JSON = "application/fhir+json";

export default async function getPatientById(req, res) {
  const { id } = req.params;

  try {
    const doc = await FhirResource.findOne({
      resourceType: "Patient", fhirId: id, deleted: false,
    });

    if (!doc) {
      return res.status(404).type(FHIR_JSON).json(
        operationOutcome("error", "not-found", `No Patient with id '${id}'`)
      );
    }

    return res.status(200).type(FHIR_JSON).json(doc.resource);
  } catch (error) {
    console.error(`Error reading Patient: ${error}`);
    return res.status(500).type(FHIR_JSON).json(
      operationOutcome("error", "exception", "Failed to read Patient")
    );
  }
}