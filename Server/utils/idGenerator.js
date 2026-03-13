/**
 * Centralised ID & Transaction ID Generators — Urban Ease
 *
 * Single source of truth for all custom IDs generated across the platform.
 * Import from here instead of writing inline Math.random() id strings.
 */

// ─────────────────────────────────────────────────────────────
// Internal helper
// ─────────────────────────────────────────────────────────────

/**
 * Returns a zero-padded 4-digit random suffix, or pads a given count.
 * @param {number|null} countOrRandom
 * @returns {string} e.g. "0042" or "6719"
 */
function numericSuffix(countOrRandom = null) {
    return countOrRandom !== null && countOrRandom !== undefined
        ? String(countOrRandom).padStart(4, "0")
        : String(Math.floor(1000 + Math.random() * 9000));
}

// ─────────────────────────────────────────────────────────────
// CSB / Common Space IDs
// ─────────────────────────────────────────────────────────────

/**
 * Generic custom ID used for bookings, payments, refunds, etc.
 * Format: `<BASE_UPPER>-<PREFIX_2CHAR>-<4DIGIT_SUFFIX>`
 *
 * @param {string} base           - Source value (e.g. Mongo ObjectId string or email)
 * @param {string} prefix         - 2-char category code, e.g. "CS", "PY", "RF"
 * @param {number|null} countOrRandom
 * @returns {string} e.g. "64A3F1-CS-4291"
 */
export function generateCustomID(base, prefix, countOrRandom = null) {
    const code = String(base).toUpperCase().trim().slice(0, 8);
    const prefixCode = String(prefix).toUpperCase().slice(0, 2);
    return `${code}-${prefixCode}-${numericSuffix(countOrRandom)}`;
}

// ─────────────────────────────────────────────────────────────
// Visitor IDs
// ─────────────────────────────────────────────────────────────

/**
 * Generates a visitor pass ID.
 * Format: `UE-<2CHAR>PA<4DIGIT_SUFFIX>`
 *
 * @param {string}      base   - Source value (e.g. Mongo ObjectId string or name)
 * @param {number|null} suffix
 * @returns {string} e.g. "UE-64PA4291"
 */
export function generateVisitorID(base, suffix = null) {
    const id = String(base).toUpperCase().slice(0, 2);
    return `UE-${id}PA${numericSuffix(suffix)}`;
}

// ─────────────────────────────────────────────────────────────
// Transaction IDs
// ─────────────────────────────────────────────────────────────

/**
 * Generates a unique transaction / payment ID.
 * Format: `<PREFIX>_<TIMESTAMP>_<9CHAR_ALPHANUMERIC>`
 *
 * @param {string} prefix - e.g. "TXN", "PLAN_CHANGE", "REFUND"
 * @returns {string} e.g. "TXN_1735123456789_abc123xyz"
 */
export function generateTransactionId(prefix = "TXN") {
    const ts = Date.now();
    const rand = Math.random().toString(36).substr(2, 9);
    return `${prefix}_${ts}_${rand}`;
}

// ─────────────────────────────────────────────────────────────
// Refund IDs  (thin wrapper kept for semantic clarity)
// ─────────────────────────────────────────────────────────────

/**
 * Generates a refund ID tied to an existing booking/payment base.
 * @param {string} base - e.g. booking ObjectId string
 * @returns {string} e.g. "64A3F1C2-RF-8832"
 */
export function generateRefundId(base) {
    return generateCustomID(base, "RF");
}
