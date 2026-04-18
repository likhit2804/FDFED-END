import React, { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { useDispatch, useSelector } from "react-redux";
import { ToastContainer, toast } from "react-toastify";
import { BarChart3, Building2, Calendar, CheckCircle, Eye, Plus, Trash2 } from "lucide-react";

import {
  AddSpace,
  DeleteSpace,
  EditSpace,
  fetchDataforManager,
  optimisticDeleteSpace,
} from "../../slices/CommonSpaceSlice";
import {
  Button,
  ConfirmModal,
  EmptyState,
  FormSection,
  GraphBar,
  GraphLine,
  GraphPie,
  Input,
  Modal,
  SearchBar,
  Select,
  StatCard,
  Textarea,
} from "../shared";
import {
  ManagerActionButton,
  ManagerPageShell,
  ManagerRecordCard,
  ManagerRecordGrid,
  ManagerSection,
  ManagerToolbar,
  ManagerToolbarGrow,
} from "./ui";
import { UE_CHART_COLORS, UE_CHART_PALETTE } from "../shared/chartPalette";

const formatBookingDate = (value) =>
  new Date(value).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });

export const CommonSpace = () => {
  const dispatch = useDispatch();
  const { avalaibleSpaces = [], Bookings = [] } = useSelector((state) => state.CommonSpace);

  const [isManagementVisible, setIsManagementVisible] = useState(false);
  const [isSpaceFormOpen, setIsSpaceFormOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isRejectionPopupOpen, setIsRejectionPopupOpen] = useState(false);
  const [bookingToReject, setBookingToReject] = useState(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [bookingDetailsOpen, setBookingDetailsOpen] = useState(false);
  const [currentBooking, setCurrentBooking] = useState({});
  const [toggleRent, setToggleRent] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const occupancyRate = useMemo(() => {
    if (!Bookings.length) return 0;
    const approvedCount = Bookings.filter((booking) => booking.status === "Approved").length;
    return Math.round((approvedCount / Bookings.length) * 100);
  }, [Bookings]);

  const bookingStatusData = useMemo(() => {
    const counts = Bookings.reduce((accumulator, booking) => {
      const status = booking?.status || "Unknown";
      accumulator[status] = (accumulator[status] || 0) + 1;
      return accumulator;
    }, {});

    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [Bookings]);

  const bookingTrendData = useMemo(() => {
    const now = new Date();
    const months = Array.from({ length: 6 }, (_, index) => {
      const date = new Date(now.getFullYear(), now.getMonth() - (5 - index), 1);
      return {
        key: `${date.getFullYear()}-${date.getMonth()}`,
        label: date.toLocaleDateString("en-IN", { month: "short" }),
        count: 0,
      };
    });

    const monthMap = months.reduce((accumulator, month) => {
      accumulator[month.key] = month;
      return accumulator;
    }, {});

    Bookings.forEach((booking) => {
      const bookingDate = booking?.Date || booking?.createdAt;
      if (!bookingDate) return;
      const date = new Date(bookingDate);
      if (Number.isNaN(date.getTime())) return;
      const key = `${date.getFullYear()}-${date.getMonth()}`;
      if (monthMap[key]) {
        monthMap[key].count += 1;
      }
    });

    return months.map((month) => ({ name: month.label, bookings: month.count }));
  }, [Bookings]);

  const facilityUsageData = useMemo(() => {
    const counts = Bookings.reduce((accumulator, booking) => {
      const name = booking?.name || "Unknown";
      accumulator[name] = (accumulator[name] || 0) + 1;
      return accumulator;
    }, {});

    return Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .sort((left, right) => right.value - left.value)
      .slice(0, 6);
  }, [Bookings]);


  const { register, handleSubmit, reset, watch } = useForm({
    defaultValues: {
      spaceType: "",
      spaceName: "",
      bookable: "true",
      bookingRent: "",
      bookingRules: "",
      Type: "",
    },
  });

  useEffect(() => {
    dispatch(fetchDataforManager());
  }, [dispatch]);

  const bookingType = watch("Type");
  useEffect(() => {
    if (bookingType === "Slot") setToggleRent(false);
    else if (bookingType === "Subscription") setToggleRent(true);
  }, [bookingType]);

  const filteredBookings = Bookings.filter((booking) => {
    const searchLower = searchQuery.toLowerCase();
    const spaceName = booking.name?.toLowerCase() || "";
    const bookingDate = formatBookingDate(booking.Date).toLowerCase();
    const bookingStatus = booking.status?.toLowerCase() || "";
    const bookingId = booking.ID?.toLowerCase() || "";

    return (
      spaceName.includes(searchLower) ||
      bookingDate.includes(searchLower) ||
      bookingStatus.includes(searchLower) ||
      bookingId.includes(searchLower)
    );
  });

  const onSubmit = (data) => {
    const payload = { ...data, bookable: data.bookable === "true" };
    if (isEditing) {
      dispatch(EditSpace({ id: data.id, updatedData: payload }));
      toast.success("Space updated successfully");
    } else {
      dispatch(AddSpace(payload));
      toast.success("Space added successfully");
    }
    setIsSpaceFormOpen(false);
    reset();
  };

  const handleEditSpace = (space) => {
    setIsEditing(true);
    reset({
      spaceType: space.type,
      spaceName: space.name,
      bookable: String(space.bookable),
      bookingRent: space.rent || "",
      bookingRules: space.bookingRules || "",
      Type: space.Type || "",
      id: space._id,
    });
    setIsSpaceFormOpen(true);
  };

  const handleDeleteSpace = (space) => {
    if (!window.confirm(`Are you sure you want to delete the space "${space.name}"?`)) return;

    dispatch(optimisticDeleteSpace(space._id));
    dispatch(DeleteSpace(space._id))
      .unwrap()
      .then(() => toast.success("Space deleted successfully"));
  };

  const handleApprove = (bookingId) => {
    console.log("Approving booking:", bookingId);
  };

  const openRejectPopup = (bookingId) => {
    setBookingToReject(bookingId);
    setIsRejectionPopupOpen(true);
  };

  const handleRejectionSubmit = () => {
    if (!rejectionReason.trim()) {
      alert("Please provide a reason for rejection.");
      return;
    }

    console.log("Rejected booking:", bookingToReject, rejectionReason);
    setIsRejectionPopupOpen(false);
    setRejectionReason("");
    setBookingToReject(null);
  };

  return (
    <>
      <ToastContainer position="top-center" autoClose={1500} />

      <ManagerPageShell
        eyebrow="Common Spaces"
        title="Manage amenities, booking requests, and usage visibility from one desk."
        description="The booking surface now follows the same manager shell, panels, and record cards as the rest of the manager workspace."
        chips={[`${Bookings.length} bookings tracked`, `${avalaibleSpaces.length} spaces configured`]}
        actions={
          <ManagerActionButton variant="secondary" onClick={() => setIsManagementVisible((previous) => !previous)}>
            {isManagementVisible ? "Hide management" : "Show management"}
          </ManagerActionButton>
        }
      >
        {isManagementVisible ? (
          <ManagerSection
            eyebrow="Space Management"
            title="Amenity setup"
            description="Create or update bookable spaces without leaving the common space desk."
            actions={
              <ManagerActionButton
                variant="primary"
                onClick={() => {
                  setIsEditing(false);
                  reset();
                  setIsSpaceFormOpen(true);
                }}
              >
                <Plus size={16} />
                Add New Space
              </ManagerActionButton>
            }
          >
            {avalaibleSpaces.length > 0 ? (
              <ManagerRecordGrid>
                {avalaibleSpaces.map((space) => (
                  <ManagerRecordCard
                    key={space._id}
                    title={space.name}
                    subtitle={space.type}
                    meta={[
                      { label: "Bookable", value: space.bookable ? "Yes" : "No" },
                      { label: "Rent", value: space.rent || "-" },
                      { label: "Booking mode", value: space.Type || "-" },
                    ]}
                    footer={
                      space.bookingRules ? <p className="manager-ui-note">{space.bookingRules}</p> : null
                    }
                    actions={
                      <>
                        <ManagerActionButton variant="secondary" onClick={() => handleEditSpace(space)}>
                          Edit
                        </ManagerActionButton>
                        <ManagerActionButton variant="danger" onClick={() => handleDeleteSpace(space)}>
                          <Trash2 size={16} />
                          Delete
                        </ManagerActionButton>
                      </>
                    }
                  />
                ))}
              </ManagerRecordGrid>
            ) : (
              <EmptyState
                icon={<Building2 size={48} />}
                title="No common spaces configured"
                sub="Add your first common space to get started."
              />
            )}
          </ManagerSection>
        ) : null}

        <div className="ue-stat-grid">
          <StatCard label="Total Bookings" value={Bookings.length} icon={<Calendar size={22} />} iconColor="#7c3aed" iconBg="#f3edff" />
          <StatCard label="Occupancy Rate" value={`${occupancyRate}%`} icon={<BarChart3 size={22} />} iconColor="#8b5cf6" iconBg="#f5f3ff" />
          <StatCard label="Approved" value={Bookings.filter((booking) => booking.status === "Approved").length} icon={<CheckCircle size={22} />} iconColor="#5b6472" iconBg="#f2f4f8" />
          <StatCard label="Amenities" value={avalaibleSpaces.length} icon={<Building2 size={22} />} iconColor="#d95d4f" iconBg="#feefed" />
        </div>

        <ManagerSection
          eyebrow="Insights"
          title="Booking trends"
          description="Monitor booking health by status, monthly demand, and top facility usage."
        >
          <div className="manager-ui-two-column">
            <GraphPie
              title="Status breakdown"
              subtitle="Current booking state distribution"
              data={bookingStatusData}
              colors={[...UE_CHART_PALETTE, UE_CHART_COLORS.danger]}
            />
            <GraphLine
              title="Bookings over time"
              subtitle="Last six months"
              xKey="name"
              data={bookingTrendData}
              lines={[{ key: "bookings", label: "Bookings", color: UE_CHART_COLORS.plum }]}
              showArea
            />
          </div>
          <div style={{ marginTop: 16 }}>
            <GraphBar
              title="Top facilities"
              subtitle="Most requested amenities"
              xKey="name"
              data={facilityUsageData}
              bars={[{ key: "value", label: "Bookings", color: UE_CHART_COLORS.emerald }]}
            />
          </div>
        </ManagerSection>

        <ManagerSection
          eyebrow="Booking Queue"
          title="Resident requests"
          description="Search the booking desk by space name, date, status, or booking ID."
        >
          <ManagerToolbar>
            <ManagerToolbarGrow>
              <SearchBar placeholder="Search by space, date, status, or booking ID..." value={searchQuery} onChange={setSearchQuery} />
            </ManagerToolbarGrow>
            <Button variant="secondary" onClick={() => setSearchQuery("")}>
              Clear
            </Button>
          </ManagerToolbar>

          {filteredBookings.length > 0 ? (
            <ManagerRecordGrid>
              {filteredBookings.map((booking) => (
                <ManagerRecordCard
                  key={booking._id}
                  title={booking.name}
                  subtitle={`${formatBookingDate(booking.Date)} • ${booking.from} - ${booking.to}`}
                  status={<span className="manager-ui-status-pill">{booking.status}</span>}
                  meta={[
                    { label: "Booking ID", value: booking.ID || "-" },
                    { label: "Booked By", value: `${booking.bookedBy?.residentFirstname || ""} ${booking.bookedBy?.residentLastname || ""}`.trim() || "-" },
                    { label: "Purpose", value: booking.description || "-" },
                  ]}
                  actions={
                    booking.status === "Pending" ? (
                      <ManagerActionButton variant="secondary" onClick={() => console.log("Checking availability for", booking._id)}>
                        Check Availability
                      </ManagerActionButton>
                    ) : booking.status === "Avalaible" ? (
                      <>
                        <ManagerActionButton variant="primary" onClick={() => handleApprove(booking._id)}>
                          Approve
                        </ManagerActionButton>
                        <ManagerActionButton variant="danger" onClick={() => openRejectPopup(booking._id)}>
                          Reject
                        </ManagerActionButton>
                      </>
                    ) : (
                      <ManagerActionButton
                        variant="secondary"
                        onClick={() => {
                          setCurrentBooking(booking);
                          setBookingDetailsOpen(true);
                        }}
                      >
                        <Eye size={16} />
                        View Details
                      </ManagerActionButton>
                    )
                  }
                />
              ))}
            </ManagerRecordGrid>
          ) : (
            <EmptyState
              icon={<Calendar size={48} />}
              title="No bookings found"
              sub="There are currently no common space bookings to display."
            />
          )}
        </ManagerSection>

        <Modal
          isOpen={isSpaceFormOpen}
          onClose={() => setIsSpaceFormOpen(false)}
          title={isEditing ? "Edit Common Space" : "Add New Common Space"}
          size="md"
          footer={
            <>
              <button type="button" onClick={() => setIsSpaceFormOpen(false)} className="manager-ui-button manager-ui-button--secondary">
                Cancel
              </button>
              <button type="button" onClick={handleSubmit(onSubmit)} className="manager-ui-button manager-ui-button--primary">
                {isEditing ? "Update Space" : "Save Space"}
              </button>
            </>
          }
        >
          <input className="d-none" type="hidden" {...register("id")} />
          <FormSection columns={2}>
            <Select
              label="Space Type"
              required
              placeholder="Select type"
              options={[
                { label: "Clubhouse", value: "Clubhouse" },
                { label: "Banquet Hall", value: "Banquet Hall" },
                { label: "Swimming Pool", value: "Swimming Pool" },
                { label: "Guest Room", value: "Guest Room" },
                { label: "Gym", value: "Gym" },
                { label: "Other", value: "Other" },
              ]}
              {...register("spaceType", { required: true })}
            />
            <Input label="Space Name" required {...register("spaceName", { required: true })} />
          </FormSection>
          <Select
            label="Booking Type"
            required
            placeholder="Select type"
            options={[
              { label: "Slots based", value: "Slot" },
              { label: "Subscription based", value: "Subscription" },
            ]}
            {...register("Type", { required: true })}
          />
          <FormSection columns={2}>
            <Select
              label="Bookable"
              required
              options={[
                { label: "Yes", value: "true" },
                { label: "No", value: "false" },
              ]}
              {...register("bookable", { required: true })}
            />
            <Input label={toggleRent ? "Subscription Fee" : "Rent (per hour)"} {...register("bookingRent")} />
          </FormSection>
          <Textarea label="Booking Rules" rows={3} {...register("bookingRules")} />
        </Modal>

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
              style={{ width: "100%", padding: "10px", border: "1px solid #d6c6f4", borderRadius: 12, marginTop: 8, fontSize: 14 }}
              placeholder="Enter reason for rejection..."
              value={rejectionReason}
              onChange={(event) => setRejectionReason(event.target.value)}
            />
          }
        />

        <Modal
          isOpen={bookingDetailsOpen}
          onClose={() => setBookingDetailsOpen(false)}
          title="Booking Details"
          size="lg"
        >
          <div className="details-grid">
            <div className="detail-item">
              <span className="detail-label">Booking ID</span>
              <span className="detail-value">{currentBooking?.ID}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Booking Status</span>
              <span className="detail-value">{currentBooking?.status}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Space Name</span>
              <span className="detail-value">{currentBooking?.name}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Booked By</span>
              <span className="detail-value">
                {currentBooking?.bookedBy?.residentFirstname} {currentBooking?.bookedBy?.residentLastname}
              </span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Contact Email</span>
              <span className="detail-value">{currentBooking?.bookedBy?.email}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Booking Date</span>
              <span className="detail-value">{currentBooking?.Date ? formatBookingDate(currentBooking.Date) : "-"}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Time Slot</span>
              <span className="detail-value">{currentBooking?.from} - {currentBooking?.to}</span>
            </div>
            <div className="detail-item full">
              <span className="detail-label">Purpose</span>
              <span className="detail-value">{currentBooking?.description}</span>
            </div>
            {currentBooking?.payment && currentBooking.status !== "Cancelled" ? (
              <div className="detail-item full">
                <span className="detail-label">Payment</span>
                <span className="detail-value">
                  ₹{currentBooking?.payment?.amount || 0} • {currentBooking?.payment?.status}
                </span>
              </div>
            ) : null}
            {currentBooking?.status === "Cancelled" ? (
              <div className="detail-item full">
                <span className="detail-label">Cancellation Reason</span>
                <span className="detail-value">{currentBooking?.cancellationReason || "N/A"}</span>
              </div>
            ) : null}
          </div>
        </Modal>
      </ManagerPageShell>
    </>
  );
};
