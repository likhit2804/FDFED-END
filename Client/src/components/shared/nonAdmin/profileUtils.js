const toCleanText = (value) => String(value ?? "").trim();

export const buildDisplayName = (...parts) =>
  parts
    .map(toCleanText)
    .filter(Boolean)
    .join(" ");

export const getInitials = (value, fallback = "?") => {
  const raw = Array.isArray(value) ? value.join(" ") : value;
  const tokens = toCleanText(raw)
    .split(/\s+/)
    .filter(Boolean);

  if (!tokens.length) return fallback;

  return tokens
    .slice(0, 2)
    .map((token) => token[0].toUpperCase())
    .join("");
};
