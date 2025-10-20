import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import '../../assets/css/Resident/CommonSpace.css';
import { ToastContainer, toast } from 'react-toastify';
import { useDispatch, useSelector } from 'react-redux';
import { fetchuserBookings, sendUserRequest } from '../../Slices/CommonSpaceSlice';

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
    const dispatch = useDispatch();

    const { Bookings: bookings, loading: bookingLoading } = useSelector((state) => state.CommonSpace);

    const [isBookingFormOpen, setIsBookingFormOpen] = useState(false);
    const [isDetailsPopupOpen, setIsDetailsPopupOpen] = useState(false);
    const [selectedBooking, setSelectedBooking] = useState(null);
    const [selectedFacility, setSelectedFacility] = useState(null);
    const [selectedSlots, setSelectedSlots] = useState([]);

    useEffect(() => {
        dispatch(fetchuserBookings());
    }, [dispatch]);

    const { register, handleSubmit, reset } = useForm({
        defaultValues: {
            facility: '',
            date: new Date().toISOString().split('T')[0],
            purpose: '',
        },
    });

    const today = new Date().toISOString().split('T')[0];
    
    const pendingBookingsCount = bookings?.filter(b => b.status === 'Pending')?.length || 0;

    const handleFacilityChange = (e) => {
        const facilityName = e.target.value;
        const selected = mockAvailableSpaces.find(s => s.name === facilityName);
        setSelectedFacility(selected);
        setSelectedSlots([]);
    };

    const handleTimeSlotChange = (e) => {
        const value = e.target.value;
        const hour = parseInt(value.split(":")[0]);

        if (selectedSlots.includes(value)) {
            setSelectedSlots(selectedSlots.filter((slot) => slot !== value));
            return;
        }

        if (selectedSlots.length === 0) {
            setSelectedSlots([value]);
            return;
        }

        const selectedHours = selectedSlots.map((slot) => parseInt(slot.split(":")[0]));
        const min = Math.min(...selectedHours);
        const max = Math.max(...selectedHours);

        if (hour === min - 1 || hour === max + 1) {
            const newSlots = [...selectedSlots, value].sort(
                (a, b) => parseInt(a.split(":")[0]) - parseInt(b.split(":")[0])
            );
            setSelectedSlots(newSlots);
        } else {
            toast.warning("Please select adjacent time slots only.");
        }
    };

    const formatSelectedTime = () => {
        if (selectedSlots.length === 0) return <span className="no-selection">No time slots selected</span>;
        const firstHour = parseInt(selectedSlots[0].split(':')[0]);
        const lastHour = parseInt(selectedSlots[selectedSlots.length - 1].split(':')[0]);
        return `${formatTime(firstHour)} - ${formatTime(lastHour + 1)}`;
    };

    const onSubmit = (data) => {
        if (selectedSlots.length === 0) {
            const showToast = () => {
                toast.error("Please select at least one time slot.");
            }
            showToast()
            return;
        }

        const fromTime = selectedSlots[0];
        const toHour = parseInt(selectedSlots[selectedSlots.length - 1].split(':')[0]) + 1;
        const toTime = String(toHour).padStart(2, '0') + ':00';

        const newBooking = {
            ...data,
            from: fromTime,
            to: toTime,
            timeSlots: selectedSlots,
        };

        dispatch(sendUserRequest(newBooking));

        toast.success("Booking request submitted successfully!");

        setIsBookingFormOpen(false);
        reset();
        setSelectedFacility(null);
        setSelectedSlots([]);
    };

    const showDetails = (booking) => {
        const mockDetailBooking = {
            ...booking,
            isCancelled: booking.status.includes('Cancel'),
            paymentStatus: booking.status === 'Approved' ? 'Paid' : 'Pending',
            amount: 500,
            created: '2025-10-18',
        };
        setSelectedBooking(mockDetailBooking);
        setIsDetailsPopupOpen(true);
    };

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
            <ToastContainer position="top-center" />
            <div className="d-flex justify-content-between align-items-center mb-3">
                <h4 className="section-title">Common Space Bookings</h4>
                <div className="d-flex gap-2">
                    <button id="bookFacilityBtn" className="btn btn-success" onClick={() => setIsBookingFormOpen(true)}>
                        <i className="bi bi-plus-lg me-2"></i>Book a Facility
                    </button>
                </div>
            </div>

            <div className="stats-grid mb-4">
                <div className="stat-card" style={{ borderLeftColor: 'green' }}>
                    <p className="card-label">Total Bookings (this month)</p>
                    <h2 className="card-value text-success">{bookings?.length || 0}</h2>
                </div>
                <div className="stat-card" style={{ borderLeftColor: 'var(--warning)' }}>
                    <p className="card-label">Pending Bookings</p>
                    <h2 className="card-value text-warning">{pendingBookingsCount}</h2>
                </div>
                <div className="stat-card" style={{ borderLeftColor: 'blue' }}>
                    <p className="card-label">Total Facilities</p>
                    <h2 className="card-value text-primary">10</h2>
                </div>
            </div>

            <div>
                <h4 className="table-title">Recent Bookings</h4>
                <div className="row bookings-grid">
                    {bookingLoading && <p>Loading bookings...</p>}
                    {!bookingLoading && bookings?.length > 0 ? (
                        bookings.map(b => (
                            <div key={b._id} className={`booking-card ${b.status}`}>
                                <div className="booking-card-header">
                                    <span className="booking-id">#{b._id.slice(-6)}</span>
                                    <span className={`status-badge status-${b.status}`}>{b.status}</span>
                                </div>
                                <div className="booking-details">
                                    <div className="booking-detail"><span className="detail-label">Facility:</span><span className="detail-value">{b.name}</span></div>
                                    <div className="booking-detail"><span className="detail-label">Date:</span><span className="detail-value">{b.Date}</span></div>
                                    <div className="booking-detail"><span className="detail-label">Time:</span><span className="detail-value">{b.from} - {b.to}</span></div>
                                    {b.purpose && <div className="booking-detail"><span className="detail-label">Purpose:</span><span className="detail-value">{b.purpose}</span></div>}
                                </div>
                                <div className="booking-actions">
                                    <button className="action-btn view" onClick={() => showDetails(b)}><i className="bi bi-eye"></i> View Details</button>
                                    {b.status === 'Pending' && <button className="action-btn cancel"><i className="bi bi-x-circle"></i> Cancel</button>}
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

            {isBookingFormOpen && (
                <div className="popup">
                    <div className="popup-content">
                        <div className="popup-header">
                            <h3>Book Common Space</h3>
                            <button type="button" className="close-btn" onClick={() => setIsBookingFormOpen(false)}><i className="bi bi-x"></i></button>
                        </div>
                        <form onSubmit={handleSubmit(onSubmit)}>
                            <div className="A">
                                <div>
                                    <div className="form-group">
                                        <label htmlFor="facility">Select Facility *</label>
                                        <select id="facility" {...register('facility', { required: true })} onChange={handleFacilityChange}>
                                            <option value="">Choose a facility...</option>
                                            {mockAvailableSpaces.map(space => (<option key={space.name} value={space.name}>{space.name}</option>))}
                                        </select>
                                    </div>
                                    {selectedFacility && (<><p id="maxHoursDisplay" style={{ marginTop: '5px', fontWeight: 'bold' }}>Max Booking: {selectedFacility.maxHours} Hour{selectedFacility.maxHours !== 1 ? 's' : ''}</p><div className="form-group"><label>Booking Rules</label><textarea id="bookingRulesField" rows="4" readOnly value={selectedFacility.rules} placeholder="Select a facility to view booking rules..."></textarea></div></>)}
                                    <div className="form-group">
                                        <label htmlFor="bookingDate">Select Date *</label>
                                        <input type="date" id="bookingDate" {...register('date', { required: true })} min={today} />
                                    </div>
                                    <div className="form-group">
                                        <label htmlFor="purpose">Purpose (Optional)</label>
                                        <textarea id="purpose" rows="3" {...register('purpose')} placeholder="Brief description of the purpose..."></textarea>
                                    </div>
                                    <div className="form-actions">
                                        <button type="button" className="btn btn-secondary" onClick={() => setIsBookingFormOpen(false)}>Cancel</button>
                                        <button type="submit" className="btn btn-primary"><i className="bi bi-check-circle"></i> Submit Booking</button>
                                    </div>
                                </div>
                                <div>
                                    <div className="form-group">
                                        <label>Select Time Slots *</label>
                                        <div className="time-slots-container">
                                            <div className="time-slots-header">
                                                <h4 className="time-slots-title"><i className="bi bi-clock"></i> Available Time Slots</h4>
                                                <div className="time-period-info">6:00 AM - 10:00 PM</div>
                                            </div>
                                            <div className="time-slots-grid">
                                                {Array.from({ length: 22 - 6 }, (_, i) => i + 6).map(hour => {
                                                    const timeStr = String(hour).padStart(2, '0') + ':00';
                                                    const displayTime = formatTime(hour);
                                                    const isChecked = selectedSlots.includes(timeStr);
                                                    return (<div key={hour} className={`time-slot ${isChecked ? 'selected' : ''}`} data-time={timeStr}><input type="checkbox" value={timeStr} id={`slot_${hour}`} checked={isChecked} onChange={handleTimeSlotChange} /><label htmlFor={`slot_${hour}`}>{displayTime}</label></div>);
                                                })}
                                            </div>
                                            <div className="selected-time-display">
                                                <strong>Selected Time: </strong>
                                                <span className={selectedSlots.length === 0 ? "no-selection" : ""}>{formatSelectedTime()}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {isDetailsPopupOpen && (
                <div className="popup">
                    <div className="popup-content">
                        <div className="popup-header">
                            <h2>Booking Details</h2>
                            <button className="close-btn" onClick={() => setIsDetailsPopupOpen(false)}>✖</button>
                        </div>
                        <div className="popup-body">
                            <div className="details-grid shadow-sm">
                                <div className="detail-item"><span className="detail-label">Booking ID</span><span className="detail-value">#{mockDetailBooking._id.slice(-6)}</span></div>
                                <div className="detail-item"><span className="detail-label">Status</span><span className={`status-badge status-${mockDetailBooking.status}`}>{mockDetailBooking.status}</span></div>
                                <div className="detail-item"><i className="bi bi-building text-primary"></i><div><span className="detail-label">Facility</span><span className="detail-value">{mockDetailBooking.name}</span></div></div>
                                <div className="detail-item"><i className="bi bi-calendar text-primary"></i><div><span className="detail-label">Date</span><span className="detail-value">{mockDetailBooking.date}</span></div></div>
                                <div className="detail-item"><i className="bi bi-clock text-primary"></i><div><span className="detail-label">Time</span><span className="detail-value">{mockDetailBooking.from} - {mockDetailBooking.to}</span></div></div>
                                <div className="detail-item"><i className="bi bi-person-circle text-primary"></i><div><span className="detail-label">Created</span><span className="detail-value">{mockDetailBooking.created}</span></div></div>
                                <div className="detail-item col-span-2"><i className="bi bi-card-text text-primary"></i><div><span className="detail-label">Purpose</span><span className="detail-value">{mockDetailBooking.purpose}</span></div></div>
                            </div>
                            {isCancelled && (<div className="cancellation-box"><h4>Cancellation Details</h4><div className="detail-item"><span className="detail-label">Reason</span><span className="detail-value">Cancelled by user</span></div><div className="detail-item"><span className="detail-label">Cancelled By</span><span className="detail-value">Resident A</span></div><div className="detail-item"><span className="detail-label">Cancelled At</span><span className="detail-value">2025-10-19</span></div></div>)}
                            {paymentRequired && (<div className="payment-section"><h4>Payment Details</h4><div className="row"><div className="col"><div className="detail-item"><span className="detail-label">Amount</span><span className="detail-value">₹{mockDetailBooking.amount}</span></div></div><div className="col"><div className="detail-item"><span className="detail-label">Payment Status</span><span className="status-badge">{mockDetailBooking.paymentStatus}</span></div></div></div></div>)}
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};