
import AccessRequest from "../models/accessRequest.Model.js";
import User from "../models/user.Model.js";

export default async function getAccessRequests(req, res) {
  const user = await User.findById(req.user.id);
  if (!user?.spherePatientId) {
    return res.status(404).json({ status: "NOT_FOUND", message: "No SPHERE patient record is linked to this account" });
  }

  const requests = await AccessRequest.find({ patient_id: user.spherePatientId })
    .populate("doctor_id", "name email")
    .sort({ requested_at: -1 });

  return res.status(200).json({ status: "OK", requests });
}