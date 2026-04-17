import mongoose from "mongoose";

const blockSchema = new mongoose.Schema(
    {
        name: { type: String, required: true }, // e.g., "Block A"
        community: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Community",
            required: true
        },
        totalFloors: { type: Number, required: true },
        flatsPerFloor: { type: Number, required: true }
    },
    { timestamps: true }
);

blockSchema.index({ community: 1 });

const Block = mongoose.model("Block", blockSchema);
export default Block;
