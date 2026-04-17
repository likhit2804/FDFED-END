import express from "express";
import {
    getCommonSpaces,
    getCommonSpaceBookings,
    getBookingDetails,
    rejectBooking,
    createSpace,
    updateSpace,
    deleteSpace,
    updateBookingRules,
    getSpaces,
} from "../controllers/manager.js";

const csbManagerRouter = express.Router();

csbManagerRouter.get("/commonSpace", getCommonSpaces);
csbManagerRouter.get("/commonSpace/api/bookings", getCommonSpaceBookings);
csbManagerRouter.get("/commonSpace/details/:id", getBookingDetails);
csbManagerRouter.post("/commonSpace/reject/:id", rejectBooking);

csbManagerRouter.post("/spaces", createSpace);
csbManagerRouter.put("/spaces/:id", updateSpace);
csbManagerRouter.delete("/spaces/:id", deleteSpace);

csbManagerRouter.post("/api/community/booking-rules", updateBookingRules);
csbManagerRouter.get("/api/community/spaces", getSpaces);

export default csbManagerRouter;
