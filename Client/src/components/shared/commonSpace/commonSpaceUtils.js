import { buildCategoryCountData } from "../chartDataUtils";

export const formatBookingDate = (value, locale = "en-US") =>
  new Date(value).toLocaleDateString(locale, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

export const formatDisplayDate = (dateObj, locale = "en-GB") =>
  dateObj.toLocaleDateString(locale, {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

export const formatTime = (hour) => {
  if (hour === 0) return "12:00 AM";
  if (hour < 12) return `${hour}:00 AM`;
  if (hour === 12) return "12:00 PM";
  return `${hour - 12}:00 PM`;
};

export const toDateInputValue = (value) => {
  if (!value) return "";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export const toIsoDate = (dateObj) => toDateInputValue(dateObj);

export const toDateFromIso = (isoDate) => {
  if (!isoDate) return null;
  const parsed = new Date(`${isoDate}T00:00:00`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

export const parseTimeToMinutes = (value) => {
  const match = /^([0-1]?\d|2[0-3]):([0-5]\d)$/.exec(String(value || ""));
  if (!match) return null;
  return Number(match[1]) * 60 + Number(match[2]);
};

export const getAvailabilityControlsForResident = (facility) => {
  const controls = facility?.availabilityControls || {};
  const slotConfig = controls.slotConfig || {};
  const bookingPolicy = controls.bookingPolicy || {};

  return {
    slotConfig: {
      startTime: slotConfig.startTime || "06:00",
      endTime: slotConfig.endTime || "22:00",
    },
    bookingPolicy: {
      minAdvanceHours: Number(bookingPolicy.minAdvanceHours || 0),
      maxAdvanceDays: Number(bookingPolicy.maxAdvanceDays || 90),
      sameDayCutoffTime: bookingPolicy.sameDayCutoffTime || "22:00",
    },
    blackoutDates: Array.isArray(controls.blackoutDates) ? controls.blackoutDates : [],
    dateSlotOverrides: Array.isArray(controls.dateSlotOverrides) ? controls.dateSlotOverrides : [],
  };
};

export const getAvailabilityDraftControls = (space) => {
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

export const getDayControlDraft = (controls, dateKey) => {
  const blackout = (controls?.blackoutDates || []).find((entry) => entry.date === dateKey);
  const override = (controls?.dateSlotOverrides || []).find((entry) => entry.date === dateKey);

  return {
    isBlackout: Boolean(blackout),
    blackoutReason: blackout?.reason || "",
    closedAllDay: Boolean(override?.closedAllDay),
    closedSlots: Array.isArray(override?.closedSlots) ? override.closedSlots.join(", ") : "",
    overrideReason: override?.reason || "",
  };
};

export const parseClosedSlotsInput = (value) => {
  const tokens = String(value || "")
    .split(",")
    .map((token) => token.trim())
    .filter(Boolean);

  const invalid = tokens.filter((token) => !/^([0-1]?\d|2[0-3]):[0-5]\d$/.test(token));
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

export const findDateEntry = (entries, isoDate) =>
  (entries || []).find((entry) => toDateInputValue(entry?.date) === isoDate);

export const buildSlotsFromFacilityConfig = (facility) => {
  const { slotConfig } = getAvailabilityControlsForResident(facility);
  const startMinutes = parseTimeToMinutes(slotConfig.startTime);
  const endMinutes = parseTimeToMinutes(slotConfig.endTime);
  if (startMinutes === null || endMinutes === null || endMinutes <= startMinutes) {
    return [];
  }

  const slots = [];
  for (let minutes = startMinutes; minutes < endMinutes; minutes += 60) {
    const hour = String(Math.floor(minutes / 60)).padStart(2, "0");
    slots.push(`${hour}:00`);
  }
  return slots;
};

export const formatSlotWindow = (facility) => {
  const controls = getAvailabilityControlsForResident(facility);
  const startHour = Number(String(controls.slotConfig.startTime || "06:00").split(":")[0]);
  const endHour = Number(String(controls.slotConfig.endTime || "22:00").split(":")[0]);

  if (!Number.isFinite(startHour) || !Number.isFinite(endHour)) {
    return "6:00 AM - 10:00 PM";
  }

  return `${formatTime(startHour)} - ${formatTime(endHour)}`;
};

export const TERMINAL_BOOKING_STATUSES = new Set([
  "Rejected",
  "Cancelled",
  "Cancelled By Resident",
  "Cancelled By Manager",
  "Completed",
  "Expired",
]);

export const canCancelBooking = (booking) =>
  Boolean(booking) && !TERMINAL_BOOKING_STATUSES.has(booking.status);

export const getOccupancyRate = (bookings = []) => {
  if (!bookings.length) return 0;
  const approvedCount = bookings.filter((booking) => booking.status === "Approved").length;
  return Math.round((approvedCount / bookings.length) * 100);
};

export const normalizeBookingStatusLabel = (statusValue) => {
  const label = String(statusValue || "").trim();
  if (!label) return "Unknown";

  const normalized = label.toLowerCase();
  if (normalized === "avalaible" || normalized === "available") return "Available";
  if (
    normalized === "cancelled" ||
    normalized === "cancelled by resident" ||
    normalized === "cancelled by manager"
  ) {
    return "Cancelled";
  }

  return label;
};

export const getBookingStatusData = (bookings = []) => {
  const bookingStatusOrder = [
    "Pending",
    "Active",
    "Approved/Paid",
    "Cancelled/Rejected",
    "Completed/Expired",
  ];

  const toGroupedStatus = (statusLabel) => {
    const normalized = normalizeBookingStatusLabel(statusLabel);
    const lower = normalized.toLowerCase();

    if (lower === "pending" || lower === "pending payment") return "Pending";
    if (lower === "available" || lower === "booked" || lower === "active") return "Active";
    if (lower === "approved" || lower === "paid") return "Approved/Paid";
    if (lower === "cancelled" || lower === "rejected") return "Cancelled/Rejected";
    if (lower === "completed" || lower === "expired") return "Completed/Expired";

    return "Unknown";
  };

  return buildCategoryCountData(
    bookings,
    (booking) => booking?.status,
    {
      order: bookingStatusOrder,
      normalize: (statusLabel) => toGroupedStatus(statusLabel),
    },
  );
};

export const getBookingTrendData = (bookings = []) => {
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

  bookings.forEach((booking) => {
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
};

export const getFacilityUsageData = (bookings = []) => {
  const counts = bookings.reduce((accumulator, booking) => {
    const name = booking?.name || "Unknown";
    accumulator[name] = (accumulator[name] || 0) + 1;
    return accumulator;
  }, {});

  return Object.entries(counts)
    .map(([name, value]) => ({ name, value }))
    .sort((left, right) => right.value - left.value)
    .slice(0, 6);
};
