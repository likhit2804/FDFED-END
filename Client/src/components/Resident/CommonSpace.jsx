import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import '../../assets/css/Resident/CommonSpace.css';
import { ToastContainer, toast } from 'react-toastify';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchuserBookings,
  sendUserRequest,
  cancelUserBooking,
  optimisticAddBooking,
  optimisticCancelBooking,
  removeOptimisticBooking,
} from '../../Slices/CommonSpaceSlice';
import { Loader } from '../Loader';
import PaymentPopUp from './PaymentPopUp';

const formatTime = (hour) => {
  if (hour === 0) return '12:00 AM';
  if (hour < 12) return `${hour}:00 AM`;
  if (hour === 12) return '12:00 PM';
  return `${hour - 12}:00 PM`;
};

const PaymentTimer = ({ bookingId, onTimeout, booking }) => {
  const [remaining, setRemaining] = useState(0);

  useEffect(() => {
    const key = `booking_timer_${bookingId}`;
    let endTime = localStorage.getItem(key);
    if (!endTime) {
      endTime = Date.now() + 10 * 60 * 1000;
      localStorage.setItem(key, endTime);
    }
    const intervalId = setInterval(() => {
      const newRemaining = endTime - Date.now();
      if (newRemaining <= 1000) {
        clearInterval(intervalId);
        localStorage.removeItem(key);
        onTimeout(bookingId);
        setRemaining(0);
      } else {
        setRemaining(newRemaining);
      }
    }, 1000);
    return () => clearInterval(intervalId);
  }, [bookingId, onTimeout]);

  const minutes = Math.floor((remaining / 1000 / 60) % 60);
  const seconds = Math.floor((remaining / 1000) % 60);
  if (booking?.payment?.paymentStatus === 'Paid') {
    localStorage.removeItem(`booking_timer_${bookingId}`);
    return null;
  }
  if (remaining <= 0) return null;
  return (
    <div className="timer-box">
      Make your payment in {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
    </div>
  );
};

export const CommonSpaceBooking = () => {
  const dispatch = useDispatch();
  const { Bookings: bookings, loading: bookingLoading, avalaibleSpaces } = useSelector((state) => state.CommonSpace);
  const [isBookingFormOpen, setIsBookingFormOpen] = useState(false);
  const [isDetailsPopupOpen, setIsDetailsPopupOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [selectedFacility, setSelectedFacility] = useState(null);
  const [selectedSlots, setSelectedSlots] = useState([]);
  const [isDateEnabled, setIsDateEnabled] = useState(false);
  const [isSlotEnabled, setIsSlotEnabled] = useState(false);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [onClose, setonClose] = useState(false);
  const [paymentDetails, setpaymentDetails] = useState({});
  const [formSubmitting, setFormSubmitting] = useState(false);

  const { register, handleSubmit, watch, reset } = useForm({
    defaultValues: {
      facility: '',
      date: new Date().toISOString().split('T')[0],
      purpose: '',
    },
  });

  const today = new Date().toISOString().split('T')[0];
  const pendingBookingsCount = bookings?.filter((b) => b?.status === 'Pending' && !b.isOptimistic)?.length || 0;

  useEffect(() => {
    dispatch(fetchuserBookings());
  }, [dispatch]);

  useEffect(() => {
    bookings.forEach((b) => {
      if (['Pending', 'Pending Payment'].includes(b?.status) && b.payment?.amount > 0 && b._id) {
        const timerKey = `booking_timer_${b._id}`;
        if (!localStorage.getItem(timerKey)) {
          localStorage.setItem(timerKey, Date.now() + 10 * 60 * 1000);
        }
      }
    });
  }, [bookings]);

  useEffect(() => {
    const date = watch('date');
    if (selectedFacility && date) {
      const bookedForDate = selectedFacility.bookedSlots?.find((b) => new Date(b.date).toISOString().split('T')[0] === date);
      const bookedSlots = bookedForDate?.slots || [];
      const allSlots = Array.from({ length: 22 - 6 }, (_, i) => String(i + 6).padStart(2, '0') + ':00');
      const freeSlots = allSlots.filter((slot) => !bookedSlots.includes(slot));
      setAvailableSlots(freeSlots);
      setSelectedSlots([]);
      setIsSlotEnabled(true);
    } else {
      setAvailableSlots([]);
      setSelectedSlots([]);
      setIsSlotEnabled(false);
    }
  }, [selectedFacility, watch('date')]);

  useEffect(() => {
    const latestBookingWithPayment = bookings
      ?.filter((b) => !b.isOptimistic && b.payment)
      ?.sort((a, b) => new Date(b.createdAt || '1970/01/01') - new Date(a.createdAt || '1970/01/01'))?.[0];
    if (latestBookingWithPayment && latestBookingWithPayment.payment.amount > 0 && latestBookingWithPayment.payment.paymentStatus !== 'Paid') {
      setpaymentDetails(latestBookingWithPayment.payment);
    } else {
      setpaymentDetails({});
    }
  }, [bookings]);

  useEffect(() => {
    if (formSubmitting && !bookingLoading) {
      setFormSubmitting(false);
      setIsBookingFormOpen(false);
      setonClose(true);
      reset();
      setSelectedFacility(null);
      setSelectedSlots([]);
      setAvailableSlots([]);
      setIsDateEnabled(false);
      setIsSlotEnabled(false);
    }
  }, [bookingLoading]);

  const handleFacilityChange = (e) => {
    const facilityName = e.target.value;
    const selected = avalaibleSpaces?.find((s) => s.name === facilityName);
    setSelectedFacility(selected);
    setIsDateEnabled(!!facilityName);
    setSelectedSlots([]);
    setAvailableSlots([]);
    setIsSlotEnabled(false);
  };

  const handleTimeSlotChange = (e) => {
    const value = e.target.value;
    const hour = parseInt(value.split(':')[0]);
    if (selectedSlots.includes(value)) {
      setSelectedSlots(selectedSlots.filter((slot) => slot !== value));
      return;
    }
    if (selectedSlots.length === 0) {
      setSelectedSlots([value]);
      return;
    }
    const selectedHours = selectedSlots.map((slot) => parseInt(slot.split(':')[0]));
    const min = Math.min(...selectedHours);
    const max = Math.max(...selectedHours);
    if (hour === min - 1 || hour === max + 1) {
      const newSlots = [...selectedSlots, value].sort((a, b) => parseInt(a.split(':')[0]) - parseInt(b.split(':')[0]));
      setSelectedSlots(newSlots);
    } else {
      toast.warning('Please select adjacent time slots only.');
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
      toast.error('Please select at least one time slot.');
      return;
    }
    const fromTime = selectedSlots[0];
    const toHour = parseInt(selectedSlots[selectedSlots.length - 1].split(':')[0]) + 1;
    const toTime = String(toHour).padStart(2, '0') + ':00';
    const newBooking = {
      ...data,
      fid: selectedFacility._id,
      from: fromTime,
      to: toTime,
      timeSlots: selectedSlots,
      Date: data.date,
    };
    const requestId = 'optimistic-' + Date.now();
    setFormSubmitting(true);
    dispatch(optimisticAddBooking({ bookingData: newBooking, requestId }));
    dispatch(sendUserRequest({ bookingData: newBooking, requestId }))
      .unwrap()
      .then(() => {
        toast.success('Booking request submitted successfully!');
      })
      .catch((error) => {
        dispatch(removeOptimisticBooking({ requestId }));
        toast.error(error.message || 'Booking failed.');
      });
  };

  const cancelBooking = (data) => {
    const originalStatus = data.status;
    dispatch(optimisticCancelBooking({ bookingId: data._id, originalStatus }));
    dispatch(cancelUserBooking({ bookingId: data._id, originalStatus }))
      .unwrap()
      .then(() => {
        toast.success('Booking cancelled successfully!');
      })
      .catch((error) => {
        toast.error(error.error?.message || 'Failed to cancel booking.');
      });
  };

  const showDetails = (booking) => {
    const mockDetailBooking = {
      ...booking,
      isCancelled: booking.status.includes('Cancel'),
      paymentStatus:
        booking.status === 'Approved' || booking.payment?.paymentStatus === 'Paid'
          ? 'Paid'
          : booking.payment?.paymentStatus || 'Pending',
      amount: booking.payment?.amount || 500,
      created: new Date(booking.createdAt || Date.now()).toLocaleDateString('en-IN'),
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
    paymentStatus: 'Completed',
    amount: 500,
  };

  const isCancelled = mockDetailBooking.isCancelled || false;
  const paymentRequired = mockDetailBooking.paymentStatus !== 'Completed';

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
          {bookingLoading && (
            <div className="col-12 d-flex justify-content-center py-5">
              <Loader />
            </div>
          )}
          {!bookingLoading && bookings?.filter(Boolean).length > 0 ? (
            bookings
              ?.filter(Boolean)
              .map((b) => (
                <div key={b?._id} className={`booking-card ${b?.status || ''}`}>
                  <div className="booking-card-header">
                    <span className="booking-id">#{b?._id?.slice(-6)}</span>
                    <span className={`status-badge status-${b?.status || ''}`}>{b?.status || 'Unknown'}</span>
                  </div>
                  <div className="booking-details">
                    {['Pending', 'Pending Payment'].includes(b?.status) && b.payment?.amount > 0 && b._id && (
                      <PaymentTimer bookingId={b._id} booking={b} onTimeout={(id) => cancelBooking(b)} />
                    )}
                    <div className="booking-detail">
                      <span className="detail-label">Facility:</span>
                      <span className="detail-value">{b?.name || '-'}</span>
                    </div>
                    <div className="booking-detail">
                      <span className="detail-label">Date:</span>
                      <span className="detail-value">
                        {b?.Date ? new Date(b.Date).toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '-'}
                      </span>
                    </div>
                    <div className="booking-detail">
                      <span className="detail-label">Time:</span>
                      <span className="detail-value">
                        {b?.from || '-'} - {b?.to || '-'}
                      </span>
                    </div>
                    {b?.purpose && (
                      <div className="booking-detail">
                        <span className="detail-label">Purpose:</span>
                        <span className="detail-value">{b.purpose}</span>
                      </div>
                    )}
                    
                  </div>
                  <div className="booking-actions">
                    <button className="action-btn view" onClick={() => showDetails(b)}>
                      <i className="bi bi-eye"></i> View Details
                    </button>
                    {b?.status !== 'Cancelled' && (
                      <button className="action-btn cancel" onClick={() => cancelBooking(b)}>
                        <i className="bi bi-x-circle"></i>Cancel
                      </button>
                    )}
                  </div>
                </div>
              ))
          ) : (
            !bookingLoading && (
              <div className="col-12 shadow-sm rounded-2 no-bookings d-flex gap-3 justify-content-center align-items-center text-muted">
                <i className="bi bi-calendar fs-3"></i>
                <h4 className="m-0">No bookings found</h4>
              </div>
            )
          )}
        </div>
      </div>

      {isBookingFormOpen && (
        <div className="popup">
          <div className="popup-content position-relative">
            {formSubmitting && (
              <div className="popup-loader-overlay">
                <div className="spinner-border text-primary" role="status">
                  <span className="visually-hidden">Submitting...</span>
                </div>
              </div>
            )}
            <div className="popup-header">
              <h3>Book Common Space</h3>
              <button type="button" className="close-btn" onClick={() => !formSubmitting && setIsBookingFormOpen(false)}>
                <i className="bi bi-x"></i>
              </button>
            </div>
            <form onSubmit={handleSubmit(onSubmit)}>
              <div className="A">
                <div>
                  <div className="form-group">
                    <label htmlFor="facility">Select Facility *</label>
                    <select id="facility" {...register('facility', { required: true })} onChange={handleFacilityChange}>
                      <option value="">Choose a facility...</option>
                      {avalaibleSpaces?.map((space) => (
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
                        <textarea id="bookingRulesField" rows="4" readOnly value={selectedFacility.rules} placeholder="Select a facility to view booking rules..."></textarea>
                      </div>
                    </>
                  )}
                  <div className="form-group">
                    <label htmlFor="bookingDate">Select Date *</label>
                    <input type="date" id="bookingDate" {...register('date', { required: true })} placeholder="dd-mm-yyyy" min={today} disabled={!isDateEnabled} />
                  </div>
                  <div className="form-group">
                    <label>Purpose (Optional)</label>
                    <textarea id="purpose" rows="3" {...register('purpose')} placeholder="Brief description of the purpose..."></textarea>
                  </div>
                  <div className="form-actions">
                    <button type="button" className="btn btn-secondary" onClick={() => setIsBookingFormOpen(false)}>
                      Cancel
                    </button>
                    <button type="submit" className="btn btn-primary" disabled={formSubmitting}>
                      <i className="bi bi-check-circle"></i> Submit Booking
                    </button>
                  </div>
                </div>
                <div>
                  <div className="form-group">
                    <label>Select Time Slots *</label>
                    <div className="time-slots-container">
                      <div className="time-slots-header">
                        <h4 className="time-slots-title">
                          <i className="bi bi-clock"></i> Available Time Slots
                        </h4>
                        <div className="time-period-info">6:00 AM - 10:00 PM</div>
                      </div>
                      <div className="time-slots-grid">
                        {availableSlots.map((hour) => {
                          const displayTime = formatTime(parseInt(hour.split(':')[0]));
                          const isChecked = selectedSlots.includes(hour);
                          return (
                            <div key={hour} className={`time-slot ${isChecked ? 'selected' : ''}`}>
                              <input type="checkbox" value={hour} id={`slot-${hour}`} checked={isChecked} onChange={handleTimeSlotChange} disabled={!isSlotEnabled} />
                              <label htmlFor={`slot-${hour}`}>{displayTime}</label>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                  <div className="selected-time-preview">
                    <strong>Selected Time:</strong> {formatSelectedTime()}
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
              {isCancelled && (<div className="cancellation-box"><h4>Cancellation Details</h4><div className="detail-item"><span className="detail-label">Reason</span><span className="detail-value">Cancelled by user</span></div><div className="detail-item"><span className="detail-label">Cancelled By</span><span className="detail-value">Resident A</span></div><div className="detail-item"><span className="detail-label">Cancelled On</span><span className="detail-value">2025-10-18</span></div></div>)}
              {!isCancelled && paymentRequired && (
                <div className="payment-section">
                  <h4>Payment Information</h4>
                  <div className="payment-grid">
                    <div className="detail-item"><span className="detail-label">Amount</span><span className="detail-value text-success">₹{mockDetailBooking.amount}</span></div>
                    <div className="detail-item"><span className="detail-label">Payment Status</span><span className={`detail-value ${mockDetailBooking?.payment?.status === 'Completed' ? 'text-success' : 'text-danger'}`}>{mockDetailBooking.payment?.status}</span></div>
                  </div>
                </div>
              )}
            </div>
            <div className="popup-footer">
              {!isCancelled && paymentRequired && mockDetailBooking?.payment?.status !== 'Completed' && (
                <button className="btn btn-success" onClick={() => { setIsDetailsPopupOpen(false); setonClose(true); }}>Proceed to Payment</button>
              )}
            </div>
          </div>
        </div>
      )}

      {onClose && Object.keys(paymentDetails).length > 0 && (
        <PaymentPopUp paymentDetails={paymentDetails} setonClose={setonClose} />
      )}
    </>
  );
};
