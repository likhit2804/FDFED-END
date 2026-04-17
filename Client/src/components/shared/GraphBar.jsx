import React from 'react';
import {
    ResponsiveContainer, BarChart, Bar, CartesianGrid,
    XAxis, YAxis, Tooltip, Legend, Cell,
} from 'recharts';
import Card from './Card';

/**
 * GraphBar – bar chart for user pages (no Admin equivalent — new component)
 *
 * Props:
 *   data     {Array}
 *   bars     {Array<{key, label, color}>}
 *   xKey     {string}  default 'x'
 *   title    {string}
 *   subtitle {string}
 *   height   {number}  default 240
 *   grid     {boolean} default true
 *   radius   {number}  bar border-radius, default 6
 */
const GraphBar = ({
    data = [],
    bars = [],
    xKey = 'x',
    title,
    subtitle,
    height = 240,
    grid = true,
    radius = 6,
}) => (
    <Card shadow="md" style={{ padding: '20px 24px' }}>
        {title && (
            <div style={{ marginBottom: 16 }}>
                <h4 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#1f2937' }}>{title}</h4>
                {subtitle && <p style={{ margin: '4px 0 0', fontSize: 12, color: '#6b7280' }}>{subtitle}</p>}
            </div>
        )}
        <ResponsiveContainer width="100%" height={height}>
            <BarChart data={data} barGap={4}>
                {grid && <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />}
                <XAxis dataKey={xKey} tick={{ fontSize: 12, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                <Tooltip
                    contentStyle={{ borderRadius: 10, border: '1px solid #e5e7eb', fontSize: 13 }}
                    cursor={{ fill: '#f9fafb' }}
                />
                {bars.length > 1 && <Legend wrapperStyle={{ fontSize: 13 }} />}
                {bars.map(({ key, label, color = '#2563eb' }) => (
                    <Bar key={key} dataKey={key} name={label || key} fill={color} radius={[radius, radius, 0, 0]} />
                ))}
            </BarChart>
        </ResponsiveContainer>
    </Card>
);

export default GraphBar;
