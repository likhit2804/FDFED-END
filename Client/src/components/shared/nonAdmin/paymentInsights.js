export const PAYMENT_STATUS_OPTIONS = [
  { label: "All Status", value: "all" },
  { label: "Completed", value: "completed" },
  { label: "Pending", value: "pending" },
  { label: "Overdue", value: "overdue" },
];

export const PAYMENT_TYPE_OPTIONS = [
  { label: "All Types", value: "all" },
  { label: "Maintenance", value: "maintenance" },
  { label: "Subscription", value: "subscription" },
  { label: "Booking", value: "booking" },
];

export const formatCurrencyINR = (amount) => {
  if (amount === null || amount === undefined || amount === "") return "-";
  return `\u20B9${amount}`;
};

export const formatPaymentDateTime = (iso) => {
  if (!iso) return "-";
  try {
    return new Date(iso).toLocaleString();
  } catch (error) {
    return iso;
  }
};

export const formatPaymentDateShort = (iso) => {
  if (!iso) return "-";
  try {
    const date = new Date(iso);
    return date.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
  } catch (error) {
    return iso;
  }
};

const getByKeys = (record, keys = []) => keys.map((key) => record?.[key]);

export const filterPaymentsByFilters = (
  payments = [],
  filters = {},
  {
    searchFields = [],
    statusFields = ["status", "paymentStatus"],
    typeFields = ["planType", "type", "paymentType"],
  } = {},
) => {
  const { search = "", status = "all", type = "all" } = filters;
  const normalizedSearch = String(search || "").trim().toLowerCase();

  return payments.filter((payment) => {
    if (normalizedSearch) {
      const matchesSearch = getByKeys(payment, searchFields)
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(normalizedSearch));

      if (!matchesSearch) return false;
    }

    if (status !== "all") {
      const currentStatus = getByKeys(payment, statusFields)
        .find((value) => value !== null && value !== undefined);
      if (String(currentStatus || "").toLowerCase() !== status.toLowerCase()) return false;
    }

    if (type !== "all") {
      const currentType = getByKeys(payment, typeFields)
        .find((value) => value !== null && value !== undefined);
      if (String(currentType || "").toLowerCase() !== type.toLowerCase()) return false;
    }

    return true;
  });
};

export const computePaymentStats = (payments = []) => {
  const overduePayments = payments.filter((payment) => (payment.status || "").toLowerCase() === "overdue");
  const pendingPayments = payments.filter((payment) => (payment.status || "").toLowerCase() === "pending");
  const completedPayments = payments.filter((payment) => (payment.status || "").toLowerCase() === "completed");

  return {
    overdueCount: overduePayments.length,
    pendingCount: pendingPayments.length,
    completedCount: completedPayments.length,
    totalBills: payments.length,
    overdueAmount: overduePayments.reduce((sum, payment) => sum + (payment.amount || 0), 0),
    pendingAmount: pendingPayments.reduce((sum, payment) => sum + (payment.amount || 0), 0),
    paidAmount: completedPayments.reduce((sum, payment) => sum + (payment.amount || 0), 0),
    totalTransactions: payments.length,
  };
};

export const buildPaymentStatusAmountData = (records = []) => {
  const buckets = records.reduce((accumulator, payment) => {
    const key = String(payment?.status || "Unknown").toLowerCase();
    const normalized = key.charAt(0).toUpperCase() + key.slice(1);
    accumulator[normalized] = (accumulator[normalized] || 0) + Number(payment?.amount || 0);
    return accumulator;
  }, {});

  return Object.entries(buckets).map(([name, amount]) => ({ name, amount }));
};

export const buildPaymentTypeSplitData = (records = []) => {
  const bucket = records.reduce((accumulator, payment) => {
    const typeLabel = payment?.paymentType || payment?.type || "Other";
    accumulator[typeLabel] = (accumulator[typeLabel] || 0) + 1;
    return accumulator;
  }, {});

  return Object.entries(bucket).map(([name, value]) => ({ name, value }));
};
