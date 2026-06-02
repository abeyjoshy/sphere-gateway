import Patient from "../models/patient.Model.js";

export default async function getPatientBySphereId(req, res) {

    const sphere_patient_id = req.params?.sphere_patient_id || null;

    if (!sphere_patient_id) {

        return res.status(400).json({
            status: "BAD_REQUEST",
            message: "sphere_patient_id is required"
        });
    }

    try {

        const patient = await Patient.findOne({
            sphere_patient_id
        });

        if (!patient) {

            return res.status(404).json({
                status: "NOT_FOUND",
                message: "Patient not found"
            });
        }

        return res.status(200).json({
            status: "SUCCESS",
            message: "Patient fetched successfully",
            payLoad: patient
        });

    } catch (error) {

        console.error(`Error fetching patient: ${error}`);

        return res.status(500).json({
            status: "ERROR",
            message: "Failed to fetch patient",
            error: error.message
        });
    }
}