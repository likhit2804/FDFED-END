import React, { useState } from 'react';
import '../../assets/css/Resident/CommonSpace.css';

const mockAvailableSpaces = [
    { name: 'Gym', rules: 'Max 2 hours per day.', maxHours: 2 },
    { name: 'Clubhouse', rules: 'Booking requires 24hr notice.', maxHours: 4 },
    { name: 'Swimming Pool', rules: 'Open 6 AM - 10 PM. No more than 1 hour.', maxHours: 1 },
];

const formatTime = (hour) => {
    if (hour === 0) return '12:00 AM';
    if (hour < 12) return `${hour}:00 AM`;
    if (hour === 12) return '12:00 PM';
    return `${hour - 12}:00 PM`;
};


export const CommonSpaceBooking = () => {
    const [bookings, setBookings] = useState([{    _id: '1', name: 'Gym', date: '2024-03-10', from: '10:00', to: '12:00', status: 'Approved', purpose: 'Morning Workout', created: '2024-03-08' },
    { _id: '2', name: 'Clubhouse', date: '2024-03-15', from: '14:00', to: '18:00', status: 'Pending', purpose: 'Birthday Party', created: '2024-03-09' },
    { _id: '3', name: 'Swimming Pool', date: '2024-03-20', from: '08:00', to: '09:00', status: 'Rejected', purpose: 'Lap Swimming', created: '2024-03-10' },
    { _id: '4', name: 'Gym', date: '2024-03-25', from: '16:00', to: '18:00', status: 'Approved', purpose: 'Evening Workout', created: '2024-03-12'
    }]);
    const [isBookingFormOpen, setIsBookingFormOpen] = useState(false);
    const [isDetailsPopupOpen, setIsDetailsPopupOpen] = useState(false);
    const [selectedBooking, setSelectedBooking] = useState(null);
    const [formState, setFormState] = useState({
        facility: '',
        date: new Date().toISOString().split('T')[0],
        purpose: '',
        timeSlots: [],
    });
    const [selectedFacility, setSelectedFacility] = useState(null);

    const handleFacilityChange = (e) => {
        const facilityName = e.target.value;
        const selected = mockAvailableSpaces.find(s => s.name === facilityName);
        setSelectedFacility(selected);
        setFormState(prev => ({
            ...prev,
            facility: facilityName,
            timeSlots: [],
        }));
    };

    const handleTimeSlotChange = (e) => {
        const { value, checked } = e.target;
        setFormState(prev => {
            const newSlots = checked
                ? [...prev.timeSlots, value]
                : prev.timeSlots.filter(slot => slot !== value);

            newSlots.sort();

            return {
                ...prev,
                timeSlots: newSlots,
            };
        });
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormState(prev => ({ ...prev, [name]: value }));
    };

    const closeForm = () => setIsBookingFormOpen(false);

    const closeDetailsPopup = () => setIsDetailsPopupOpen(false);

    const showDetails = (booking) => {
        setSelectedBooking(booking);
        setIsDetailsPopupOpen(true);
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        if (formState.timeSlots.length === 0) {
            alert("Please select at least one time slot.");
            return;
        }

        const fromTime = formState.timeSlots[0];
        const toHour = parseInt(formState.timeSlots[formState.timeSlots.length - 1].split(':')[0]) + 1;
        const toTime = String(toHour).padStart(2, '0') + ':00';

        const finalBookingData = {
            ...formState,
            from: fromTime,
            to: toTime,
        };

        console.log("Submitting:", finalBookingData);

        closeForm();
    };

    const formatSelectedTime = () => {
        const slots = formState.timeSlots;
        if (slots.length === 0) return <span className="no-selection">No time slots selected</span>;

        const firstHour = parseInt(slots[0].split(':')[0]);
        const lastHour = parseInt(slots[slots.length - 1].split(':')[0]);

        const from = formatTime(firstHour);
        const to = formatTime(lastHour + 1);

        return `${from} - ${to}`;
    };

    const today = new Date().toISOString().split('T')[0];
    const pendingBookingsCount = bookings.filter(b => b.status === 'Pending').length;

    // Placeholder for actual data fields needed for the Details Popup
    const mockDetailBooking = selectedBooking || {
        _id: '1234567890',
        status: 'Approved',
        name: 'Clubhouse',
        date: '2025-11-20',
        from: '10:00',
        to: '14:00',
        purpose: 'Birthday Party',
        created: '2025-10-18',
        isCancelled: false,
        paymentStatus: 'Paid',
        amount: 500,
    };
    const isCancelled = mockDetailBooking.isCancelled || false;
    const paymentRequired = mockDetailBooking.amount > 0;

    return (
        <>
            <div className="d-flex justify-content-between align-items-center mb-3">
                <h4 className="section-title">Common Space Bookings</h4>
                <div className="d-flex gap-2">
                    <button
                        id="bookFacilityBtn"
                        className="btn btn-success"
                        onClick={() => setIsBookingFormOpen(true)}
                    >
                        <i className="bi bi-plus-lg me-2"></i>Book a Facility
                    </button>
                </div>
            </div>

            <div className="stats-grid mb-4">
                <div className="stat-card" style={{ borderLeftColor: 'green' }}>
                    <p className="card-label">Total Bookings (this month)</p>
                    <h2 className="card-value text-success" id="totalBookings">
                        {bookings.length}
                    </h2>
                </div>
                <div className="stat-card" style={{ borderLeftColor: 'var(--warning)' }}>
                    <p className="card-label">Pending Bookings</p>
                    <h2 className="card-value text-warning" id="pendingCount">
                        {pendingBookingsCount}
                    </h2>
                </div>
                <div className="stat-card" style={{ borderLeftColor: 'blue' }}>
                    <p className="card-label">Total Facilities</p>
                    <h2 className="card-value text-primary">10</h2>
                </div>
            </div>

            <div>
                <h4 className="table-title">Recent Bookings</h4>
                <div className="row bookings-grid" id="bookingsGrid">
                    {bookings.length > 0 ? (
                        bookings.map(b => (
                            <div key={b._id} className={`booking-card ${b.status}`}>
                                <div className="booking-card-header">
                                    <span className="booking-id">#{b._id.slice(-6)}</span>
                                    <span className={`status-badge status-${b.status}`}>{b.status}</span>
                                </div>

                                <div className="booking-details">
                                    <div className="booking-detail">
                                        <span className="detail-label">Facility:</span>
                                        <span className="detail-value">{b.name}</span>
                                    </div>
                                    <div className="booking-detail">
                                        <span className="detail-label">Date:</span>
                                        <span className="detail-value">{b.date}</span>
                                    </div>
                                    <div className="booking-detail">
                                        <span className="detail-label">Time:</span>
                                        <span className="detail-value">{b.from} - {b.to}</span>
                                    </div>
                                    {b.purpose && (
                                        <div className="booking-detail">
                                            <span className="detail-label">Purpose:</span>
                                            <span className="detail-value">{b.purpose}</span>
                                        </div>
                                    )}
                                </div>

                                <div className="booking-actions">
                                    <button className="action-btn view" onClick={() => showDetails(b)} data-id={b._id}>
                                        <i className="bi bi-eye"></i> View Details
                                    </button>
                                    {b.status === 'Pending' && (
                                        <button className="action-btn cancel" data-id={b._id}>
                                            <i className="bi bi-x-circle"></i> Cancel
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="col-12 shadow-sm rounded-2 no-bookings d-flex gap-3 justify-content-center align-items-center text-muted">
                            <i className="bi bi-calendar fs-3"></i>
                            <h4 className='m-0'>No bookings found</h4>
                        </div>
                    )}
                </div>
            </div>

            {/* --- Booking Form Popup --- */}
            {isBookingFormOpen && (
                <div id="bookingFormPopup" className="popup">
                    <div className="popup-content">
                        <div className="popup-header">
                            <h3>Book Common Space</h3>
                            <button
                                type="button"
                                className="close-btn"
                                onClick={closeForm}
                            >
                                <i className="bi bi-x"></i>
                            </button>
                        </div>

                        <form id="bookingForm" onSubmit={handleSubmit}>
                            <div className="A">
                                <div>
                                    <div className="form-group">
                                        <label htmlFor="facility">Select Facility *</label>
                                        <select
                                            id="facility"
                                            name="facility"
                                            value={formState.facility}
                                            onChange={handleFacilityChange}
                                            required
                                        >
                                            <option value="">Choose a facility...</option>
                                            {mockAvailableSpaces.map(space => (
                                                <option key={space.name} value={space.name}>
                                                    {space.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    {selectedFacility && (
                                        <>
                                            <p id="maxHoursDisplay" style={{ marginTop: '5px', fontWeight: 'bold' }}>
                                                Max Booking: {selectedFacility.maxHours} Hour{selectedFacility.maxHours !== 1 ? 's' : ''}
                                            </p>

                                            <div className="form-group">
                                                <label>Booking Rules</label>
                                                <textarea
                                                    id="bookingRulesField"
                                                    name="rules"
                                                    rows="4"
                                                    readOnly
                                                    value={selectedFacility.rules}
                                                    placeholder="Select a facility to view booking rules..."
                                                ></textarea>
                                            </div>
                                        </>
                                    )}

                                    <div className="form-group">
                                        <label htmlFor="bookingDate">Select Date *</label>
                                        <input
                                            type="date"
                                            id="bookingDate"
                                            name="date"
                                            value={formState.date}
                                            onChange={handleInputChange}
                                            required
                                            min={today}
                                        />
                                    </div>

                                    <input type="hidden" id="hiddenFromTime" name="from" value={formState.timeSlots[0] || ''} />
                                    <input type="hidden" id="hiddenToTime" name="to" value={formState.timeSlots.length > 0 ? formatTime(parseInt(formState.timeSlots[formState.timeSlots.length - 1].split(':')[0]) + 1) : ''} />

                                    <div className="form-group">
                                        <label htmlFor="purpose">Purpose (Optional)</label>
                                        <textarea
                                            id="purpose"
                                            name="purpose"
                                            rows="3"
                                            value={formState.purpose}
                                            onChange={handleInputChange}
                                            placeholder="Brief description of the purpose..."
                                        ></textarea>
                                    </div>

                                    <div className="form-actions">
                                        <button
                                            type="button"
                                            className="btn btn-secondary"
                                            onClick={closeForm}
                                        >
                                            Cancel
                                        </button>
                                        <button type="submit" className="btn btn-primary">
                                            <i className="bi bi-check-circle"></i> Submit Booking
                                        </button>
                                    </div>
                                </div>

                                <div>
                                    <div className="form-group">
                                        <label>Select Time Slots *</label>
                                        <div className="time-slots-container" id="timeSlotsContainer">
                                            <div className="time-slots-header">
                                                <h4 className="time-slots-title">
                                                    <i className="bi bi-clock"></i> Available Time Slots
                                                </h4>
                                                <div className="time-period-info">6:00 AM - 10:00 PM</div>
                                            </div>

                                            <div className="time-slots-grid">
                                                {Array.from({ length: 22 - 6 }, (_, i) => i + 6).map(hour => {
                                                    const timeStr = String(hour).padStart(2, '0') + ':00';
                                                    const displayTime = formatTime(hour);

                                                    const isChecked = formState.timeSlots.includes(timeStr);

                                                    return (
                                                        <div key={hour} className="time-slot" data-time={timeStr}>
                                                            <input
                                                                type="checkbox"
                                                                name="timeSlots"
                                                                value={timeStr}
                                                                id={`slot_${hour}`}
                                                                checked={isChecked}
                                                                onChange={handleTimeSlotChange}
                                                            />
                                                            <label htmlFor={`slot_${hour}`}>{displayTime}</label>
                                                        </div>
                                                    );
                                                })}
                                            </div>

                                            <div className="selected-time-display">
                                                <strong>Selected Time: </strong>
                                                <span id="selectedTimeText" className={formState.timeSlots.length === 0 ? "no-selection" : ""}>
                                                    {formatSelectedTime()}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* --- Booking Details Popup (FIXED) --- */}
            {isDetailsPopupOpen && (
                <div id="bookingDetailsPopup" className="popup">
                    <div className="popup-content">
                        <div className="popup-header">
                            <h2>Booking Details</h2>
                            <button className="close-btn" onClick={closeDetailsPopup}>
                                <i className="bi bi-x"></i>
                            </button>
                        </div>

                        <div className="popup-body">
                            <div className="details-grid shadow-sm">
                                <div className="detail-item">
                                    <span className="detail-label">Booking ID</span>
                                    <span className="detail-value" id="detail-id">#{mockDetailBooking._id.slice(-6)}</span>
                                </div>

                                <div className="detail-item">
                                    <span className="detail-label">Status</span>
                                    <span className={`status-badge status-${mockDetailBooking.status}`} id="detail-status">{mockDetailBooking.status}</span>
                                </div>
                                <div className="detail-item">
                                    <div className="icon-col">
                                        <i className="bi bi-building text-primary"></i>
                                    </div>
                                    <div className="d-flex flex-column">
                                        <span className="detail-label">Facility</span>
                                        <span className="detail-value" id="detail-facility">{mockDetailBooking.name}</span>
                                    </div>
                                </div>

                                <div className="detail-item">
                                    <div className="icon-col">
                                        <i className="bi bi-calendar text-primary"></i>
                                    </div>
                                    <div className="d-flex flex-column">
                                        <span className="detail-label">Date</span>
                                        <span className="detail-value" id="detail-date">{mockDetailBooking.date}</span>
                                    </div>
                                </div>
                                <div className="detail-item">
                                    <div className="icon-col">
                                        <i className="bi bi-clock text-primary"></i>
                                    </div>
                                    <div className="d-flex flex-column">
                                        <span className="detail-label">Time</span>
                                        <span className="detail-value" id="detail-time">{mockDetailBooking.from} - {mockDetailBooking.to}</span>
                                    </div>
                                </div>
                                <div className="detail-item">
                                    <div className="icon-col">
                                        <i className="bi bi-person-circle text-primary"></i>
                                    </div>
                                    <div className="d-flex flex-column">
                                        <span className="detail-label">Created</span>
                                        <span className="detail-value" id="detail-created">{mockDetailBooking.created}</span>
                                    </div>
                                </div>
                                <div className="detail-item col-span-2">
                                    <div className="icon-col">
                                        <i className="bi bi-card-text text-primary"></i>
                                    </div>
                                    <div className="d-flex flex-column">
                                        <span className="detail-label">Purpose</span>
                                        <span className="detail-value" id="detail-purpose">{mockDetailBooking.purpose}</span>
                                    </div>
                                </div>
                            </div>

                            {isCancelled && (
                                <div id="cancellation-section" className="cancellation-box">
                                    <h4>Cancellation Details</h4>
                                    <div className="detail-item">
                                        <span className="detail-label">Reason</span>
                                        <span className="detail-value" id="detail-cancellation-reason">Cancelled by user</span>
                                    </div>
                                    <div className="detail-item">
                                        <span className="detail-label">Cancelled By</span>
                                        <span className="detail-value" id="detail-cancelled-by">Resident A</span>
                                    </div>
                                    <div className="detail-item">
                                        <span className="detail-label">Cancelled At</span>
                                        <span className="detail-value" id="detail-cancelled-at">2025-10-19</span>
                                    </div>
                                </div>
                            )}

                            {paymentRequired && (
                                <div className="payment-section" id="payment-section">
                                    <h4>Payment Details</h4>
                                    <div className="row">
                                        <div className="col">
                                            <div className="detail-item">
                                                <span className="detail-label">Amount</span>
                                                <span className="detail-value" id="detail-amount">₹{mockDetailBooking.amount}</span>
                                            </div>
                                        </div>
                                        <div className="col">
                                            <div className="detail-item">
                                                <span className="detail-label">Payment Status</span>
                                                <span className="status-badge" id="detail-payment-status">{mockDetailBooking.paymentStatus}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};