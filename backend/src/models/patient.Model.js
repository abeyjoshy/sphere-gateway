import mongoose from 'mongoose';

/*
Allergy Schema
*/
const allergySchema = new mongoose.Schema({
    substance: {
        type: String,
        required: true,
        trim: true
    },
    reaction: {
        type: String,
        trim: true
    },
    severity: {
        type: String,
        enum: ['mild', 'moderate', 'severe', 'unknown'],
        default: 'unknown'
    }
}, { _id: false });

/*
Medication Schema
*/
const medicationSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    dosage: {
        type: String,
        trim: true
    },
    frequency: {
        type: String,
        trim: true
    },
    prescribed_by: {
        type: String,
        trim: true
    }
}, { _id: false });

/*
Condition Schema
*/
const conditionSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    status: {
        type: String,
        enum: ['active', 'resolved', 'chronic', 'unknown'],
        default: 'active'
    },
    diagnosed_date: {
        type: Date
    }
}, { _id: false });

/*
Lab Result Schema
*/
const labResultSchema = new mongoose.Schema({
    test_name: {
        type: String,
        required: true,
        trim: true
    },
    value: {
        type: String,
        required: true,
        trim: true
    },
    unit: {
        type: String,
        trim: true
    },
    test_date: {
        type: Date,
        required: true
    },
    provider: {
        type: String,
        trim: true
    }
}, { _id: false });

/*
Clinical Note Schema
*/
const clinicalNoteSchema = new mongoose.Schema({
    note: {
        type: String,
        required: true
    },
    written_by: {
        type: String,
        trim: true
    },
    provider: {
        type: String,
        trim: true
    },
    source_system: {
        type: String,
        trim: true
    },
    note_date: {
        type: Date,
        default: Date.now
    }
}, { _id: false });


/*
External Patient IDs
Used for linking records from different hospitals/GP systems
*/
const externalIdSchema = new mongoose.Schema({
    system_name: {
        type: String,
        required: true,
        trim: true
    },
    external_patient_id: {
        type: String,
        required: true,
        trim: true
    }
}, { _id: false });

/*
Timeline Event Schema
*/
const timelineEventSchema = new mongoose.Schema({
    event_type: {
        type: String,
        enum: [
            'condition',
            'medication',
            'lab_result',
            'allergy',
            'clinical_note',
            'visit',
            'prescription'
        ],
        required: true
    },

    title: {
        type: String,
        required: true,
        trim: true
    },

    description: {
        type: String,
        trim: true
    },

    event_date: {
        type: Date,
        required: true
    },

    provider: {
        type: String,
        trim: true
    },

    source_system: {
        type: String,
        trim: true
    },

    source_id: {
    type: String,
    trim: true
    },

    data: {
        type: mongoose.Schema.Types.Mixed
    }

}, { _id: false });

/*
Patient Schema
*/
const patientSchema = new mongoose.Schema({

    /*
    Internal SPHERE Patient ID
    */
    sphere_patient_id: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },

    /*
    Link to User account if patient can login
    */
    linked_user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },

    first_name: {
        type: String,
        required: true,
        trim: true
    },

    last_name: {
        type: String,
        required: true,
        trim: true
    },

    date_of_birth: {
        type: Date,
        required: true
    },

    gender: {
        type: String,
        enum: ['male', 'female', 'other', 'unknown'],
        default: 'unknown'
    },

    phone: {
        type: String,
        trim: true
    },

    email: {
        type: String,
        lowercase: true,
        trim: true
    },

    address: {
        line1: String,
        city: String,
        county: String,
        country: String,
        eircode: String
    },

    /*
    IDs from external systems
    */
    external_ids: [externalIdSchema],

    /*
    Structured Medical Data
    */
    allergies: [allergySchema],

    medications: [medicationSchema],

    conditions: [conditionSchema],

    lab_results: [labResultSchema],

    clinical_notes: [clinicalNoteSchema],

    /*
    Unified Patient Timeline
    */
    timeline: [timelineEventSchema],

    is_active: {
        type: Boolean,
        default: true
    }

}, {
    timestamps: true
});

const Patient = mongoose.model(
    'Patient',
    patientSchema,
    'patient_data'
);

export default Patient;