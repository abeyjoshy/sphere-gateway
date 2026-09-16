import AccessRequest from "../models/accessRequest.Model.js";

export default async function requestAccess(req, res) {
  const { id } = req.params;
  const { reason } = req.body;

  await AccessRequest.findOneAndUpdate(
    { patient_id: id, doctor_id: req.user.id, status: "pending" },
    {
      $setOnInsert: {
        patient_id: id,
        doctor_id: req.user.id,
        reason: reason || "Requesting access to patient record",
        status: "pending",
      },
    },
    { upsert: true }
  );

  return res.status(200).json({ status: "OK", message: "Access request sent" });
}
