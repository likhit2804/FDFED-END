import React, { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { useDispatch, useSelector } from "react-redux";
import { ToastContainer, toast } from "react-toastify";
import { BarChart3, Building2, Calendar, CheckCircle, Eye, Plus, Trash2 } from "lucide-react";
import { DayPicker } from "react-day-picker";
import "react-day-picker/dist/style.css";

import {
  AddSpace,
  cancelBookingByManager,
  DeleteSpace,
  EditSpace,
  fetchDataforManager,
  optimisticDeleteSpace,
  updateSpaceAvailabilityControls,
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
  const [refundType, setRefundType] = useState("none");
  const [refundPercentage, setRefundPercentage] = useState("");
  const [refundAmount, setRefundAmount] = useState("");
  const [managerCancelLoading, setManagerCancelLoading] = useState(false);
  const [bookingDetailsOpen, setBookingDetailsOpen] = useState(false);
  const [currentBooking, setCurrentBooking] = useState({});
  const [isAvailabilityModalOpen, setIsAvailabilityModalOpen] = useState(false);
  const [availabilitySpace, setAvailabilitySpace] = useState(null);
  const [availabilityControlsDraft, setAvailabilityControlsDraft] = useState(null);
  const [selectedControlDate, setSelectedControlDate] = useState(new Date());
  const [controlMonth, setControlMonth] = useState(new Date());
  const [dayControlDraft, setDayControlDraft] = useState({
    isBlackout: false,
    blackoutReason: "",
    closedAllDay: false,
    closedSlots: "",
    overrideReason: "",
  });
  const [availabilitySaving, setAvailabilitySaving] = useState(false);
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

  const terminalBookingStatuses = new Set([
    "Rejected",
    "Cancelled",
    "Cancelled By Resident",
    "Cancelled By Manager",
    "Completed",
    "Expired",
  ]);

  const canManagerCancel = (booking) =>
    booking && !terminalBookingStatuses.has(booking.status);

  const toDateInputValue = (value) => {
    if (!value) return "";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";
    return date.toISOString().split("T")[0];
  };
  const toDateFromIso = (isoDate) => {
    if (!isoDate) return null;
    const parsed = new Date(`${isoDate}T00:00:00`);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  };

  const getSelectedControlDateKey = () => toDateInputValue(selectedControlDate);

  const getDraftControls = (space) => {
    const controls = space?.availabilityControls || {};
    const slotConfig = controls.slotConfig || {};
    const bookingPolicy = controls.bookingPolicy || {};

    return {
      slotConfig: {
        startTime: slotConfig.startTime || "06:00",
        endTime: slotConfig.endTime || "22:00",
      },
      bookingPolicy: {
        minAdvanceHours: String(bookingPolicy.minAdvanceHours ?? 0),
        maxAdvanceDays: String(bookingPolicy.maxAdvanceDays ?? 90),
        sameDayCutoffTime: bookingPolicy.sameDayCutoffTime || "22:00",
      },
      blackoutDates: Array.isArray(controls.blackoutDates)
        ? controls.blackoutDates.map((entry) => ({
            date: toDateInputValue(entry.date),
            reason: entry.reason || "",
          }))
        : [],
      dateSlotOverrides: Array.isArray(controls.dateSlotOverrides)
        ? controls.dateSlotOverrides.map((entry) => ({
            date: toDateInputValue(entry.date),
            closedAllDay: Boolean(entry.closedAllDay),
            closedSlots: Array.isArray(entry.closedSlots) ? entry.closedSlots : [],
            reason: entry.reason || "",
          }))
        : [],
    };
  };

  const getDayControlDraft = (controls, dateKey) => {
    const blackout = (controls?.blackoutDates || []).find((entry) => entry.date === dateKey);
    const override = (controls?.dateSlotOverrides || []).find((entry) => entry.date === dateKey);

    return {
      isBlackout: Boolean(blackout),
      blackoutReason: blackout?.reason || "",
      closedAllDay: Boolean(override?.closedAllDay),
      closedSlots: Array.isArray(override?.closedSlots)
        ? override.closedSlots.join(", ")
        : "",
      overrideReason: override?.reason || "",
    };
  };

  const blackoutModifierDays = useMemo(
    () =>
      (availabilityControlsDraft?.blackoutDates || [])
        .map((entry) => toDateFromIso(entry.date))
        .filter(Boolean),
    [availabilityControlsDraft],
  );

  const overrideModifierDays = useMemo(
    () =>
      (availabilityControlsDraft?.dateSlotOverrides || [])
        .map((entry) => toDateFromIso(entry.date))
        .filter(Boolean),
    [availabilityControlsDraft],
  );

  const openAvailabilityModal = (space) => {
    const today = new Date();
    const todayKey = toDateInputValue(today);
    const controls = getDraftControls(space);

    setAvailabilitySpace(space);
    setAvailabilityControlsDraft(controls);
    setSelectedControlDate(today);
    setControlMonth(today);
    setDayControlDraft(getDayControlDraft(controls, todayKey));
    setIsAvailabilityModalOpen(true);
  };

  const updateSlotConfigDraft = (field, value) => {
    setAvailabilityControlsDraft((previous) => ({
      ...previous,
      slotConfig: {
        ...previous.slotConfig,
        [field]: value,
      },
    }));
  };

  const updatePolicyDraft = (field, value) => {
    setAvailabilityControlsDraft((previous) => ({
      ...previous,
      bookingPolicy: {
        ...previous.bookingPolicy,
        [field]: value,
      },
    }));
  };

  const parseClosedSlotsInput = (value) => {
    const tokens = String(value || "")
      .split(",")
      .map((token) => token.trim())
      .filter(Boolean);

    const invalid = tokens.filter(
      (token) => !/^([0-1]?\d|2[0-3]):[0-5]\d$/.test(token),
    );
    if (invalid.length > 0) {
      return {
        valid: false,
        message: `Invalid slot format: ${invalid.join(", ")}. Use HH:mm.`,
      };
    }

    return {
      valid: true,
      slots: [...new Set(tokens)].sort(),
    };
  };

  useEffect(() => {
    if (!isAvailabilityModalOpen || !availabilityControlsDraft) return;
    const selectedDateKey = getSelectedControlDateKey();
    if (!selectedDateKey) return;

    setDayControlDraft(getDayControlDraft(availabilityControlsDraft, selectedDateKey));
  }, [
    isAvailabilityModalOpen,
    availabilityControlsDraft,
    selectedControlDate,
  ]);

  const applySelectedDayControls = () => {
    const selectedDateKey = getSelectedControlDateKey();
    if (!selectedDateKey) {
      toast.error("Select a valid date on calendar.");
      return;
    }

    const parsedSlots = parseClosedSlotsInput(dayControlDraft.closedSlots);
    if (!parsedSlots.valid) {
      toast.error(parsedSlots.message);
      return;
    }

    const normalizedSlots = dayControlDraft.closedAllDay ? [] : parsedSlots.slots;
    const shouldPersistOverride =
      dayControlDraft.closedAllDay || normalizedSlots.length > 0;

    setAvailabilityControlsDraft((previous) => {
      const blackoutByDate = new Map(
        (previous.blackoutDates || []).map((entry) => [entry.date, entry]),
      );
      if (dayControlDraft.isBlackout) {
        blackoutByDate.set(selectedDateKey, {
          date: selectedDateKey,
          reason: dayControlDraft.blackoutReason.trim(),
        });
      } else {
        blackoutByDate.delete(selectedDateKey);
      }

      const overrideByDate = new Map(
        (previous.dateSlotOverrides || []).map((entry) => [entry.date, entry]),
      );
      if (shouldPersistOverride) {
        overrideByDate.set(selectedDateKey, {
          date: selectedDateKey,
          closedAllDay: Boolean(dayControlDraft.closedAllDay),
          closedSlots: normalizedSlots,
          reason: dayControlDraft.overrideReason.trim(),
        });
      } else {
        overrideByDate.delete(selectedDateKey);
      }

      return {
        ...previous,
        blackoutDates: [...blackoutByDate.values()].sort((a, b) =>
          a.date.localeCompare(b.date),
        ),
        dateSlotOverrides: [...overrideByDate.values()].sort((a, b) =>
          a.date.localeCompare(b.date),
        ),
      };
    });
    toast.success(`Updated controls for ${selectedDateKey}`);
  };

  const clearSelectedDayControls = () => {
    const selectedDateKey = getSelectedControlDateKey();
    if (!selectedDateKey) return;

    setAvailabilityControlsDraft((previous) => ({
      ...previous,
      blackoutDates: (previous.blackoutDates || []).filter(
        (entry) => entry.date !== selectedDateKey,
      ),
      dateSlotOverrides: (previous.dateSlotOverrides || []).filter(
        (entry) => entry.date !== selectedDateKey,
      ),
    }));

    setDayControlDraft({
      isBlackout: false,
      blackoutReason: "",
      closedAllDay: false,
      closedSlots: "",
      overrideReason: "",
    });

    toast.success(`Cleared controls for ${selectedDateKey}`);
  };

  const saveAvailabilityControls = async () => {
    if (!availabilitySpace?._id || !availabilityControlsDraft) return;

    const payload = {
      slotConfig: {
        startTime: availabilityControlsDraft.slotConfig.startTime,
        endTime: availabilityControlsDraft.slotConfig.endTime,
      },
      bookingPolicy: {
        minAdvanceHours: Number(availabilityControlsDraft.bookingPolicy.minAdvanceHours || 0),
        maxAdvanceDays: Number(availabilityControlsDraft.bookingPolicy.maxAdvanceDays || 90),
        sameDayCutoffTime: availabilityControlsDraft.bookingPolicy.sameDayCutoffTime,
      },
      blackoutDates: (availabilityControlsDraft.blackoutDates || []).map((entry) => ({
        date: entry.date,
        reason: entry.reason || "",
      })),
      dateSlotOverrides: (availabilityControlsDraft.dateSlotOverrides || []).map((entry) => ({
        date: entry.date,
        closedAllDay: Boolean(entry.closedAllDay),
        closedSlots: Array.isArray(entry.closedSlots) ? entry.closedSlots : [],
        reason: entry.reason || "",
      })),
    };

    if (payload.bookingPolicy.maxAdvanceDays < 1) {
      toast.error("Max advance days should be at least 1.");
      return;
    }

    try {
      setAvailabilitySaving(true);
      const result = await dispatch(
        updateSpaceAvailabilityControls({
          id: availabilitySpace._id,
          availabilityControls: payload,
        }),
      ).unwrap();
      toast.success(result?.message || "Availability controls updated.");
      setIsAvailabilityModalOpen(false);
      setAvailabilitySpace(null);
      setAvailabilityControlsDraft(null);
    } catch (error) {
      toast.error(error?.message || "Failed to update availability controls.");
    } finally {
      setAvailabilitySaving(false);
    }
  };

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

  const openRejectPopup = (booking) => {
    setBookingToReject(booking);
    setRejectionReason("");
    setRefundType("none");
    setRefundPercentage("");
    setRefundAmount("");
    setIsRejectionPopupOpen(true);
  };

  const handleRejectionSubmit = async () => {
    if (!rejectionReason.trim()) {
      toast.error("Please provide a cancellation reason.");
      return;
    }

    if (refundType === "partial") {
      const parsedPercentage =
        refundPercentage !== "" ? Number(refundPercentage) : NaN;
      const parsedAmount = refundAmount !== "" ? Number(refundAmount) : NaN;
      const hasValidPercentage =
        Number.isFinite(parsedPercentage) &&
        parsedPercentage >= 0 &&
        parsedPercentage <= 100;
      const hasValidAmount = Number.isFinite(parsedAmount) && parsedAmount >= 0;

      if (!hasValidPercentage && !hasValidAmount) {
        toast.error(
          "For partial refund, provide valid refund % (0-100) or refund amount.",
        );
        return;
      }
    }

    try {
      setManagerCancelLoading(true);
      const result = await dispatch(
        cancelBookingByManager({
          bookingId: bookingToReject?._id,
          reason: rejectionReason.trim(),
          refundType,
          refundPercentage: refundType === "partial" ? refundPercentage : undefined,
          refundAmount: refundType === "partial" ? refundAmount : undefined,
        }),
      ).unwrap();

      toast.success(
        result?.message ||
          "Booking cancelled successfully with manager decision.",
      );
      setIsRejectionPopupOpen(false);
      setBookingToReject(null);
      setRejectionReason("");
      setRefundType("none");
      setRefundPercentage("");
      setRefundAmount("");
    } catch (error) {
      toast.error(error?.message || error || "Failed to cancel booking.");
    } finally {
      setManagerCancelLoading(false);
    }
  };

  const selectedControlDateKey = getSelectedControlDateKey();
  const minControlDate = new Date();
  minControlDate.setHours(0, 0, 0, 0);
  const maxControlDate = new Date(minControlDate);
  maxControlDate.setDate(maxControlDate.getDate() + 365);

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
                        <ManagerActionButton variant="secondary" onClick={() => openAvailabilityModal(space)}>
                          Availability
                        </ManagerActionButton>
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
                      <>
                        <ManagerActionButton variant="secondary" onClick={() => console.log("Checking availability for", booking._id)}>
                          Check Availability
                        </ManagerActionButton>
                        <ManagerActionButton variant="danger" onClick={() => openRejectPopup(booking)}>
                          Cancel / Refund
                        </ManagerActionButton>
                      </>
                    ) : booking.status === "Avalaible" || booking.status === "Available" ? (
                      <>
                        <ManagerActionButton variant="primary" onClick={() => handleApprove(booking._id)}>
                          Approve
                        </ManagerActionButton>
                        <ManagerActionButton variant="danger" onClick={() => openRejectPopup(booking)}>
                          Reject
                        </ManagerActionButton>
                      </>
                    ) : (
                      <>
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
                        {canManagerCancel(booking) ? (
                          <ManagerActionButton variant="danger" onClick={() => openRejectPopup(booking)}>
                            Cancel / Refund
                          </ManagerActionButton>
                        ) : null}
                      </>
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

        <Modal
          isOpen={isAvailabilityModalOpen}
          onClose={() => setIsAvailabilityModalOpen(false)}
          title={`Availability Controls${availabilitySpace?.name ? ` · ${availabilitySpace.name}` : ""}`}
          size="lg"
          footer={
            <>
              <button
                type="button"
                className="manager-ui-button manager-ui-button--secondary"
                onClick={() => setIsAvailabilityModalOpen(false)}
                disabled={availabilitySaving}
              >
                Cancel
              </button>
              <button
                type="button"
                className="manager-ui-button manager-ui-button--primary"
                onClick={saveAvailabilityControls}
                disabled={availabilitySaving}
              >
                {availabilitySaving ? "Saving..." : "Save controls"}
              </button>
            </>
          }
        >
          {availabilityControlsDraft ? (
            <div style={{ display: "grid", gap: 14 }}>
              <FormSection columns={2}>
                <Input
                  label="Slot start time"
                  type="time"
                  value={availabilityControlsDraft.slotConfig.startTime}
                  onChange={(event) =>
                    updateSlotConfigDraft("startTime", event.target.value)
                  }
                />
                <Input
                  label="Slot end time"
                  type="time"
                  value={availabilityControlsDraft.slotConfig.endTime}
                  onChange={(event) =>
                    updateSlotConfigDraft("endTime", event.target.value)
                  }
                />
              </FormSection>
              <FormSection columns={3}>
                <Input
                  label="Min advance (hours)"
                  type="number"
                  min="0"
                  max="720"
                  value={availabilityControlsDraft.bookingPolicy.minAdvanceHours}
                  onChange={(event) =>
                    updatePolicyDraft("minAdvanceHours", event.target.value)
                  }
                />
                <Input
                  label="Max advance (days)"
                  type="number"
                  min="1"
                  max="365"
                  value={availabilityControlsDraft.bookingPolicy.maxAdvanceDays}
                  onChange={(event) =>
                    updatePolicyDraft("maxAdvanceDays", event.target.value)
                  }
                />
                <Input
                  label="Same-day cutoff"
                  type="time"
                  value={availabilityControlsDraft.bookingPolicy.sameDayCutoffTime}
                  onChange={(event) =>
                    updatePolicyDraft("sameDayCutoffTime", event.target.value)
                  }
                />
              </FormSection>
              <div className="manager-ui-two-column">
                <div className="manager-ui-surface">
                  <h4 className="manager-ui-title-sm">Calendar Controls</h4>
                  <p className="manager-ui-note">
                    Pick a date from calendar. Red = blackout, Blue = slot override.
                  </p>
                  <DayPicker
                    mode="single"
                    month={controlMonth}
                    onMonthChange={setControlMonth}
                    selected={selectedControlDate}
                    onSelect={(date) => {
                      if (!date) return;
                      setSelectedControlDate(date);
                    }}
                    showOutsideDays
                    startMonth={minControlDate}
                    endMonth={maxControlDate}
                    disabled={{ before: minControlDate, after: maxControlDate }}
                    modifiers={{
                      blackout: blackoutModifierDays,
                      override: overrideModifierDays,
                    }}
                    modifiersStyles={{
                      blackout: {
                        backgroundColor: "#fee2e2",
                        color: "#b91c1c",
                        fontWeight: 700,
                      },
                      override: {
                        backgroundColor: "#dbeafe",
                        color: "#1d4ed8",
                        fontWeight: 700,
                      },
                    }}
                  />
                </div>

                <div className="manager-ui-surface">
                  <h4 className="manager-ui-title-sm">
                    Selected Date: {selectedControlDateKey || "-"}
                  </h4>
                  <p className="manager-ui-note">
                    Edit rules only for this selected date. Old history is hidden unless you click that date.
                  </p>
                  <div style={{ display: "grid", gap: 10 }}>
                    <label
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        fontSize: 14,
                        color: "#374151",
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={dayControlDraft.isBlackout}
                        onChange={(event) =>
                          setDayControlDraft((previous) => ({
                            ...previous,
                            isBlackout: event.target.checked,
                          }))
                        }
                      />
                      Blackout this date
                    </label>
                    <Input
                      label="Blackout reason"
                      value={dayControlDraft.blackoutReason}
                      onChange={(event) =>
                        setDayControlDraft((previous) => ({
                          ...previous,
                          blackoutReason: event.target.value,
                        }))
                      }
                      placeholder="Optional reason"
                      disabled={!dayControlDraft.isBlackout}
                    />

                    <label
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        fontSize: 14,
                        color: "#374151",
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={dayControlDraft.closedAllDay}
                        onChange={(event) =>
                          setDayControlDraft((previous) => ({
                            ...previous,
                            closedAllDay: event.target.checked,
                          }))
                        }
                      />
                      Close all slots for this date
                    </label>
                    <Input
                      label="Closed slots (comma separated HH:mm)"
                      value={dayControlDraft.closedSlots}
                      onChange={(event) =>
                        setDayControlDraft((previous) => ({
                          ...previous,
                          closedSlots: event.target.value,
                        }))
                      }
                      placeholder="09:00,10:00,11:00"
                      disabled={dayControlDraft.closedAllDay}
                    />
                    <Input
                      label="Override reason"
                      value={dayControlDraft.overrideReason}
                      onChange={(event) =>
                        setDayControlDraft((previous) => ({
                          ...previous,
                          overrideReason: event.target.value,
                        }))
                      }
                      placeholder="Optional reason"
                    />
                  </div>
                  <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                    <ManagerActionButton
                      variant="secondary"
                      onClick={applySelectedDayControls}
                    >
                      Apply for date
                    </ManagerActionButton>
                    <ManagerActionButton
                      variant="danger"
                      onClick={clearSelectedDayControls}
                    >
                      Clear date config
                    </ManagerActionButton>
                  </div>
                </div>
              </div>
            </div>
          ) : null}
        </Modal>

        <ConfirmModal
          isOpen={isRejectionPopupOpen}
          onClose={() => setIsRejectionPopupOpen(false)}
          onConfirm={handleRejectionSubmit}
          title="Cancel Booking"
          variant="danger"
          confirmText="Confirm Cancellation"
          loading={managerCancelLoading}
          message={
            <div style={{ display: "grid", gap: 10, marginTop: 8 }}>
              <textarea
                rows={4}
                style={{ width: "100%", padding: "10px", border: "1px solid #d6c6f4", borderRadius: 12, fontSize: 14 }}
                placeholder="Enter cancellation reason..."
                value={rejectionReason}
                onChange={(event) => setRejectionReason(event.target.value)}
              />
              <select
                value={refundType}
                onChange={(event) => setRefundType(event.target.value)}
                style={{ width: "100%", padding: "10px", border: "1px solid #d6c6f4", borderRadius: 12, fontSize: 14 }}
              >
                <option value="none">No refund</option>
                <option value="full">Full refund</option>
                <option value="partial">Partial refund</option>
              </select>
              {refundType === "partial" ? (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    placeholder="Refund % (0-100)"
                    value={refundPercentage}
                    onChange={(event) => setRefundPercentage(event.target.value)}
                    style={{ width: "100%", padding: "10px", border: "1px solid #d6c6f4", borderRadius: 12, fontSize: 14 }}
                  />
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="Refund amount"
                    value={refundAmount}
                    onChange={(event) => setRefundAmount(event.target.value)}
                    style={{ width: "100%", padding: "10px", border: "1px solid #d6c6f4", borderRadius: 12, fontSize: 14 }}
                  />
                </div>
              ) : null}
            </div>
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
            {currentBooking?.payment && !String(currentBooking?.status || "").startsWith("Cancelled") ? (
              <div className="detail-item full">
                <span className="detail-label">Payment</span>
                <span className="detail-value">
                  ₹{currentBooking?.payment?.amount || 0} • {currentBooking?.payment?.status}
                </span>
              </div>
            ) : null}
            {String(currentBooking?.status || "").startsWith("Cancelled") ? (
              <div className="detail-item full">
                <span className="detail-label">Cancellation Reason</span>
                <span className="detail-value">{currentBooking?.cancellationReason || "N/A"}</span>
              </div>
            ) : null}
            {String(currentBooking?.status || "").startsWith("Cancelled") ? (
              <div className="detail-item full">
                <span className="detail-label">Refund Details</span>
                <span className="detail-value">
                  {(currentBooking?.managerCancellation?.refundType || "none").toUpperCase()} • ₹
                  {currentBooking?.managerCancellation?.refundAmount ?? currentBooking?.refundAmount ?? 0}
                </span>
              </div>
            ) : null}
          </div>
        </Modal>
      </ManagerPageShell>
    </>
  );
};
