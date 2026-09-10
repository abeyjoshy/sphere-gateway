import mongoose from "mongoose";

const fhirResourceSchema = new mongoose.Schema(
  {
    resourceType: { type: String, required: true },
    sourceSystem: { type: String },
    sourceId: { type: String },
    fhirId: { type: String, required: true },
    resource: { type: mongoose.Schema.Types.Mixed, required: true }, // full FHIR JSON
    deleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

fhirResourceSchema.index({ resourceType: 1, fhirId: 1, sourceSystem: 1, sourceId: 1 }, { unique: true });

export default mongoose.model("FhirResource", fhirResourceSchema, "fhir_resources");