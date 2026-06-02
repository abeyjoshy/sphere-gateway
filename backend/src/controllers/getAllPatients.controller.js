import Patient from "../models/patient.Model.js";

export default async function getAllPatients(req, res) {

    try {

        const patients = await Patient.find()
            .sort({ createdAt: -1 });

        return res.status(200).json({
            status: "SUCCESS",
            message: "Patients fetched successfully",
            payLoad: patients
        });

    } catch (error) {

        console.error(`Error fetching patients: ${error}`);

        return res.status(500).json({
            status: "ERROR",
            message: "Failed to fetch patients",
            error: error.message
        });
    }
}