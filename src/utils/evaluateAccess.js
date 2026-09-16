import AccessRequest from "../models/accessRequest.Model.js";

export async function evaluateAccess(patientId, requestingUser, { emergency, reason } = {}) {
  if (requestingUser.roles.includes("admin")) {
    return { allowed: true, basis: "admin" };
  }

  const approved = await AccessRequest.findOne({
    patient_id: patientId,
    doctor_id: requestingUser.id,
    status: "approved",
  });

  if (approved && (!approved.expires_at || approved.expires_at > new Date())) {
    return { allowed: true, basis: "consent" };
  }

  if (emergency && reason) {
    return { allowed: true, basis: "emergency_override" };
  }

  return { allowed: false, basis: "denied" };
}
  