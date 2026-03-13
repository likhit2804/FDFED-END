import React from 'react';
import StatusBadge from './StatusBadge';
import Card from './Card';

/**
 * DataTable – generic sortable table for user pages
 *
 * Props:
 *   columns  {Array<{key, label, width, render?, statusField?}>}
 *   rows     {Array<object>}
 *   loading  {boolean}
 *   emptyMsg {string}
 *   onRowClick {function(row)}
 *   keyField {string}  unique row key, default '_id'
 */
const DataTable = ({
    columns = [],
    rows = [],
    loading = false,
    emptyMsg = 'No data found.',
    onRowClick,
    keyField = '_id',
}) => (
    <Card noPad shadow="sm">
        <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
                <thead>
                    <tr style={{ borderBottom: '2px solid var(--ue-border, #e5e7eb)' }}>
                        {columns.map(col => (
                            <th
                                key={col.key}
                                style={{
                                    padding: '12px 16px',
                                    textAlign: 'left',
                                    fontWeight: 600,
                                    fontSize: 12,
                                    color: '#6b7280',
                                    letterSpacing: '0.5px',
                                    textTransform: 'uppercase',
                                    width: col.width,
                                    whiteSpace: 'nowrap',
                                    background: '#f9fafb',
                                }}
                            >
                                {col.label}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {loading ? (
                        <tr>
                            <td colSpan={columns.length} style={{ padding: '32px', textAlign: 'center', color: '#9ca3af' }}>
                                Loading…
                            </td>
                        </tr>
                    ) : rows.length === 0 ? (
                        <tr>
                            <td colSpan={columns.length} style={{ padding: '32px', textAlign: 'center', color: '#9ca3af' }}>
                                {emptyMsg}
                            </td>
                        </tr>
                    ) : (
                        rows.map((row, i) => (
                            <tr
                                key={row[keyField] || i}
                                onClick={() => onRowClick?.(row)}
                                style={{
                                    borderBottom: '1px solid var(--ue-border, #e5e7eb)',
                                    cursor: onRowClick ? 'pointer' : 'default',
                                    transition: 'background 0.15s',
                                }}
                                onMouseEnter={e => { if (onRowClick) e.currentTarget.style.background = '#f9fafb'; }}
                                onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
                            >
                                {columns.map(col => (
                                    <td key={col.key} style={{ padding: '12px 16px', verticalAlign: 'middle' }}>
                                        {col.render
                                            ? col.render(row[col.key], row)
                                            : col.statusField
                                                ? <StatusBadge status={row[col.key]} />
                                                : (row[col.key] ?? '—')}
                                    </td>
                                ))}
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
        </div>
    </Card>
);

export default DataTable;
