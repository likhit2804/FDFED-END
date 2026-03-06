export const validateBookingPayload = (newBooking) => {
    const {
        facility,
        Date: dateString,
        from,
        to,
        Type,
        timeSlots,
    } = newBooking || {};

    if (!facility || !dateString) {
        return {
            valid: false,
            status: 400,
            message: "Facility, date, and time are required fields.",
        };
    }

    const bookingDate = new Date(dateString);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (bookingDate < today) {
        return {
            valid: false,
            status: 400,
            message: "Cannot book for past dates.",
        };
    }

    if (Type === "Slot") {
        const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
        if (!timeRegex.test(from) || !timeRegex.test(to)) {
            return { valid: false, status: 400, message: "Invalid time format." };
        }

        const [fromHour, fromMin] = from.split(":").map(Number);
        const [toHour, toMin] = to.split(":").map(Number);
        const fromMinutes = fromHour * 60 + fromMin;
        const toMinutes = toHour * 60 + toMin;

        if (toMinutes <= fromMinutes) {
            return {
                valid: false,
                status: 400,
                message: "End time must be after start time.",
            };
        }

        if (!timeSlots || timeSlots.length === 0) {
            return {
                valid: false,
                status: 400,
                message: "Selected time range is invalid.",
            };
        }

        return { valid: true, bookingDate, fromMinutes, toMinutes, timeSlots };
    }

    return { valid: true, bookingDate };
};
