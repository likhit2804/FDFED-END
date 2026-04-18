import React from "react";

const toTone = (iconColor = "") => {
  const normalized = String(iconColor).toLowerCase();
  if (normalized.includes("danger") || normalized.includes("reject") || normalized.includes("overdue")) {
    return "danger";
  }
  return "brand";
};

/**
 * StatCard - shared summary card with icon, label, and value
 *
 * Props:
 *   icon      {ReactNode} - Lucide or Bootstrap icon element
 *   label     {string}
 *   value     {string|number}
 *   iconColor {string}   - CSS color for icon, default var(--info-600)
 *   loading   {boolean}  - shows dash instead of value while loading
 */
const StatCard = ({
  icon,
  label,
  value,
  iconColor = "var(--info-600)",
  loading = false,
}) => {
  const tone = toTone(iconColor);

  const toneColor = tone === "danger" ? "var(--danger-500)" : "var(--brand-500)";

  const toneBg = tone === "danger" ? "var(--danger-soft)" : "var(--info-soft)";

  const resolvedBg = toneBg;

  return (
    <div className="ue-stat-card">
      <div
        className="ue-stat-card__icon"
        style={{ background: resolvedBg, color: toneColor }}
      >
        {icon}
      </div>
      <p className="ue-stat-card__label">{label}</p>
      <p className="ue-stat-card__value">{loading ? "-" : (value ?? 0)}</p>
    </div>
  );
};

export default StatCard;
