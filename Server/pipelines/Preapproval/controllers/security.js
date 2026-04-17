import Visitor from "../../../models/visitors.js";

// --------------------------------------------------
// SECURITY: Get All PreApprovals in community
// --------------------------------------------------
export const getPreApprovals = async (req, res) => {
    try {
        const preApprovals = await Visitor.find({
            community: req.user.community,
        }).populate("approvedBy");

        return res.json({
            success: true,
            preApprovalList: preApprovals,
        });
    } catch (err) {
        console.error("PreApproval fetch error:", err);
        return res.status(500).json({
            success: false,
            message: "Failed to load pre-approvals",
        });
    }
};

// --------------------------------------------------
// SECURITY: Update Pre-Approval Status (approve/reject)
// --------------------------------------------------
export const updatePreApprovalStatus = async (req, res) => {
    try {
        const { ID, status } = req.body;

        const visitor = await Visitor.findById(ID).populate("approvedBy");

        if (!visitor) {
            return res.status(404).json({
                success: false,
                message: "Visitor not found",
            });
        }

        visitor.status = status;
        visitor.isCheckedIn = false;
        await visitor.save();

        return res.json({
            success: true,
            message: `Visitor ${status} successfully`,
        });
    } catch (err) {
        console.error("PreApproval update error:", err);
        return res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
};

// --------------------------------------------------
// SECURITY: Verify QR Code (check-in / check-out)
// --------------------------------------------------
export const verifyQr = async (req, res) => {
    try {
        const { token } = req.body;

        const visitor = await Visitor.findOne({ qrToken: token }).populate("approvedBy");

        if (!visitor) {
            return res.status(404).json({
                success: false,
                message: "Invalid QR token",
            });
        }

        if (!visitor.isCheckedIn) {
            visitor.isCheckedIn = true;
            visitor.checkInAt = new Date();
            visitor.status = "Active";
        } else {
            visitor.isCheckedIn = false;
            visitor.checkOutAt = new Date();
            visitor.status = "CheckedOut";
        }

        visitor.approvedBy?.notifications.push({
            n: `Visitor ${visitor.ID} is now ${visitor.status}`,
            createdAt: new Date(),
            belongs: "PA",
        });

        await visitor.save();
        if (visitor.approvedBy) await visitor.approvedBy.save();

        return res.json({
            success: true,
            visitor: {
                _id: visitor._id,
                name: visitor.name,
                status: visitor.status,
                checkInAt: visitor.checkInAt,
                checkOutAt: visitor.checkOutAt,
                isCheckedIn: visitor.isCheckedIn,
            },
        });
    } catch (err) {
        console.error("QR verification error:", err);
        return res.status(500).json({
            success: false,
            message: "QR verification failed",
        });
    }
};

// --------------------------------------------------
// SECURITY: Update PreApproval Data (legacy / full update)
// --------------------------------------------------
export const updatePreApprovalData = async (req, res) => {
    try {
        const { name, contact, requestedBy, purpose, date, vehicleNumber, ID, status } =
            req.body;

        console.log("Visitor ID received:", ID);

        const mongoose = (await import("mongoose")).default;
        if (!mongoose.Types.ObjectId.isValid(ID)) {
            return res.status(400).json({ success: false, message: "Invalid visitor ID" });
        }

        const vis = await Visitor.findById(ID).populate("approvedBy");
        if (!vis) {
            return res.status(404).json({ success: false, message: "Visitor not found" });
        }

        vis.status = status;
        vis.isCheckedIn = status === "Approved";
        vis.vehicleNumber = vehicleNumber;

        vis.approvedBy.notifications.push({
            n: `Pre approved Visitor ${vis.ID} is ${vis.status}`,
            createdAt: new Date(Date.now()),
            belongs: "PA",
        });

        await vis.approvedBy.save();
        await vis.save();

        console.log("status of visitor : ", vis.status);

        res.status(200).json({
            success: true,
            message: `Visitor ${status.toLowerCase()} successfully`,
        });
    } catch (error) {
        console.error("Error updating visitor status:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
};
