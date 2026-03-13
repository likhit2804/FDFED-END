import mongoose from "mongoose";

const flatSchema = new mongoose.Schema(
    {
        flatNumber: { type: String, required: true }, // e.g., "A-101"
        floor: { type: Number, required: true },      // e.g., 1
        status: {
            type: String,
            enum: ["Vacant", "Occupied", "Owner"],
            default: "Vacant"
        },
        registrationCode: {
            type: String,
            index: { unique: true, partialFilterExpression: { registrationCode: { $type: "string" } } }
        }, // unique per-flat code for self-registration, sparse alternative
        residentId: { type: mongoose.Schema.Types.ObjectId, ref: "Resident", default: null },
        block: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Block",
            required: true
        },
        community: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Community",
            required: true
        }
    },
    { timestamps: true }
);

flatSchema.index({ community: 1 });
flatSchema.index({ block: 1 });
// Index on registrationCode handled by unique constraint

const Flat = mongoose.model("Flat", flatSchema);
export default Flat;
