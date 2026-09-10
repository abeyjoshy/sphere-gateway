import FhirResource from "../models/fhirResource.Model.js";
import { searchsetBundle } from "../fhir/bundle.js";
import { operationOutcome } from "../fhir/operationOutcome.js";

const FHIR_JSON = "application/fhir+json";

export default async function searchPatients(req, res) {
  try {
    const docs = await FhirResource.find({ resourceType: "Patient", deleted: false })
      .sort({ createdAt: -1 });

    const baseUrl = `${req.protocol}://${req.get("host")}/fhir`;
    const bundle = searchsetBundle(docs.map((d) => d.resource), baseUrl);

    return res.status(200).type(FHIR_JSON).json(bundle);
  } catch (error) {
    console.error(`Error searching Patients: ${error}`);
    return res.status(500).type(FHIR_JSON).json(
      operationOutcome("error", "exception", "Failed to search Patients")
    );
  }
}
