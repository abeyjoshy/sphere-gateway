import User from "../models/user.Model.js";
import { buildEverythingBundle } from "../fhir/buildEverythingBundle.js";
import { operationOutcome } from "../fhir/operationOutcome.js";

const FHIR_JSON = "application/fhir+json";

export default async function getMyRecord(req, res) {
  try {
    const user = await User.findById(req.user.id);

    if (!user?.spherePatientId) {
      return res.status(404).type(FHIR_JSON).json(
        operationOutcome("error", "not-found", "No SPHERE patient record is linked to this account")
      );
    }

    const baseUrl = `${req.protocol}://${req.get("host")}/fhir`;
    const bundle = await buildEverythingBundle(user.spherePatientId, baseUrl);

    return res.status(200).type(FHIR_JSON).json(bundle);
  } catch (error) {
    console.error(`Error building own record: ${error}`);
    return res.status(500).type(FHIR_JSON).json(
      operationOutcome("error", "exception", "Failed to build patient record")
    );
  }
}
