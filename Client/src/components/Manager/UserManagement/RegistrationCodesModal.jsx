import React, { useMemo } from "react";
import { Check, Copy, Home, Key, Layers, RefreshCw } from "lucide-react";

import { Loader } from "../../Loader";
import { Modal, SearchBar } from "../../shared";
import "./registrationCodesModal.css";

const normalize = (value) => String(value ?? "").toLowerCase();

const occupancyTone = (status) => {
  const normalized = normalize(status);
  if (normalized === "vacant") return "vacant";
  if (normalized === "occupied") return "occupied";
  return "neutral";
};

function SelectionCheckbox({ checked, onChange, label }) {
  return (
    <label className="rcm-checkbox" aria-label={label}>
      <input type="checkbox" checked={checked} onChange={onChange} />
      <span className="rcm-checkbox__box">{checked ? <Check size={12} strokeWidth={3} /> : null}</span>
    </label>
  );
}

export const RegistrationCodesModal = ({
  visible,
  onClose,
  communityName,
  codesList,
  codesLoading,
  codesSearch,
  setCodesSearch,
  selectedFlats,
  toggleSelectFlat,
  toggleSelectAll,
  regenerateCode,
  isRegenerating,
  copyToClipboard,
}) => {
  if (!visible) return null;

  const filtered = useMemo(() => {
    const query = normalize(codesSearch).trim();
    if (!query) return codesList;

    return codesList.filter((flat) => {
      const flatNumber = normalize(flat?.flatNumber);
      const block = normalize(flat?.block);
      return flatNumber.includes(query) || block.includes(query);
    });
  }, [codesList, codesSearch]);

  const selectedVisibleCount = useMemo(
    () => filtered.filter((flat) => selectedFlats.has(flat.flatNumber)).length,
    [filtered, selectedFlats]
  );
  const allSelected = filtered.length > 0 && selectedVisibleCount === filtered.length;

  return (
    <Modal isOpen={visible} onClose={onClose} title="Registration Codes" size="xl">
      <div className="rcm">
        <div className="rcm__header">
          <div className="rcm__identity">
            <span className="rcm__identity-icon">
              <Key size={16} />
            </span>
            <div>
              <p className="rcm__eyebrow">Community access desk</p>
              <p className="rcm__community">{communityName || "Current community"}</p>
            </div>
          </div>
          <div className="rcm__stats">
            <span className="manager-ui-status-pill">{filtered.length} flats</span>
            <span className="manager-ui-status-pill">{selectedFlats.size} selected</span>
          </div>
        </div>

        <div className="manager-ui-toolbar rcm__toolbar">
          <div className="manager-ui-toolbar__grow">
            <SearchBar placeholder="Search by flat number or block..." value={codesSearch} onChange={setCodesSearch} />
          </div>
          {codesSearch ? (
            <button type="button" className="manager-ui-button manager-ui-button--secondary" onClick={() => setCodesSearch("")}>
              Clear
            </button>
          ) : null}
          <button
            type="button"
            className="manager-ui-button manager-ui-button--primary"
            disabled={selectedFlats.size === 0 || isRegenerating}
            onClick={() => regenerateCode(null, Array.from(selectedFlats))}
          >
            <RefreshCw size={15} className={isRegenerating ? "rcm__spin" : ""} />
            {isRegenerating ? "Regenerating..." : `Regenerate (${selectedFlats.size})`}
          </button>
        </div>

        {codesLoading ? (
          <div className="manager-ui-empty"><Loader label="Fetching registration codes..." /></div>
        ) : (
          <div className="rcm__table-wrap">
            <table className="rcm__table">
              <thead>
                <tr>
                  <th className="rcm__check-col">
                    <SelectionCheckbox
                      checked={allSelected}
                      onChange={() => toggleSelectAll(filtered)}
                      label="Select all visible flats"
                    />
                  </th>
                  <th>Flat</th>
                  <th>Occupancy</th>
                  <th>Registration code</th>
                  <th className="rcm__action-col">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((flat) => {
                  const isSelected = selectedFlats.has(flat.flatNumber);

                  return (
                    <tr key={flat.flatNumber} className={isSelected ? "rcm__row rcm__row--selected" : "rcm__row"}>
                      <td className="rcm__check-col">
                        <SelectionCheckbox
                          checked={isSelected}
                          onChange={() => toggleSelectFlat(flat.flatNumber)}
                          label={`Select ${flat.flatNumber}`}
                        />
                      </td>
                      <td>
                        <div className="rcm__flat-primary">
                          <Home size={14} />
                          <strong>{flat.flatNumber || "-"}</strong>
                        </div>
                        <div className="rcm__flat-secondary">
                          <span>{flat.block || "-"}</span>
                          <span className="rcm__dot" />
                          <Layers size={12} />
                          <span>Floor {flat.floor ?? "-"}</span>
                        </div>
                      </td>
                      <td>
                        <span className={`rcm__status rcm__status--${occupancyTone(flat.status)}`}>{flat.status || "Unknown"}</span>
                      </td>
                      <td>
                        <div className="rcm__code-wrap">
                          <code className="rcm__code">{flat.registrationCode || "— —"}</code>
                          {flat.registrationCode ? (
                            <button
                              type="button"
                              className="rcm__icon-button"
                              title="Copy code"
                              aria-label={`Copy code for ${flat.flatNumber}`}
                              onClick={() => copyToClipboard(flat.registrationCode)}
                            >
                              <Copy size={14} />
                            </button>
                          ) : null}
                        </div>
                      </td>
                      <td className="rcm__action-col">
                        <button
                          type="button"
                          className="manager-ui-button manager-ui-button--ghost rcm__row-action"
                          onClick={() => regenerateCode(flat.flatNumber)}
                          disabled={isRegenerating}
                        >
                          <RefreshCw size={14} className={isRegenerating ? "rcm__spin" : ""} />
                          Regenerate
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {filtered.length === 0 ? <div className="manager-ui-empty rcm__empty">No flats match your search.</div> : null}
          </div>
        )}

        <div className="rcm__footer-note">
          <p>{selectedVisibleCount} of {filtered.length} visible flats selected.</p>
        </div>
      </div>
    </Modal>
  );
};
