import AuditEvent from "../models/auditEvent.Model.js";
import User from "../models/user.Model.js";

export default async function getAuditLog(req, res) {
  const user = await User.findById(req.user.id);
  if (!user?.spherePatientId) {
    return res.status(404).json({ status: "NOT_FOUND", message: "No SPHERE patient record is linked to this account" });
  }

  const events = await AuditEvent.find({ patient_id: user.spherePatientId })
    .sort({ occurred_at: -1 });

  return res.status(200).json({ status: "OK", events });
}