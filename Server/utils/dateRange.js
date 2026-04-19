const ISO_DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;

function parseQueryDate(value, { endOfDay = false } = {}) {
  if (!value) return null;

  const raw = String(value).trim();
  if (!raw) return null;

  const date = ISO_DATE_ONLY.test(raw) ? new Date(`${raw}T00:00:00.000Z`) : new Date(raw);
  if (Number.isNaN(date.getTime())) return null;

  if (endOfDay) {
    date.setUTCHours(23, 59, 59, 999);
  } else {
    date.setUTCHours(0, 0, 0, 0);
  }
  return date;
}

export function parseDateRangeFromQuery(query = {}) {
  const hasFrom = query.from !== undefined && query.from !== null && String(query.from).trim() !== "";
  const hasTo = query.to !== undefined && query.to !== null && String(query.to).trim() !== "";

  if (!hasFrom && !hasTo) {
    return { hasRange: false, range: null, from: null, to: null };
  }

  const from = parseQueryDate(query.from, { endOfDay: false });
  const to = parseQueryDate(query.to, { endOfDay: true });

  if (hasFrom && !from) {
    return { error: "Invalid 'from' date. Use YYYY-MM-DD." };
  }
  if (hasTo && !to) {
    return { error: "Invalid 'to' date. Use YYYY-MM-DD." };
  }

  const resolvedFrom = from || new Date(0);
  const resolvedTo = to || new Date();

  if (resolvedFrom.getTime() > resolvedTo.getTime()) {
    return { error: "'from' date must be less than or equal to 'to' date." };
  }

  return {
    hasRange: true,
    range: {
      $gte: resolvedFrom,
      $lte: resolvedTo,
    },
    from: resolvedFrom.toISOString(),
    to: resolvedTo.toISOString(),
  };
}

export function withDateRangeMatch(baseMatch = {}, fieldName, range) {
  if (!range) return { ...baseMatch };
  return {
    ...baseMatch,
    [fieldName]: range,
  };
}

