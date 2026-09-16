import { processTransaction } from "../fhir/processTransaction.js";
import { transactionResponseBundle } from "../fhir/bundle.js";
import { operationOutcome } from "../fhir/operationOutcome.js";
import { writeAudit } from "../utils/writeAudit.js";

const FHIR_JSON = "application/fhir+json";

export default async function handleTransaction(req, res) {
  try {
    const source = req.get("x-source-system") || "unknown";
    const stored = await processTransaction(req.body, source);

    const patientItem = stored.find((item) => item.resourceType === "Patient");
    if (patientItem) {
      await writeAudit({
        patientId: patientItem.fhirId,
        action: "sync",
        actor: req.user,
        sourceSystem: source,
        outcome: "success",
      });
    }

    return res.status(200).type(FHIR_JSON).json(transactionResponseBundle(stored));
  } catch (err) {
    if (err.isValidation) {
      return res.status(400).type(FHIR_JSON).json(operationOutcome("error", "invalid", err.message));
    }
    console.error(`Bundle processing failed: ${err}`);
    return res.status(500).type(FHIR_JSON).json(operationOutcome("error", "exception", "Failed to process bundle"));
  }
}
