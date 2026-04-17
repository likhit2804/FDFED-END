import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import '../../assets/css/Resident/CommonSpace.css';
import { ToastContainer, toast } from 'react-toastify';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchuserBookings, cancelUserBooking,
  ConfirmBooking, optimisticAddBooking, optimisticCancelBooking,
} from '../../slices/CommonSpaceSlice';
import { Loader } from '../Loader';
import { Modal, Input, Select, Textarea } from '../shared';
import { BookingCard } from './CommonSpace/BookingCard';
import { BookingDetailsModal } from './CommonSpace/BookingDetailsModal';

const formatTime = (hour) => {
  if (hour === 0) return '12:00 AM';
  if (hour < 12) return `${hour}:00 AM`;
  if (hour === 12) return '12:00 PM';
  return `${hour - 12}:00 PM`;
};

export const CommonSpaceBooking = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { Bookings: bookings, loading: bookingLoading, avalaibleSpaces } = useSelector((s) => s.CommonSpace);
  const [isBookingFormOpen, setIsBookingFormOpen] = useState(false);
  const [isDetailsPopupOpen, setIsDetailsPopupOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [selectedFacility, setSelectedFacility] = useState(null);
  const [selectedSlots, setSelectedSlots] = useState([]);
  const [isDateEnabled, setIsDateEnabled] = useState(true);
  const [isSlotEnabled, setIsSlotEnabled] = useState(false);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [isSubscriptionBased, setIsSubscriptionBased] = useState(false);

  const { register, handleSubmit, setValue, watch, reset } = useForm({
    defaultValues: { facility: '', date: new Date().toISOString().split('T')[0], purpose: '', Type: '' },
  });

  const today = new Date().toISOString().split('T')[0];
  const pendingBookingsCount = bookings?.filter((b) => b?.status === 'Pending' && !b.isOptimistic)?.length || 0;

  useEffect(() => { dispatch(fetchuserBookings()); }, [dispatch]);

  useEffect(() => {
    const date = watch('date');
    if (selectedFacility && date && selectedFacility.Type === 'Slot') {
      const bookedForDate = selectedFacility.bookedSlots?.find((b) => new Date(b.date).toISOString().split('T')[0] === date);
      const bookedSlots = bookedForDate?.slots || [];
      const allSlots = Array.from({ length: 22 - 6 }, (_, i) => String(i + 6).padStart(2, '0') + ':00');
      setAvailableSlots(allSlots.filter((slot) => !bookedSlots.includes(slot)));
      setSelectedSlots([]);
      setIsSlotEnabled(true);
    } else {
      setAvailableSlots([]); setSelectedSlots([]); setIsSlotEnabled(false);
    }
    setValue('Type', selectedFacility?.Type);
  }, [selectedFacility, watch('date')]);
  const clearBookingFormState = () => {
    reset(); setSelectedFacility(null); setSelectedSlots([]);
    setAvailableSlots([]); setIsSlotEnabled(false); setIsBookingFormOpen(false); setIsSubscriptionBased(false);
  };

  const handleFacilityChange = (e) => {
    const selected = avalaibleSpaces?.find((s) => s.name === e.target.value);
    setSelectedFacility(selected);
    if (selected) { setIsSubscriptionBased(selected.Type !== 'Slot'); setIsDateEnabled(true); }
    else { setIsSubscriptionBased(false); setIsDateEnabled(false); }
    setSelectedSlots([]); setAvailableSlots([]); setIsSlotEnabled(false);
  };

  const handleTimeSlotChange = (e) => {
    const value = e.target.value;
    const hour = parseInt(value.split(':')[0]);
    if (selectedSlots.includes(value)) { setSelectedSlots(selectedSlots.filter((s) => s !== value)); return; }
    if (selectedSlots.length === 0) { setSelectedSlots([value]); return; }
    const selectedHours = selectedSlots.map((s) => parseInt(s.split(':')[0]));
    if (hour === Math.min(...selectedHours) - 1 || hour === Math.max(...selectedHours) + 1) {
      setSelectedSlots([...selectedSlots, value].sort((a, b) => parseInt(a) - parseInt(b)));
    } else { toast.warning('Please select adjacent time slots only.'); }
  };

  const formatSelectedTime = () => {
    if (selectedSlots.length === 0) return <span className="no-selection">No time slots selected</span>;
    const first = parseInt(selectedSlots[0].split(':')[0]);
    const last = parseInt(selectedSlots[selectedSlots.length - 1].split(':')[0]);
    return `${formatTime(first)} - ${formatTime(last + 1)}`;
  };

  const submitBookingWithoutPayment = async (bookingPayload, amount) => {
    const requestId = new Date().getTime();
    setFormSubmitting(true);
    dispatch(optimisticAddBooking({ bookingData: bookingPayload, requestId }));

    try {
      await dispatch(ConfirmBooking({
        data: {
          bill: bookingPayload.Type === 'Slot' ? 'Common Space Booking' : 'Common Space Subscription',
          amount,
          paymentMethod: 'None',
        },
        newBooking: bookingPayload,
        requestId,
      })).unwrap();

      toast.success('Booking submitted successfully!');
      clearBookingFormState();
    } catch (error) {
      const message =
        error?.error?.message ||
        error?.message ||
        error?.error ||
        'Failed to submit booking.';
      toast.error(message);
    } finally {
      setFormSubmitting(false);
    }
  };

  const createBookingWithPendingPayment = async (bookingPayload, paymentMeta) => {
    const requestId = new Date().getTime();
    dispatch(optimisticAddBooking({ bookingData: bookingPayload, requestId }));

    return dispatch(ConfirmBooking({
      data: {
        bill: paymentMeta?.belongTo || 'Common Space Booking',
        amount: paymentMeta?.amount || 0,
        paymentMethod: 'None',
      },
      newBooking: bookingPayload,
      requestId,
    })).unwrap();
  };

  const createBookingAndRedirectToPayments = async ({ bookingPayload, paymentMeta }) => {
    try {
      setFormSubmitting(true);
      await createBookingWithPendingPayment(bookingPayload, paymentMeta);
      await dispatch(fetchuserBookings());
      toast.info('Booking created. Complete the payment from the Payments tab.');
      clearBookingFormState();
      navigate('/resident/payments');
    } catch (error) {
      toast.error(error?.message || 'Failed to create booking.');
    } finally {
      setFormSubmitting(false);
    }
  };

  const onSubmit = async (data) => {
    if (selectedFacility.Type === 'Slot' && selectedSlots.length === 0) { toast.error('Please select at least one time slot.'); return; }
    let fromTime = 'N/A', toTime = 'N/A', amount = selectedFacility.rent, timeSlots = [];
    if (selectedFacility.Type === 'Slot') {
      fromTime = selectedSlots[0];
      toTime = String(parseInt(selectedSlots[selectedSlots.length - 1].split(':')[0]) + 1).padStart(2, '0') + ':00';
      timeSlots = selectedSlots;
      amount = selectedSlots.length * selectedFacility.rent;
    }
    const newBookingData = { ...data, fid: selectedFacility._id, name: selectedFacility.name, Type: selectedFacility.Type, from: fromTime, to: toTime, timeSlots, Date: data.date };
    if ((Number(amount) || 0) <= 0) {
      submitBookingWithoutPayment(newBookingData, Number(amount) || 0);
      return;
    }
    await createBookingAndRedirectToPayments({
      bookingPayload: newBookingData,
      paymentMeta: {
        belongTo: selectedFacility.Type === 'Slot' ? 'Common Space Booking' : 'Common Space Subscription',
        amount,
      },
    });
  };

  const cancelBooking = (data) => {
    if (window.confirm("Do you want to cancel booking")) {
      dispatch(optimisticCancelBooking({ bookingId: data._id, originalStatus: data.status }));
      dispatch(cancelUserBooking({ bookingId: data._id, originalStatus: data.status }))
        .unwrap().then(() => toast.success('Booking cancelled successfully!'))
        .catch((error) => toast.error(error.error.error || 'Failed to cancel booking.'));
    }
  };

  const showDetails = (booking) => {
    setSelectedBooking({
      ...booking,
      isCancelled: booking.status.includes('Cancel'),
      paymentStatus: booking.status === 'Approved' || booking.payment?.status === 'Completed' ? 'Paid' : booking.payment?.status || 'Pending',
      amount: booking.payment?.amount || 0,
      created: new Date(booking.createdAt || Date.now()).toLocaleDateString('en-IN'),
    });
    setIsDetailsPopupOpen(true);
  };

  return (
    <>
      <ToastContainer position="top-center" />
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h4 className="section-title">Common Space Bookings</h4>
        <button id="bookFacilityBtn" className="btn btn-success" onClick={() => setIsBookingFormOpen(true)}>
          <i className="bi bi-plus-lg me-2" />Book a Facility
        </button>
      </div>

      <div className="stats-grid mb-4">
        <div className="stat-card" style={{ borderLeftColor: 'green' }}><p className="card-label">Total Bookings (this month)</p><h2 className="card-value text-success">{bookings?.length || 0}</h2></div>
        <div className="stat-card" style={{ borderLeftColor: 'var(--warning)' }}><p className="card-label">Pending Bookings</p><h2 className="card-value text-warning">{pendingBookingsCount}</h2></div>
        <div className="stat-card" style={{ borderLeftColor: 'blue' }}><p className="card-label">Total Facilities</p><h2 className="card-value text-primary">{avalaibleSpaces.length}</h2></div>
      </div>

      <h4 className="table-title">Recent Bookings</h4>
      <div className="row bookings-grid">
        {bookingLoading && <div className="col-12 d-flex justify-content-center py-5"><Loader /></div>}
        {!bookingLoading && bookings?.filter(Boolean).length > 0
          ? bookings.filter(Boolean).map((b) => <BookingCard key={b._id} booking={b} onViewDetails={showDetails} onCancel={cancelBooking} />)
          : !bookingLoading && (
            <div className="col-12 shadow-sm rounded-2 no-bookings d-flex gap-3 justify-content-center align-items-center text-muted">
              <i className="bi bi-calendar fs-3" /><h4 className="m-0">No bookings found</h4>
            </div>
          )}
      </div>

      {/* Booking Form Modal */}
      <Modal isOpen={isBookingFormOpen} onClose={() => !formSubmitting && setIsBookingFormOpen(false)} title="Book Common Space" size="lg"
        footer={<>
          <button type="button" onClick={() => setIsBookingFormOpen(false)} style={{ padding: '9px 18px', borderRadius: 8, border: '1px solid #e5e7eb', background: '#f9fafb', color: '#374151', fontWeight: 600 }}>Cancel</button>
          <button type="button" onClick={handleSubmit(onSubmit)} disabled={formSubmitting} style={{ padding: '9px 20px', borderRadius: 8, border: 'none', background: '#16a34a', color: '#fff', fontWeight: 600 }}>{formSubmitting ? 'Submitting...' : 'Submit Booking'}</button>
        </>}
      >
        {formSubmitting && <div style={{ textAlign: 'center', padding: 20 }}><div className="spinner-border text-primary" role="status" /></div>}
        <div className="booking-form-grid A">
          <div className="form-column w-50">
            <input className="d-none" {...register('Type', { required: true })} readOnly />
            <Select label="Select Facility *" id="facility" {...register('facility', { required: true })} onChange={handleFacilityChange}>
              <option value="">Choose a facility...</option>
              {avalaibleSpaces?.map((s) => <option key={s.name} value={s.name}>{s.name}</option>)}
            </Select>
            {selectedFacility && <Textarea label="Booking Rules" rows={4} readOnly value={selectedFacility.bookingRules} placeholder="Select a facility to view booking rules..." />}
            <Input type="date" label="Select Date *" id="bookingDate" {...register('date', { required: true })} min={today} disabled={!isDateEnabled} />
            <Textarea label="Purpose (Optional)" id="purpose" rows={3} {...register('purpose')} placeholder="Brief description of the purpose..." />
          </div>
          <div className="slot-subscription-column w-50">
            {isSubscriptionBased ? (
              <div className="form-group">
                <div className="subscription-content mb-3"><p><b>Note: </b>Time slots are not required for subscription access. Proceed to submit the booking to initiate payment for the subscription fee.</p></div>
                <div className="subscription-content-alert">
                  <p><b>Subscription Type:</b> This is a <span className="highlight">monthly subscription</span>. You'll be able to access and use this amenity throughout month from the selected date without daily booking.</p>
                  <p><b>Note:</b> Please check the selected date carefully before submitting. Once submitted, the subscription cannot be canceled or modified.</p>
                </div>
              </div>
            ) : (
              <>
                <div className="form-group">
                  <label>Select Time Slots *</label>
                  <div className="time-slots-container">
                    <div className="time-slots-header"><h4 className="time-slots-title"><i className="bi bi-clock" /> Available Time Slots</h4><div className="time-period-info">6:00 AM - 10:00 PM</div></div>
                    <div className="time-slots-grid">
                      {availableSlots.map((hour) => {
                        const isChecked = selectedSlots.includes(hour);
                        return (
                          <div key={hour} className={`time-slot ${isChecked ? 'selected' : ''}`}>
                            <input type="checkbox" value={hour} id={`slot-${hour}`} checked={isChecked} onChange={handleTimeSlotChange} disabled={!isSlotEnabled} />
                            <label htmlFor={`slot-${hour}`}>{formatTime(parseInt(hour.split(':')[0]))}</label>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
                <div className="selected-time-preview"><strong>Selected Time:</strong> {formatSelectedTime()}</div>
              </>
            )}
          </div>
        </div>
      </Modal>

      {/* Details Modal */}
      <BookingDetailsModal
        booking={selectedBooking}
        isOpen={isDetailsPopupOpen}
        onClose={() => setIsDetailsPopupOpen(false)}
        onPayment={() => {
          setIsDetailsPopupOpen(false);
          toast.info('Complete this booking payment from the Payments tab.');
          navigate('/resident/payments');
        }}
      />
    </>
  );
};
