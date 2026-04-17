import React from "react";
import { Modal, StatusBadge } from "../../shared";

const DETAIL_FIELDS = [
    { label: "Booking ID", render: (b) => `#${b._id?.slice(-6)}` },
    { label: "Status", render: (b) => <StatusBadge status={b.status} /> },
    { label: "Facility", render: (b) => b.name, icon: "bi-building" },
    { label: "Date", render: (b) => b.date, icon: "bi-calendar" },
    { label: "Time", render: (b) => `${b.from} - ${b.to}`, icon: "bi-clock" },
    { label: "Created", render: (b) => b.created, icon: "bi-person-circle" },
    { label: "Purpose", render: (b) => b.purpose, icon: "bi-card-text", full: true },
];

/**
 * Booking details modal with payment and cancellation info.
 */
export const BookingDetailsModal = ({ booking, isOpen, onClose, onPayment }) => {
    const isCancelled = booking?.isCancelled || false;
    const paymentRequired = booking?.paymentStatus !== "Completed" && booking?.amount > 0;

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Booking Details"
            size="md"
            footer={
                !isCancelled && paymentRequired && booking?.payment?.status !== "Completed" && (
                    <button className="btn btn-success" onClick={onPayment}>Proceed to Payment</button>
                )
            }
        >
            {booking && (
                <>
                    <div className="details-grid shadow-sm">
                        {DETAIL_FIELDS.map(({ label, render, icon, full }) => (
                            <div className={`detail-item${full ? " col-span-2" : ""}`} key={label}>
                                {icon && <i className={`bi ${icon} text-primary`} />}
                                <div>
                                    <span className="detail-label">{label}</span>
                                    <span className="detail-value">{render(booking)}</span>
                                </div>
                            </div>
                        ))}
                    </div>

                    {isCancelled && (
                        <div className="cancellation-box">
                            <h4>Cancellation Details</h4>
                            <div className="detail-item"><span className="detail-label">Reason</span><span className="detail-value">Cancelled by user</span></div>
                            <div className="detail-item"><span className="detail-label">Cancelled By</span><span className="detail-value">Resident A</span></div>
                            <div className="detail-item"><span className="detail-label">Cancelled On</span><span className="detail-value">2025-10-18</span></div>
                        </div>
                    )}

                    {!isCancelled && paymentRequired && (
                        <div className="payment-section">
                            <h4>Payment Information</h4>
                            <div className="payment-grid">
                                <div className="detail-item"><span className="detail-label">Amount</span><span className="detail-value text-success">₹{booking.amount}</span></div>
                                <div className="detail-item"><span className="detail-label">Payment Status</span><span className={`detail-value ${booking?.payment?.status === "Completed" ? "text-success" : "text-danger"}`}>{booking.payment?.status}</span></div>
                            </div>
                        </div>
                    )}
                </>
            )}
        </Modal>
    );
};
