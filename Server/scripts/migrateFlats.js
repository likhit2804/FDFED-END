import mongoose from "mongoose";
import dotenv from "dotenv";
import Community from "../models/communities.js";
import Block from "../models/blocks.js";
import Flat from "../models/flats.js";

dotenv.config();

/**
 * MIGRATION SCRIPT
 * Run this ONCE to move embedded `blocks` out of the `Community` collection
 * into the new relational `Block` and `Flat` collections.
 */

async function runMigration() {
    try {
        await mongoose.connect(process.env.MONGO_URI1 || process.env.MONGO_URI);
        console.log("✅ Connected to MongoDB");

        // We must use `collection.find()` because Mongoose `Community` model
        // no longer has the `blocks` field defined in its schema!
        const communities = await mongoose.connection.collection("communities").find({}).toArray();
        console.log(`🔍 Found ${communities.length} communities to process.`);

        let totalBlocks = 0;
        let totalFlats = 0;

        for (const community of communities) {
            if (!community.blocks || community.blocks.length === 0) {
                console.log(`⏭️ Skipping Community ${community.name} (No blocks found)`);
                continue;
            }

            console.log(`\n⚙️ Migrating Community: ${community.name} (${community.blocks.length} blocks)`);

            for (const b of community.blocks) {
                // 1. Create the Block Document
                const newBlock = new Block({
                    name: b.name,
                    community: community._id,
                    totalFloors: b.totalFloors || 0,
                    flatsPerFloor: b.flatsPerFloor || 0
                });

                const savedBlock = await newBlock.save();
                totalBlocks++;

                // 2. Create the Flat Documents
                if (b.flats && b.flats.length > 0) {
                    const flatDocs = b.flats.map(f => ({
                        flatNumber: f.flatNumber,
                        floor: f.floor,
                        status: f.status || "Vacant",
                        registrationCode: f.registrationCode,
                        residentId: f.residentId || null,
                        block: savedBlock._id,
                        community: community._id
                    }));

                    await Flat.insertMany(flatDocs);
                    totalFlats += flatDocs.length;
                }
            }

            // 3. Delete the embedded blocks array from the Community document
            await mongoose.connection.collection("communities").updateOne(
                { _id: community._id },
                { $unset: { blocks: 1 } }
            );
            console.log(`✅ Stripped embedded blocks array from Community: ${community.name}`);
        }

        console.log("\n🎉 Migration Complete!");
        console.log(`📊 Stats: Created ${totalBlocks} Blocks and ${totalFlats} Flats.`);

    } catch (err) {
        console.error("❌ Migration failed:", err);
    } finally {
        process.exit(0);
    }
}

runMigration();
