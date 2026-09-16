import FhirResource from "../models/fhirResource.Model.js";
import { searchsetBundle } from "../fhir/bundle.js";
import { operationOutcome } from "../fhir/operationOutcome.js";
import { findPatientByIdentifier } from "../fhir/patientResolver.js";

const FHIR_JSON = "application/fhir+json";

export default async function searchPatients(req, res) {
  try {
    const identifierParam = req.query?.identifier;
    const baseUrl = `${req.protocol}://${req.get("host")}/fhir`;

    if (identifierParam) {
      const [system, value] = identifierParam.split("|");
      const match = await findPatientByIdentifier([{ system, value }]);

      const bundle = searchsetBundle(match ? [match] : [], baseUrl);
      return res.status(200).type(FHIR_JSON).json(bundle);
    }

    const docs = await FhirResource.find({ resourceType: "Patient", deleted: false })
      .sort({ createdAt: -1 });

    const bundle = searchsetBundle(docs.map((d) => d.resource), baseUrl);
    return res.status(200).type(FHIR_JSON).json(bundle);
  } catch (error) {
    console.error(`Error searching Patients: ${error}`);
    return res.status(500).type(FHIR_JSON).json(
      operationOutcome("error", "exception", "Failed to search Patients")
    );
  }
}