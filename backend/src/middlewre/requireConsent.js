import { evaluateAccess } from "../utils/evaluateAccess.js";
import { operationOutcome } from "../fhir/operationOutcome.js";

const FHIR_JSON = "application/fhir+json";

export default async function requireConsent(req, res, next) {
  const { id: patientId } = req.params;
  const { emergency, reason } = req.query;

  const result = await evaluateAccess(patientId, req.user, {
    emergency: emergency === "true",
    reason,
  });

   if (!result.allowed) {
    return res.status(403).type(FHIR_JSON).json(
      operationOutcome(
        "error",
        "forbidden",
        "Access to this patient's record has not been granted. A request has been sent to the patient."
      )
    );
  }

   req.accessBasis = result.basis;
  next();
}