import React from "react";
import "../../../assets/css/role/shell.css";
import { getCardFieldPresentation } from "../cardFieldUtils";

function joinClassNames(...classNames) {
  return classNames.filter(Boolean).join(" ");
}

export function RolePageShell({
  eyebrow,
  title,
  actions,
  children,
  className = "",
}) {
  return (
    <main className={joinClassNames("manager-ui-page", className)}>
      <div className="manager-ui-page__inner">
        <section className="manager-ui-hero">
          <div className="manager-ui-hero__copy">
            {eyebrow ? <div className="manager-ui-hero__eyebrow">{eyebrow}</div> : null}
            <h1 className="manager-ui-hero__title">{title}</h1>
            {/* Intentionally hide hero meta lines (description + chips) across role pages. */}
          </div>

          {actions ? <div className="manager-ui-hero__actions">{actions}</div> : null}
        </section>

        {children}
      </div>
    </main>
  );
}

export function RoleSection({
  eyebrow,
  title,
  description,
  actions,
  children,
  className = "",
  muted = false,
}) {
  return (
    <section className={joinClassNames("manager-ui-section", muted ? "manager-ui-section--muted" : "", className)}>
      {(eyebrow || title || description || actions) && (
        <div className="manager-ui-section__header">
          <div>
            {eyebrow ? <div className="manager-ui-section__eyebrow">{eyebrow}</div> : null}
            {title ? <h2 className="manager-ui-section__title">{title}</h2> : null}
            {description ? <p className="manager-ui-section__description">{description}</p> : null}
          </div>
          {actions ? <div className="manager-ui-section__actions">{actions}</div> : null}
        </div>
      )}
      {children}
    </section>
  );
}

export function RoleToolbar({ children, className = "" }) {
  return <div className={joinClassNames("manager-ui-toolbar", className)}>{children}</div>;
}

export function RoleToolbarGrow({ children, className = "" }) {
  return <div className={joinClassNames("manager-ui-toolbar__grow", className)}>{children}</div>;
}

export function RoleRecordGrid({ children, className = "" }) {
  return <div className={joinClassNames("manager-ui-record-grid", className)}>{children}</div>;
}

export function RoleRecordCard({
  title,
  subtitle,
  status,
  media,
  meta = [],
  actions,
  footer,
  className = "",
}) {
  return (
    <article className={joinClassNames("manager-ui-record-card", className)}>
      {media ? <div className="manager-ui-record-card__media">{media}</div> : null}

      <div className="manager-ui-record-card__header">
        <div>
          <h3 className="manager-ui-record-card__title">{title}</h3>
          {subtitle ? <p className="manager-ui-record-card__subtitle">{subtitle}</p> : null}
        </div>
        {status ? <div className="manager-ui-record-card__status">{status}</div> : null}
      </div>

      {meta.length > 0 ? (
        <div className="manager-ui-record-card__meta">
          {meta.map((item, index) => (
            (() => {
              const field = getCardFieldPresentation(item.label, item.value);
              return (
                <div
                  key={`${item.label}-${index}`}
                  className={joinClassNames(
                    "manager-ui-record-card__meta-row",
                    `manager-ui-record-card__meta-row--${field.tone}`,
                    field.wide ? "manager-ui-record-card__meta-row--wide" : ""
                  )}
                >
                  <span className="manager-ui-record-card__meta-label">{item.label}</span>
                  <div className="manager-ui-record-card__meta-value">
                    {field.showIndicator ? (
                      <span
                        className={joinClassNames(
                          "manager-ui-record-card__indicator",
                          `manager-ui-record-card__indicator--${field.tone}`
                        )}
                        aria-hidden="true"
                      />
                    ) : null}
                    <strong>{field.displayValue}</strong>
                  </div>
                </div>
              );
            })()
          ))}
        </div>
      ) : null}

      {footer ? <div className="manager-ui-record-card__footer">{footer}</div> : null}

      {actions ? <div className="manager-ui-record-card__actions">{actions}</div> : null}
    </article>
  );
}

export function RoleActionButton({
  children,
  onClick,
  variant = "secondary",
  type = "button",
  disabled = false,
  className = "",
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={joinClassNames("manager-ui-button", `manager-ui-button--${variant}`, className)}
    >
      {children}
    </button>
  );
}

/* Backward-compatible aliases so existing non-admin pages need no immediate rewrites */
export const ManagerPageShell = RolePageShell;
export const ManagerSection = RoleSection;
export const ManagerToolbar = RoleToolbar;
export const ManagerToolbarGrow = RoleToolbarGrow;
export const ManagerRecordGrid = RoleRecordGrid;
export const ManagerRecordCard = RoleRecordCard;
export const ManagerActionButton = RoleActionButton;
