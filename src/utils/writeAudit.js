import AuditEvent from "../models/auditEvent.Model.js";

export async function writeAudit({ patientId, action, actor, sourceSystem, basis, outcome, reason }) {
  try {
    await AuditEvent.create({
      patient_id: patientId,
      action,
      actor_id: actor?.id,
      actor_name: actor?.name,
      actor_email: actor?.email,
      source_system: sourceSystem,
      basis,
      outcome,
      reason,
    });
  } catch (error) {
    console.error(`Failed to write audit event: ${error.message}`);
  }
}