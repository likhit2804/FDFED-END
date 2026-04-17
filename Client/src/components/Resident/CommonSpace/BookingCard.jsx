import React from "react";
import { EntityCard } from "../../shared";

/**
 * Single booking card for the bookings grid.
 */
export const BookingCard = ({ booking, onViewDetails, onCancel }) => {
    const b = booking;

    const timeDetail = b?.status === "Active"
        ? { label: "Valid till", value: new Date(new Date(b.Date).setMonth(new Date(b.Date).getMonth() + 1)).toLocaleDateString("en-IN", { day: "2-digit", month: "2-digit", year: "numeric" }) }
        : { label: "Time", value: `${b?.from || "-"} - ${b?.to || "-"}` };

    return (
        <EntityCard
            id={`#${b?._id}`}
            status={b?.status}
            statusClass={`status-badge status-${(b?.status || "").toLowerCase().replace(/\s+/g, "-")}`}
            className={`resident-booking-card ${b?.status || ""}`}
            details={[
                { label: "Facility", value: b?.name || "-" },
                { label: "Date", value: b?.Date ? new Date(b.Date).toLocaleDateString("en-IN", { day: "2-digit", month: "2-digit", year: "numeric" }) : "-" },
                timeDetail,
                ...(b?.purpose ? [{ label: "Purpose", value: b.purpose }] : []),
            ]}
            actions={[
                { label: "View Details", onClick: () => onViewDetails(b), variant: "secondary", icon: <i className="bi bi-eye" /> },
                { label: "Cancel", onClick: () => onCancel(b), variant: "danger", icon: <i className="bi bi-x-circle" />, show: b?.status !== "Cancelled" && b?.Type === "Slot" },
            ]}
        />
    );
};
