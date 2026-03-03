import express from "express";
import {
    getResidentCommonSpaces,
    getBookingById,
    createBooking,
    cancelBooking,
    getFacilities,
    getResidentBookings,
} from "../controllers/resident.js";

const csbResidentRouter = express.Router();

csbResidentRouter.get("/commonSpace", getResidentCommonSpaces);
csbResidentRouter.post("/commonSpace/:id", getBookingById);
csbResidentRouter.post("/commonSpace", createBooking);
csbResidentRouter.put("/booking/cancel/:id", cancelBooking);
csbResidentRouter.get("/api/facilities", getFacilities);
csbResidentRouter.get("/api/bookings", getResidentBookings);

export default csbResidentRouter;
