import mongoose from 'mongoose';

const accessRequestSchema = new mongoose.Schema({

    patient_id: {
        type: String,
        required: true
    },


    doctor_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },

    reason: {
        type: String,
        required: true
    },

    status: {
        type: String,
        enum: [
            'pending',
            'approved',
            'rejected',
            'revoked'
        ],
        default: 'pending'
    },

    requested_at: {
        type: Date,
        default: Date.now
    },

    approved_at: {
        type: Date
    },

    expires_at: {
        type: Date
    }

}, {
    timestamps: true
});

const AccessRequest = mongoose.model(
    'AccessRequest',
    accessRequestSchema
);

export default AccessRequest;