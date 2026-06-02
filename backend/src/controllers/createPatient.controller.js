import Patient from "../models/patient.Model.js";
import generateSpherePatientId from "../utils/generateSphereID.js";

export default async function createPatient(req, res) {

    const {
        first_name,
        last_name,
        date_of_birth,
        gender,
        phone,
        email
    } = req.body;

    if (
        !first_name ||
        !last_name ||
        !date_of_birth
    ) {
        return res.status(400).json({
            status: "BAD_REQUEST",
            message: "first_name, last_name and date_of_birth are required"
        });
    }

    try {

        const sphere_patient_id = await generateSpherePatientId();

        const newPatient = new Patient({
            sphere_patient_id,
            first_name,
            last_name,
            date_of_birth,
            gender,
            phone,
            email
        });

        await newPatient.save();

        return res.status(201).json({
            status: "SUCCESS",
            message: "Patient created successfully",
            payLoad: newPatient
        });

    } catch (error) {

        console.error(`Error creating patient: ${error}`);

        return res.status(500).json({
            status: "ERROR",
            message: "Failed to create patient",
            error: error.message
        });
    }
}