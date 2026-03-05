import React from 'react';

/**
 * FilterBar – shared search + select filters row
 *
 * Props:
 *   searchValue      {string}
 *   searchPlaceholder {string}
 *   onSearchChange   {function}
 *   filters          {Array<{ value, onChange, options: [{value, label}] }>}
 *   right            {ReactNode} – optional right-side element (e.g. add button)
 */
const FilterBar = ({
    searchValue = '',
    searchPlaceholder = 'Search…',
    onSearchChange,
    filters = [],
    right,
}) => (
    <div className="ue-filter-bar">
        <input
            type="text"
            className="ue-filter-bar__search"
            placeholder={searchPlaceholder}
            value={searchValue}
            onChange={(e) => onSearchChange?.(e.target.value)}
        />

        {filters.map((f, i) => (
            <select
                key={i}
                className="ue-filter-bar__select"
                value={f.value}
                onChange={(e) => f.onChange?.(e.target.value)}
            >
                {(f.options || []).map((opt) => (
                    <option key={opt.value} value={opt.value}>
                        {opt.label}
                    </option>
                ))}
            </select>
        ))}

        {right && <div style={{ marginLeft: 'auto' }}>{right}</div>}
    </div>
);

export default FilterBar;
