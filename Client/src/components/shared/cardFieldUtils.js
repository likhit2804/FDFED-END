const DATE_LABEL_PATTERN = /\b(date|time|deadline|created|updated|raised|start|end|valid till|validity|expires?|expiry)\b/i;
const EMPTY_PATTERN = /^(?:-|n\/a|na|none|not set|unknown)$/i;

function isRenderableNode(value) {
  if (value instanceof Date) {
    return false;
  }

  return typeof value === "object" && value !== null;
}

function toDisplayText(value) {
  if (value instanceof Date) {
    return value.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
  }

  if (typeof value === "boolean") {
    return value ? "Yes" : "No";
  }

  if (value === null || value === undefined) {
    return "-";
  }

  return String(value).trim() || "-";
}

export function getCardFieldPresentation(label, value) {
  if (isRenderableNode(value)) {
    return {
      displayValue: value,
      tone: "neutral",
      showIndicator: false,
      wide: false,
      primitive: false,
    };
  }

  const displayText = toDisplayText(value);
  const lowerText = displayText.toLowerCase();
  const isDateLabel = DATE_LABEL_PATTERN.test(label || "");

  let tone = "neutral";
  let showIndicator = false;

  if (EMPTY_PATTERN.test(displayText)) {
    tone = "empty";
  } else if (lowerText === "yes" || lowerText === "true") {
    tone = "yes";
    showIndicator = true;
  } else if (lowerText === "no" || lowerText === "false") {
    tone = "no";
    showIndicator = true;
  } else if (isDateLabel) {
    tone = "date";
    showIndicator = true;
  }

  const wide =
    typeof displayText === "string" &&
    displayText.length > 26 &&
    !showIndicator;

  return {
    displayValue: displayText,
    tone,
    showIndicator,
    wide,
    primitive: true,
  };
}
