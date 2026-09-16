     import mongoose from "mongoose";

const auditEventSchema = new mongoose.Schema({
    patient_id: {
        type: String,
        required: true
    },

    action: {
        type: String,
        enum: ['sync', 'access', 'request', 'approve', 'deny', 'revoke'],
        required: true
    },

    actor_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },

    actor_email: {
        type: String
    },

    actor_name: {
        type: String
    },

    source_system: {
        type: String
    },

    basis: {
        type: String
    },

    outcome: {
        type: String,
        enum: ['success', 'denied'],
        required: true
    },

    reason: {
        type: String
    },

    occurred_at: {
        type: Date,
        default: Date.now
    }
});

const AuditEvent = mongoose.model('AuditEvent', auditEventSchema);

export default AuditEvent;