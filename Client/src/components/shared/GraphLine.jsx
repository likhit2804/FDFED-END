import React from 'react';
import {
    ResponsiveContainer, LineChart, AreaChart,
    Line, Area, CartesianGrid, XAxis, YAxis, Tooltip, Legend,
} from 'recharts';
import Card from './Card';

/**
 * GraphLine – line/area chart for user pages (mirrors Admin/GraphLine)
 *
 * Props:
 *   data      {Array}
 *   lines     {Array<{key, label, color}>}  – multiple lines support
 *   xKey      {string}   default 'x'
 *   title     {string}
 *   subtitle  {string}
 *   showArea  {boolean}  area-fill underneath, default false
 *   height    {number}   default 240
 *   grid      {boolean}  default true
 *   smooth    {boolean}  default true
 */
const GraphLine = ({
    data = [],
    lines = [],
    xKey = 'x',
    title,
    subtitle,
    showArea = false,
    height = 240,
    grid = true,
    smooth = true,
}) => {
    // Fallback: if caller passes a single yKey instead of lines array
    const resolvedLines = lines.length > 0 ? lines : [];

    const ChartComp = showArea ? AreaChart : LineChart;
    const SeriesComp = showArea ? Area : Line;

    return (
        <Card shadow="md" style={{ padding: '20px 24px' }}>
            {title && (
                <div style={{ marginBottom: 16 }}>
                    <h4 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#1f2937' }}>{title}</h4>
                    {subtitle && <p style={{ margin: '4px 0 0', fontSize: 12, color: '#6b7280' }}>{subtitle}</p>}
                </div>
            )}
            <ResponsiveContainer width="100%" height={height}>
                <ChartComp data={data}>
                    {grid && <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />}
                    <XAxis dataKey={xKey} tick={{ fontSize: 12, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 12, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                    <Tooltip
                        contentStyle={{ borderRadius: 10, border: '1px solid #e5e7eb', fontSize: 13 }}
                        cursor={{ stroke: '#e5e7eb', strokeWidth: 1 }}
                    />
                    {resolvedLines.length > 1 && <Legend wrapperStyle={{ fontSize: 13 }} />}
                    {resolvedLines.map(({ key, label, color = '#2563eb' }) => (
                        <SeriesComp
                            key={key}
                            type={smooth ? 'monotone' : 'linear'}
                            dataKey={key}
                            name={label || key}
                            stroke={color}
                            fill={showArea ? `${color}22` : undefined}
                            strokeWidth={2.5}
                            dot={{ fill: color, r: 3 }}
                        />
                    ))}
                </ChartComp>
            </ResponsiveContainer>
        </Card>
    );
};

export default GraphLine;
