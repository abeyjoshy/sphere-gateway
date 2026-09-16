import AccessRequest from "../models/accessRequest.Model.js";
import User from "../models/user.Model.js";

export default async function approveAccessRequest(req, res) {
  const { id } = req.params;

  const user = await User.findById(req.user.id);
  if (!user?.spherePatientId) {
    return res.status(404).json({ status: "NOT_FOUND", message: "No SPHERE patient record is linked to this account" });
  }

  const request = await AccessRequest.findOne({ _id: id, patient_id: user.spherePatientId });
  if (!request) {
    return res.status(404).json({ status: "NOT_FOUND", message: "Access request not found" });
  }

  request.status = "approved";
  request.approved_at = new Date();
  await request.save();

  return res.status(200).json({ status: "OK", request });
}