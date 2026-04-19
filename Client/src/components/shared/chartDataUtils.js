const toLabel = (value, fallback = "Unknown") => {
  const text = String(value ?? "").trim();
  return text || fallback;
};

/**
 * Build chart-ready categorical counts in stable order.
 * - Known categories are returned first in `order`.
 * - Remaining dynamic categories are appended alphabetically.
 */
export const buildCategoryCountData = (
  items = [],
  getCategory = () => "Unknown",
  {
    order = [],
    fallback = "Unknown",
    includeZero = false,
    normalize,
  } = {},
) => {
  const counts = items.reduce((bucket, item) => {
    const raw = toLabel(getCategory(item), fallback);
    const key = toLabel(normalize ? normalize(raw, item) : raw, fallback);
    bucket[key] = (bucket[key] || 0) + 1;
    return bucket;
  }, {});

  const seen = new Set();
  const orderedKeys = [];

  order.forEach((rawKey) => {
    const key = toLabel(rawKey, fallback);
    const count = counts[key] || 0;
    if ((includeZero || count > 0) && !seen.has(key)) {
      orderedKeys.push(key);
      seen.add(key);
    }
  });

  const remainingKeys = Object.keys(counts)
    .filter((key) => !seen.has(key))
    .sort((left, right) => left.localeCompare(right));

  return [...orderedKeys, ...remainingKeys].map((name) => ({
    name,
    value: counts[name] || 0,
  }));
};
