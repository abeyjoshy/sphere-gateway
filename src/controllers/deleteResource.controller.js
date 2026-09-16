import FhirResource from "../models/fhirResource.Model.js";
import User from "../models/user.Model.js";
import { operationOutcome } from "../fhir/operationOutcome.js";

const FHIR_JSON = "application/fhir+json";

const SAFETY_CRITICAL = ["Patient", "AllergyIntolerance", "MedicationStatement"];

export default async function deleteResource(req, res) {
  const { resourceType, id } = req.params;

  if (resourceType === "Patient") {
    return res.status(400).type(FHIR_JSON).json(
      operationOutcome("error", "not-supported", "Cannot delete a Patient resource through this endpoint")
    );
  }

   if (SAFETY_CRITICAL.includes(resourceType)) {
    return res.status(400).type(FHIR_JSON).json(
      operationOutcome(
        "error",
        "not-supported",
        `Cannot delete a ${resourceType} resource — safety-critical data must remain visible to treating clinicians`
      )
    );
  }

  try {
    const user = await User.findById(req.user.id);
    if (!user?.spherePatientId) {
      return res.status(404).type(FHIR_JSON).json(
        operationOutcome("error", "not-found", "No SPHERE patient record is linked to this account")
      );
    }

    const doc = await FhirResource.findOne({ resourceType, fhirId: id, deleted: false });

    if (!doc) {
      return res.status(404).type(FHIR_JSON).json(
        operationOutcome("error", "not-found", `No ${resourceType} with id '${id}'`)
      );
    }

    const patientRef = `Patient/${user.spherePatientId}`;
    const belongsToCaller =
      doc.resource.subject?.reference === patientRef ||
      doc.resource.patient?.reference === patientRef;

    if (!belongsToCaller) {
      return res.status(403).type(FHIR_JSON).json(
        operationOutcome("error", "forbidden", "This record does not belong to your account")
      );
    }

    doc.deleted = true;
    await doc.save();

    return res.status(204).send();
  } catch (error) {
    console.error(`Error deleting ${resourceType}/${id}: ${error}`);
    return res.status(500).type(FHIR_JSON).json(
      operationOutcome("error", "exception", "Failed to process deletion request")
    );
  }
}
