import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useSelector, useDispatch } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import '../../assets/css/Manager/commonSpace.css';
import { optimisticDeleteSpace, AddSpace, DeleteSpace, EditSpace, fetchDataforManager } from '../../Slices/CommonSpaceSlice';
import { ToastContainer, toast } from 'react-toastify';
import { BarChart3, Building2, Calendar, CheckCircle } from 'lucide-react';
import { io } from 'socket.io-client';
import { StatCard, SearchBar, Button, StatusBadge, EmptyState, ConfirmModal, SectionHeader, Modal, Input, Select, Textarea, FormSection } from '../shared';



export const CommonSpace = () => {
  const dispatch = useDispatch();
  const { avalaibleSpaces, Bookings } = useSelector((state) => state.CommonSpace);
  const [isManagementVisible, setIsManagementVisible] = useState(false);
  const [isSpaceFormOpen, setIsSpaceFormOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isRejectionPopupOpen, setIsRejectionPopupOpen] = useState(false);
  const [bookingToReject, setBookingToReject] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [BookingDetailsopen, setBookingDetailsOpen] = useState(false);
  const [currentBooking, setCurrentBooking] = useState({});
  const [toggleRent, setToggleRent] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Occupancy rate stored in component state and recalculated when bookings change
  const [occupancyRate, setOccupancyRate] = useState(0);

  useEffect(() => {
    if (Bookings && Bookings.length > 0) {
      const approvedCount = Bookings.filter((b) => b.status === 'Approved').length;
      const rate = Math.round((approvedCount / Bookings.length) * 100);
      console.log('Approved bookings:', approvedCount);
      console.log('Calculated occupancy rate:', rate);
      setOccupancyRate(rate);
    } else {
      setOccupancyRate(0);
    }
  }, [Bookings]);


  const { register, handleSubmit, reset, setValue, watch } = useForm({
    defaultValues: { spaceType: '', spaceName: '', bookable: 'true', bookingRent: '', bookingRules: '', Type: '' },
  });

  useEffect(() => {
    dispatch(fetchDataforManager());
  }, [dispatch]);

  const Type = watch('Type');
  useEffect(() => {
    if (Type === 'Slot') setToggleRent(false);
    else if (Type === 'Subscription') setToggleRent(true);
  }, [watch('Type')]);

  const handleToggleManagement = () => setIsManagementVisible((prev) => !prev);
  const handleOpenAddForm = () => {
    setIsEditing(false);
    reset();
    setIsSpaceFormOpen(true);
  };

  const handleEditSpace = (space) => {
    setIsEditing(true);
    reset({
      spaceType: space.type,
      spaceName: space.name,
      bookable: String(space.bookable),
      bookingRent: space.rent || '',
      bookingRules: space.bookingRules || '',
      Type: space.Type || '',
      id: space._id
    });
    setIsSpaceFormOpen(true);
  };

  const handleDeleteSpace = (space) => {
    if (window.confirm(`Are you sure you want to delete the space "${space.name}"?`)) {
      dispatch(optimisticDeleteSpace(space._id));
      dispatch(DeleteSpace(space._id))
        .unwrap()
        .then(() => toast.success('Space deleted successfully'));
    }
  };

  const handleApprove = (bookingId) => console.log('Approving booking:', bookingId);
  const openRejectPopup = (bookingId) => {
    setBookingToReject(bookingId);
    setIsRejectionPopupOpen(true);
  };
  const handleRejectionSubmit = () => {
    if (!rejectionReason.trim()) {
      alert('Please provide a reason for rejection.');
      return;
    }
    setIsRejectionPopupOpen(false);
    setRejectionReason('');
    setBookingToReject(null);
  };

  // Filter bookings based on search query
  const filteredBookings = Bookings.filter((booking) => {
    const searchLower = searchQuery.toLowerCase();
    const spaceName = booking.name?.toLowerCase() || '';
    const bookingDate = new Date(booking.Date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }).toLowerCase();
    const bookingStatus = booking.status?.toLowerCase() || '';
    const bookingId = booking.ID?.toLowerCase() || '';

    return (
      spaceName.includes(searchLower) ||
      bookingDate.includes(searchLower) ||
      bookingStatus.includes(searchLower) ||
      bookingId.includes(searchLower)
    );
  });

  const onSubmit = (data) => {
    const payload = { ...data, bookable: data.bookable === 'true' };
    if (isEditing) {
      dispatch(EditSpace({ id: data.id, updatedData: payload }));
      toast.success('Space updated successfully');
    } else dispatch(AddSpace(payload));
    setIsSpaceFormOpen(false);
    reset();
  };

  return (
    <>
      <ToastContainer position="top-center" autoClose={1500} />
      <div className="management-section">
        <div className="management-header">
          <h3 style={{ color: 'rgba(0, 0, 0, 0.669)' }}>Manage Common Spaces</h3>
          <button className="toggle-management" onClick={handleToggleManagement}>
            {isManagementVisible ? 'Hide Management' : 'Show Management'}
          </button>
        </div>

        <AnimatePresence>
          {isManagementVisible && (
            <motion.div id="managementContent" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div className="d-flex justify-content-end">
                <button className="toggle-management" id="addSpaceBtn" onClick={handleOpenAddForm}>
                  <i className="bi bi-plus"></i>Add New Space
                </button>
              </div>

              <Modal
                isOpen={isSpaceFormOpen}
                onClose={() => setIsSpaceFormOpen(false)}
                title={isEditing ? 'Edit Common Space' : 'Add New Common Space'}
                size="md"
                footer={
                  <>
                    <button type="button" onClick={() => setIsSpaceFormOpen(false)} style={{ padding: '9px 18px', borderRadius: 8, border: '1px solid #e5e7eb', background: '#f9fafb', color: '#374151', fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
                    <button type="button" onClick={handleSubmit(onSubmit)} style={{ padding: '9px 20px', borderRadius: 8, border: 'none', background: '#2563eb', color: '#fff', fontWeight: 600, cursor: 'pointer' }}>
                      {isEditing ? 'Update Space' : 'Save Space'}
                    </button>
                  </>
                }
              >
                <input className="d-none" type="hidden" {...register('id')} />
                <FormSection columns={2}>
                  <Select
                    label="Space Type"
                    required
                    id="spaceType"
                    placeholder="Select Type"
                    options={[
                      { label: 'Clubhouse', value: 'Clubhouse' },
                      { label: 'Banquet Hall', value: 'Banquet Hall' },
                      { label: 'Swimming Pool', value: 'Swimming Pool' },
                      { label: 'Guest Room', value: 'Guest Room' },
                      { label: 'Gym', value: 'Gym' },
                      { label: 'Other', value: 'Other' },
                    ]}
                    {...register('spaceType', { required: true })}
                  />
                  <Input label="Space Name" required id="spaceName" {...register('spaceName', { required: true })} />
                </FormSection>
                <Select
                  label="Booking Type"
                  required
                  id="Type"
                  placeholder="Select Type"
                  options={[
                    { label: 'Slots based', value: 'Slot' },
                    { label: 'Subscription based', value: 'Subscription' },
                  ]}
                  {...register('Type', { required: true })}
                />
                <FormSection columns={2}>
                  <Select
                    label="Bookable"
                    required
                    id="bookable"
                    options={[
                      { label: 'Yes', value: 'true' },
                      { label: 'No', value: 'false' },
                    ]}
                    {...register('bookable', { required: true })}
                  />
                  <Input
                    label={toggleRent ? 'Subscription Fee' : 'Rent (per hour)'}
                    id="bookingRent"
                    {...register('bookingRent')}
                  />
                </FormSection>
                <Textarea
                  label="Booking Rules"
                  id="bookingRules"
                  rows={3}
                  {...register('bookingRules')}
                />
              </Modal>


              <motion.div
                className="space-list"
                id="spacesList"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
              >
                {avalaibleSpaces?.length > 0 ? (
                  avalaibleSpaces.map((space) => (
                    <motion.div key={space._id} className="space-item" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                      <div className="space-actions">
                        <button className="edit-space-btn" onClick={() => handleEditSpace(space)}><i className="bi bi-pencil"></i></button>
                        <button className="delete-space-btn" onClick={() => handleDeleteSpace(space)}><i className="bi bi-trash"></i></button>
                      </div>
                      <h4>{space?.name}</h4>
                      <p><strong>Type:</strong> {space?.type}</p>
                      <p><strong>Bookable:</strong> {space?.bookable ? 'Yes' : 'No'}</p>
                      <p><strong>Rent:</strong> {space?.rent}</p>
                      {space.bookingRules && <p><strong>Rules:</strong> {space.bookingRules.substring(0, 50)}...</p>}
                    </motion.div>
                  ))
                ) : (
                  <div className="empty-state">
                    <i className="bi bi-building"></i>
                    <h3>No Common Spaces Configured</h3>
                    <p>Add your first common space to get started.</p>
                  </div>
                )}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="ue-stat-grid" style={{ marginBottom: 20 }}>
        <StatCard label="Total Bookings Today" value={Bookings.length} icon={<Calendar size={22} />} iconColor="#2563eb" iconBg="#dbeafe" />
        <StatCard label="Occupancy Rate" value={`${occupancyRate}%`} icon={<BarChart3 size={22} />} iconColor="#d97706" iconBg="#fef3c7" />
        <StatCard label="Approved" value={Bookings.filter(c => c.status === 'Approved').length} icon={<CheckCircle size={22} />} iconColor="#16a34a" iconBg="#dcfce7" />
        <StatCard label="Total Amenities" value={avalaibleSpaces.length} icon={<Building2 size={22} />} iconColor="#0891b2" iconBg="#e0f2fe" />
      </div>

      <div style={{ display: 'flex', gap: 10, marginBottom: 16, alignItems: 'center' }}>
        <div style={{ flex: 1 }}>
          <SearchBar placeholder="Search by space, date or status..." value={searchQuery} onChange={setSearchQuery} />
        </div>
        <Button variant="secondary" onClick={() => setSearchQuery('')}>Clear</Button>
      </div>


      <motion.div className="bookings-container" id="bookingsContainer" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        {filteredBookings.length > 0 ? (
          filteredBookings.map((c) => (
            <motion.div key={c._id} className="booking-card d-flex flex-column" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <div className="booking-card-header">
                <span className="booking-id">ID: {c.ID}</span>
                <span className={`booking-status status-${c.status}`}>{c.status}</span>
              </div>
              <h3 className="booking-space">{c.name}</h3>
              <div className="booking-datetime">
                <i className="bi bi-calendar-event"></i>
                <span>{new Date(c.Date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}, {c.from} - {c.to}</span>
              </div>
              <div className="booking-actions">
                {c.status === 'Pending' ? (
                  <button className="available-btn" data-id={c._id}><i className="bi bi-eye"></i> Check Availability</button>
                ) : c.status === 'Avalaible' ? (
                  <>
                    <button className="approve-btn" onClick={() => handleApprove(c._id)}><i className="bi bi-check-circle-fill"></i> Approve</button>
                    <button className="reject-btn" onClick={() => openRejectPopup(c._id)}><i className="bi bi-x-circle-fill"></i> Reject</button>
                  </>
                ) : (
                  <button className="view-btn" onClick={() => { setCurrentBooking(c); setBookingDetailsOpen(true); }}>
                    <i className="bi bi-eye"></i> View Details
                  </button>
                )}
              </div>
            </motion.div>
          ))
        ) : (
          <EmptyState
            icon={<Calendar size={48} />}
            title="No Bookings Found"
            sub="There are currently no common space bookings to display."
          />
        )}

      </motion.div>

      <ConfirmModal
        isOpen={isRejectionPopupOpen}
        onClose={() => setIsRejectionPopupOpen(false)}
        onConfirm={handleRejectionSubmit}
        title="Reject Booking"
        variant="danger"
        confirmText="Submit Rejection"
        message={
          <textarea
            rows={4}
            style={{ width: '100%', padding: '10px', border: '1px solid #e5e7eb', borderRadius: 8, marginTop: 8, fontSize: 14 }}
            placeholder="Enter reason for rejection..."
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
          />
        }
      />


      <AnimatePresence>
        {BookingDetailsopen && (
          <motion.div className="popup" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.div className="popup-content" initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.8, opacity: 0 }}>
              <div className="popup-header">
                <h2><i className="bi bi-calendar-check me-2"></i>Booking Details</h2>
                <button className="close-btn" onClick={() => setBookingDetailsOpen(false)}><i className="bi bi-x-lg"></i></button>
              </div>
              <div className="popup-body">
                <div className="details-grid">
                  <div className="detail-item"><div className="detail-label">Booking ID</div><div className="detail-value">{currentBooking?.ID}</div></div>
                  <div className="detail-item"><div className="detail-label">Booking Status</div><div className="detail-value"><span className={`status-badge status-${currentBooking?.status}`}>{currentBooking?.status}</span></div></div>
                  <div className="detail-item"><div className="detail-label">Space Name</div><div className="detail-value">{currentBooking?.name}</div></div>
                  <div className="detail-item"><div className="detail-label">Booked By</div><div className="detail-value">{currentBooking?.bookedBy?.residentFirstname} {currentBooking?.bookedBy?.residentLastname}</div></div>
                  <div className="detail-item"><div className="detail-label">Contact Email</div><div className="detail-value">{currentBooking?.bookedBy?.email}</div></div>
                  <div className="detail-item"><div className="detail-label">Booking Date</div><div className="detail-value">{new Date(currentBooking.Date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</div></div>
                  <div className="detail-item"><div className="detail-label">Time Slot</div><div className="detail-value">{currentBooking?.from} - {currentBooking?.to}</div></div>
                  <div className="detail-item col-span-2"><div className="detail-label">Purpose</div><div className="detail-value">{currentBooking?.description}</div></div>
                </div>

                {currentBooking?.payment && currentBooking.status !== 'Cancelled' && (
                  <div className="payment-box">
                    <h4>Payment Information</h4>
                    <div className="detail-item"><div className="detail-label">Amount</div><div className="detail-value">₹{currentBooking?.payment?.amount || 0}</div></div>
                    <div className="detail-item"><div className="detail-label">Payment Status</div><div className="detail-value"><span className="status-badge status-Completed">{currentBooking?.payment?.status}</span></div></div>
                  </div>
                )}

                {currentBooking?.status === 'Cancelled' && (
                  <div className="cancellation-box">
                    <h4>Cancellation Details</h4>
                    <div className="detail-item"><div className="detail-label">Cancellation Reason:</div><div className="detail-value">{currentBooking?.cancellationReason || 'N/A'}</div></div>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
