import React, { useRef, useState, useEffect } from "react";

/**
 * 6-digit OTP input with auto-focus, backspace navigation, and paste support.
 */
export const OtpInput = ({ digits, setDigits }) => {
    const refs = useRef([]);

    const handleChange = (index) => (e) => {
        const val = e.target.value.replace(/\D/g, "");
        setDigits((prev) => {
            const next = [...prev];
            next[index] = val ? val[0] : "";
            return next;
        });
        if (val && index < 5) refs.current?.[index + 1]?.focus();
    };

    const handleKeyDown = (index) => (e) => {
        if (e.key === "Backspace") {
            if (digits[index]) {
                setDigits((prev) => { const next = [...prev]; next[index] = ""; return next; });
            } else if (index > 0) {
                refs.current?.[index - 1]?.focus();
                setDigits((prev) => { const next = [...prev]; next[index - 1] = ""; return next; });
            }
        } else if (e.key === "ArrowLeft" && index > 0) refs.current?.[index - 1]?.focus();
        else if (e.key === "ArrowRight" && index < 5) refs.current?.[index + 1]?.focus();
    };

    const handlePaste = (e) => {
        const text = e.clipboardData.getData("text");
        const d = text.replace(/\D/g, "").slice(0, 6).split("");
        if (!d.length) return;
        e.preventDefault();
        const next = Array(6).fill("");
        for (let i = 0; i < d.length; i++) next[i] = d[i];
        setDigits(next);
        setTimeout(() => refs.current?.[Math.min(d.length, 5)]?.focus(), 0);
    };

    return (
        <div className="otp-inputs" onPaste={handlePaste} style={{ display: "flex", gap: 8, justifyContent: "center", marginBottom: 8 }}>
            {digits.map((d, i) => (
                <input
                    key={i} type="text" inputMode="numeric" pattern="[0-9]*" maxLength={1}
                    value={d} onChange={handleChange(i)} onKeyDown={handleKeyDown(i)}
                    ref={(el) => (refs.current[i] = el)} onFocus={(e) => e.target.select()}
                    style={{ width: 40, height: 48, textAlign: "center", fontSize: "1.25rem", borderRadius: 6, border: "1px solid #ccc" }}
                    aria-label={`Digit ${i + 1}`}
                />
            ))}
        </div>
    );
};
