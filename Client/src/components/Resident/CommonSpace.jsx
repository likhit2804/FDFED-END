import React, { Suspense, lazy, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import '../../assets/css/Resident/CommonSpace.css';
import 'react-day-picker/dist/style.css';
import { ToastContainer, toast } from 'react-toastify';
import { useDispatch, useSelector } from 'react-redux';
import { Building2, Calendar, Clock } from "lucide-react";
import {
  fetchuserBookings, cancelUserBooking,
  ConfirmBooking, optimisticAddBooking, optimisticCancelBooking,
} from '../../slices/CommonSpaceSlice';
import { Loader } from '../Loader';
import { EmptyState, Modal, Select, StatCard, Textarea } from '../shared';
import { BookingCard } from './CommonSpace/BookingCard';
import { ManagerActionButton, ManagerPageShell, ManagerSection } from '../shared/roleUI';
import {
  buildSlotsFromFacilityConfig,
  findDateEntry,
  formatDisplayDate,
  formatSlotWindow,
  formatTime,
  getAvailabilityControlsForResident as getAvailabilityControls,
  parseTimeToMinutes,
  toIsoDate,
} from "../shared/commonSpace/commonSpaceUtils";

const LazyDayPicker = lazy(() =>
  import("react-day-picker").then((module) => ({ default: module.DayPicker })),
);
const LazyBookingDetailsModal = lazy(() =>
  import("./CommonSpace/BookingDetailsModal").then((module) => ({
    default: module.BookingDetailsModal,
  })),
);

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
  const [dateRestrictionMessage, setDateRestrictionMessage] = useState('');
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [isSubscriptionBased, setIsSubscriptionBased] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [calendarPlacement, setCalendarPlacement] = useState('bottom');
  const [calendarPosition, setCalendarPosition] = useState({ top: 0, left: 0 });
  const dateTriggerRef = useRef(null);

  const { register, handleSubmit, setValue, watch, reset } = useForm({
    defaultValues: { facility: '', date: new Date().toISOString().split('T')[0], purpose: '', Type: '' },
  });
  const selectedDateValue = watch('date');

  const today = new Date().toISOString().split('T')[0];
  const todayDate = new Date();
  todayDate.setHours(0, 0, 0, 0);
  const pendingBookingsCount = bookings?.filter((b) => b?.status === 'Pending' && !b.isOptimistic)?.length || 0;
  const selectedFacilityControls = selectedFacility ? getAvailabilityControls(selectedFacility) : null;
  const maxAdvanceDays = selectedFacilityControls?.bookingPolicy?.maxAdvanceDays || 90;
  const maxBookableDate = new Date(todayDate);
  maxBookableDate.setDate(maxBookableDate.getDate() + maxAdvanceDays);
  const isBlackoutDay = (day) => {
    if (!selectedFacilityControls) return false;
    const dayIso = toIsoDate(day);
    return Boolean(findDateEntry(selectedFacilityControls.blackoutDates, dayIso));
  };

  useEffect(() => { dispatch(fetchuserBookings()); }, [dispatch]);

  useEffect(() => {
    if (!selectedFacility || !selectedDateValue) {
      setAvailableSlots([]);
      setSelectedSlots([]);
      setIsSlotEnabled(false);
      setDateRestrictionMessage('');
      setValue('Type', selectedFacility?.Type || '');
      return;
    }

    const controls = getAvailabilityControls(selectedFacility);
    const blackout = findDateEntry(controls.blackoutDates, selectedDateValue);
    const override = findDateEntry(controls.dateSlotOverrides, selectedDateValue);

    if (blackout) {
      const reason = blackout.reason ? `: ${blackout.reason}` : '.';
      setDateRestrictionMessage(`This facility is closed on selected date${reason}`);
      setAvailableSlots([]);
      setSelectedSlots([]);
      setIsSlotEnabled(false);
      setValue('Type', selectedFacility?.Type || '');
      return;
    }

    if (selectedFacility.Type === 'Slot') {
      if (override?.closedAllDay) {
        const reason = override.reason ? `: ${override.reason}` : '.';
        setDateRestrictionMessage(`Facility is closed all day for selected date${reason}`);
        setAvailableSlots([]);
        setSelectedSlots([]);
        setIsSlotEnabled(false);
        setValue('Type', selectedFacility?.Type || '');
        return;
      }

      const bookedForDate = selectedFacility.bookedSlots?.find(
        (entry) => toIsoDate(new Date(entry.date)) === selectedDateValue,
      );
      const bookedSlots = bookedForDate?.slots || [];
      const blockedSlots = new Set(override?.closedSlots || []);
      const allSlots = buildSlotsFromFacilityConfig(selectedFacility);
      const filteredSlots = allSlots.filter(
        (slot) => !bookedSlots.includes(slot) && !blockedSlots.has(slot),
      );

      setAvailableSlots(filteredSlots);
      setSelectedSlots([]);
      setIsSlotEnabled(filteredSlots.length > 0);
      setDateRestrictionMessage(
        filteredSlots.length ? '' : 'No slots are available for this date.',
      );
    } else {
      setAvailableSlots([]);
      setSelectedSlots([]);
      setIsSlotEnabled(false);
      setDateRestrictionMessage('');
    }

    setValue('Type', selectedFacility?.Type || '');
  }, [selectedFacility, selectedDateValue, setValue]);
  const clearBookingFormState = () => {
    reset({ facility: '', date: today, purpose: '', Type: '' }); setSelectedFacility(null); setSelectedSlots([]);
    setAvailableSlots([]); setIsSlotEnabled(false); setIsBookingFormOpen(false); setIsSubscriptionBased(false);
    setSelectedDate(todayDate);
    setDateRestrictionMessage('');
    setIsCalendarOpen(false);
  };

  const handleFacilityChange = (e) => {
    const selected = avalaibleSpaces?.find((s) => s.name === e.target.value);
    setSelectedFacility(selected);
    if (selected) { setIsSubscriptionBased(selected.Type !== 'Slot'); setIsDateEnabled(true); }
    else { setIsSubscriptionBased(false); setIsDateEnabled(false); }
    setSelectedSlots([]); setAvailableSlots([]); setIsSlotEnabled(false);
    setDateRestrictionMessage('');
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

  const handleDatePick = (pickedDate) => {
    if (!pickedDate) return;
    const normalized = new Date(pickedDate);
    normalized.setHours(0, 0, 0, 0);
    setSelectedDate(normalized);
    setValue('date', toIsoDate(normalized), { shouldValidate: true, shouldDirty: true });
    setIsCalendarOpen(false);
  };

  const updateCalendarPosition = () => {
    if (!dateTriggerRef.current) return;
    const triggerRect = dateTriggerRef.current.getBoundingClientRect();
    const requiredHeight = 360;
    const popoverWidth = 340;
    const spaceBelow = window.innerHeight - triggerRect.bottom;
    const placeTop = spaceBelow < requiredHeight;
    const top = placeTop
      ? Math.max(8, triggerRect.top - requiredHeight - 8)
      : Math.min(window.innerHeight - requiredHeight - 8, triggerRect.bottom + 8);
    const left = Math.max(8, Math.min(triggerRect.left, window.innerWidth - popoverWidth - 8));

    setCalendarPlacement(placeTop ? 'top' : 'bottom');
    setCalendarPosition({ top, left });
  };

  const toggleCalendar = () => {
    if (!isCalendarOpen) {
      updateCalendarPosition();
    }
    setIsCalendarOpen((prev) => !prev);
  };

  useEffect(() => {
    if (!isCalendarOpen) return;

    const handleReposition = () => updateCalendarPosition();
    const handleOutsideClick = (event) => {
      if (!dateTriggerRef.current) return;
      const popover = document.getElementById('cs-booking-day-picker');
      if (
        !dateTriggerRef.current.contains(event.target) &&
        popover &&
        !popover.contains(event.target)
      ) {
        setIsCalendarOpen(false);
      }
    };

    window.addEventListener('resize', handleReposition);
    window.addEventListener('scroll', handleReposition, true);
    document.addEventListener('mousedown', handleOutsideClick);

    return () => {
      window.removeEventListener('resize', handleReposition);
      window.removeEventListener('scroll', handleReposition, true);
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [isCalendarOpen]);

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

  const validateBookingPolicyClientSide = ({ bookingType, fromTime, selectedTimeSlots }) => {
    if (!selectedFacility || !selectedDateValue) return null;

    const controls = getAvailabilityControls(selectedFacility);
    const blackout = findDateEntry(controls.blackoutDates, selectedDateValue);
    if (blackout) {
      return blackout.reason
        ? `This facility is closed on selected date: ${blackout.reason}`
        : 'This facility is closed on selected date.';
    }

    const selectedDateObj = new Date(selectedDateValue);
    if (Number.isNaN(selectedDateObj.getTime())) {
      return 'Invalid booking date.';
    }

    const maxAllowedDate = new Date(todayDate);
    maxAllowedDate.setDate(maxAllowedDate.getDate() + controls.bookingPolicy.maxAdvanceDays);
    if (selectedDateObj > maxAllowedDate) {
      return `Bookings are allowed only for next ${controls.bookingPolicy.maxAdvanceDays} days.`;
    }

    const now = new Date();
    const isSameDay = toIsoDate(now) === selectedDateValue;
    if (isSameDay) {
      const cutoffMinutes = parseTimeToMinutes(controls.bookingPolicy.sameDayCutoffTime);
      const nowMinutes = now.getHours() * 60 + now.getMinutes();
      if (cutoffMinutes !== null && nowMinutes > cutoffMinutes) {
        return `Same-day booking cutoff (${controls.bookingPolicy.sameDayCutoffTime}) has passed.`;
      }
    }

    if (bookingType !== 'Slot') return null;

    const override = findDateEntry(controls.dateSlotOverrides, selectedDateValue);
    if (override?.closedAllDay) {
      return override.reason
        ? `Facility is closed all day: ${override.reason}`
        : 'Facility is closed all day for selected date.';
    }

    const blockedSlots = new Set(override?.closedSlots || []);
    const blockedSelectedSlots = selectedTimeSlots.filter((slot) => blockedSlots.has(slot));
    if (blockedSelectedSlots.length) {
      return `Selected slots are unavailable: ${blockedSelectedSlots.join(', ')}`;
    }

    if (controls.bookingPolicy.minAdvanceHours > 0) {
      const startMinutes = parseTimeToMinutes(fromTime);
      if (startMinutes !== null) {
        const bookingStart = new Date(selectedDateValue);
        bookingStart.setHours(Math.floor(startMinutes / 60), startMinutes % 60, 0, 0);
        const minAllowedTime = new Date(now.getTime() + controls.bookingPolicy.minAdvanceHours * 60 * 60 * 1000);
        if (bookingStart < minAllowedTime) {
          return `This facility requires at least ${controls.bookingPolicy.minAdvanceHours} hour(s) advance booking.`;
        }
      }
    }

    return null;
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

    const policyError = validateBookingPolicyClientSide({
      bookingType: selectedFacility.Type,
      fromTime,
      selectedTimeSlots: timeSlots,
    });
    if (policyError) {
      toast.error(policyError);
      return;
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

  const bookingFooterButtonBase = {
    minWidth: 142,
    minHeight: 42,
    borderRadius: 10,
    fontWeight: 700,
    padding: "10px 16px",
    border: "1px solid transparent",
    cursor: "pointer",
  };

  return (
    <>
      <ToastContainer position="top-center" />
      <ManagerPageShell
        eyebrow="Common Spaces"
        title="Book and track common space usage in one desk."
        description="Use the same booking UI language as manager pages so cards, controls, and actions stay consistent."
        chips={[`${bookings?.length || 0} bookings`, `${pendingBookingsCount} pending`]}
        className="resident-ui-page resident-common-space-page"
      >
        <ManagerSection
          eyebrow="Overview"
          title="Common space bookings"
          description="Create a booking or review your recent activity."
          actions={
            <ManagerActionButton variant="primary" onClick={() => setIsBookingFormOpen(true)}>
              <i className="bi bi-plus-lg me-1" />
              Book a Facility
            </ManagerActionButton>
          }
        >
          <div className="ue-stat-grid">
            <StatCard label="Total Bookings" value={bookings?.length || 0} icon={<Calendar size={22} />} iconColor="var(--brand-500)" iconBg="var(--info-soft)" />
            <StatCard label="Pending Bookings" value={pendingBookingsCount} icon={<Clock size={22} />} iconColor="var(--info-600)" iconBg="var(--surface-2)" />
            <StatCard label="Facilities" value={avalaibleSpaces.length} icon={<Building2 size={22} />} iconColor="var(--text-subtle)" iconBg="var(--surface-2)" />
          </div>
        </ManagerSection>

        <ManagerSection
          eyebrow="Queue"
          title="Recent bookings"
          description="Open details or cancel active slot bookings."
        >
      <div className="ue-entity-grid">
        {bookingLoading && <div className="col-12 d-flex justify-content-center py-5"><Loader /></div>}
        {!bookingLoading && bookings?.filter(Boolean).length > 0
          ? bookings.filter(Boolean).map((b) => <BookingCard key={b._id} booking={b} onViewDetails={showDetails} onCancel={cancelBooking} />)
          : !bookingLoading && (
            <EmptyState icon={<Calendar size={42} />} title="No bookings found" sub="Create a new booking to get started." />
          )}
      </div>
        </ManagerSection>
      </ManagerPageShell>

      {/* Booking Form Modal */}
      <Modal
        isOpen={isBookingFormOpen}
        onClose={() => !formSubmitting && setIsBookingFormOpen(false)}
        title="Book Common Space"
        size="lg"
        footer={
          <>
            <button
              type="button"
              onClick={() => setIsBookingFormOpen(false)}
              style={{
                ...bookingFooterButtonBase,
                background: "#ffffff",
                borderColor: "#cbd5e1",
                color: "#1f2937",
              }}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit(onSubmit)}
              disabled={formSubmitting || Boolean(dateRestrictionMessage)}
              style={{
                ...bookingFooterButtonBase,
                background: formSubmitting || Boolean(dateRestrictionMessage) ? "#9ca3af" : "#2563eb",
                color: "#ffffff",
              }}
            >
              {formSubmitting ? 'Submitting...' : 'Submit Booking'}
            </button>
          </>
        }
      >
        {formSubmitting && (
          <div style={{ textAlign: 'center', padding: 20 }}>
            <Loader label="Submitting booking..." size={34} />
          </div>
        )}
        <div className="booking-form-grid A">
          <div className="form-column w-50">
            <input className="d-none" {...register('Type', { required: true })} readOnly />
            <input className="d-none" {...register('date', { required: true })} readOnly />
            <Select label="Select Facility *" id="facility" {...register('facility', { required: true })} onChange={handleFacilityChange}>
              <option value="">Choose a facility...</option>
              {avalaibleSpaces?.map((s) => <option key={s.name} value={s.name}>{s.name}</option>)}
            </Select>
            {selectedFacility && <Textarea label="Booking Rules" rows={4} readOnly value={selectedFacility.bookingRules} placeholder="Select a facility to view booking rules..." />}
            <div className="form-group form-group--date">
              <label htmlFor="bookingDatePicker">Select Date *</label>
              <button
                id="bookingDatePicker"
                ref={dateTriggerRef}
                type="button"
                className="cs-date-trigger"
                disabled={!isDateEnabled}
                onClick={toggleCalendar}
                aria-expanded={isCalendarOpen}
                aria-controls="cs-booking-day-picker"
              >
                <span>{formatDisplayDate(selectedDate)}</span>
                <i className="bi bi-calendar3" aria-hidden="true" />
              </button>
              {dateRestrictionMessage ? (
                <p className="manager-ui-note" style={{ marginTop: 6, color: "#b91c1c" }}>
                  {dateRestrictionMessage}
                </p>
              ) : null}
              {isCalendarOpen
                ? createPortal(
                    <Suspense fallback={<Loader label="Loading calendar..." size={24} />}>
                      <div
                        className={`cs-date-popover ${calendarPlacement === 'top' ? 'cs-date-popover--top' : ''}`}
                        id="cs-booking-day-picker"
                        style={{ top: `${calendarPosition.top}px`, left: `${calendarPosition.left}px` }}
                      >
                        <LazyDayPicker
                          className="ue-calendar ue-calendar--popover"
                          mode="single"
                          selected={selectedDate}
                          onSelect={handleDatePick}
                          disabled={[
                            { before: todayDate },
                            { after: maxBookableDate },
                            isBlackoutDay,
                          ]}
                          showOutsideDays
                          captionLayout="dropdown"
                          startMonth={todayDate}
                          endMonth={maxBookableDate}
                        />
                      </div>
                    </Suspense>,
                    document.body
                  )
                : null}
            </div>
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
                    <div className="time-slots-header"><h4 className="time-slots-title"><i className="bi bi-clock" /> Available Time Slots</h4><div className="time-period-info">{formatSlotWindow(selectedFacility)}</div></div>
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
      {isDetailsPopupOpen ? (
        <Suspense fallback={<Loader label="Loading booking details..." size={24} />}>
          <LazyBookingDetailsModal
            booking={selectedBooking}
            isOpen={isDetailsPopupOpen}
            onClose={() => setIsDetailsPopupOpen(false)}
            onPayment={() => {
              setIsDetailsPopupOpen(false);
              toast.info('Complete this booking payment from the Payments tab.');
              navigate('/resident/payments');
            }}
          />
        </Suspense>
      ) : null}
    </>
  );
};


