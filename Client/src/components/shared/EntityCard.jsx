import React from "react";
import { motion } from "framer-motion";
import { getCardFieldPresentation } from "./cardFieldUtils";

/**
 * EntityCard — unified card component used across all pages.
 *
 * Props:
 *   id          {string}                     — display ID (e.g. "#ABC123")
 *   status      {string}                     — status text for the badge
 *   statusClass {string}                     — optional custom CSS class for status badge
 *   title       {string}                     — optional title line below header
 *   details     {Array<{label, value, render}>} — detail rows
 *   actions     {Array<{label, onClick, variant, icon, show?, disabled?}>} — action buttons
 *   onClick     {function}                   — card click handler
 *   className   {string}                     — optional extra class on the card
 *   badges      {ReactNode|Array}            — optional extra badges in header (e.g. priority)
 *   animateFrom {'y'|'x'}                    — animation direction (default 'y')
 *   index       {number}                     — for stagger delay (default 0)
 *   compact     {boolean}                    — compact/list mode
 *   children    {ReactNode}                  — optional extra content at the bottom
 */
export const EntityCard = ({
    id,
    status,
    statusClass,
    title,
    details = [],
    actions = [],
    onClick,
    className = "",
    badges,
    animateFrom = "y",
    index = 0,
    compact = false,
    children,
}) => {
    const initial = animateFrom === "x" ? { opacity: 0, x: -20 } : { opacity: 0, y: 20 };
    const animate = { opacity: 1, x: 0, y: 0 };
    const badgeClass =
        statusClass ||
        `status-badge ${(status || "").toLowerCase().replace(/[\s()]/g, "-")}`;

    return (
        <motion.div
            className={`ue-entity-card ${className}`}
            initial={initial}
            animate={animate}
            exit={{ opacity: 0, ...(animateFrom === "x" ? { x: 20 } : { y: -20 }) }}
            transition={{ delay: index * (compact ? 0.05 : 0.1) }}
            onClick={onClick}
            style={compact ? { cursor: onClick ? "pointer" : undefined } : undefined}
        >
            {/* Header: ID + status + optional extra badges */}
            <div className="ue-entity-card__header">
                <span className="ue-entity-card__id">{id}</span>
                <div className="ue-entity-card__badges">
                    <span className={badgeClass}>{status || "Unknown"}</span>
                    {badges}
                </div>
            </div>

            {/* Optional title */}
            {title && <h3 className="ue-entity-card__title">{title}</h3>}

            {/* Detail rows — data-driven */}
            {details.length > 0 && (
                <div className="ue-entity-card__details">
                    {details.map(({ label, value, render }, i) => {
                        const resolvedValue = render ? render() : value;
                        const field = getCardFieldPresentation(label, resolvedValue);

                        return (
                            <div
                                className={`ue-entity-card__detail ue-entity-card__detail--${field.tone}${field.wide ? " ue-entity-card__detail--wide" : ""}`}
                                key={label || i}
                            >
                                <span className="ue-entity-card__label">{label}</span>
                                <div className="ue-entity-card__value-wrap">
                                    {field.showIndicator ? (
                                        <span
                                            className={`ue-entity-card__indicator ue-entity-card__indicator--${field.tone}`}
                                            aria-hidden="true"
                                        />
                                    ) : null}
                                    <span className="ue-entity-card__value">{field.displayValue}</span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {children}

            {/* Action buttons */}
            {actions.length > 0 && (
                <div className="ue-entity-card__actions">
                    {actions
                        .filter((a) => a.show !== false)
                        .map(({ label, onClick: onAct, variant = "secondary", icon, disabled }) => (
                            <button
                                key={label}
                                className={`action-btn ${variant}`}
                                disabled={disabled}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onAct?.();
                                }}
                            >
                                {icon} {label}
                            </button>
                        ))}
                </div>
            )}
        </motion.div>
    );
};
