import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import Card from './Card';

/**
 * GraphPie – donut/pie chart for user pages (mirrors Admin/GraphPie)
 *
 * Props:
 *   data        {Array<{name, value}>}
 *   colors      {Array<string>}
 *   title       {string}
 *   subtitle    {string}
 *   innerRadius {number}  default 60 (0 = plain pie)
 *   outerRadius {number}  default 95
 *   height      {number}  default 240
 *   dataKey     {string}  default 'value'
 *   nameKey     {string}  default 'name'
 */
const DEFAULT_COLORS = ['#2563eb', '#16a34a', '#d97706', '#dc2626', '#7c3aed', '#0891b2'];

const GraphPie = ({
    data = [],
    colors = DEFAULT_COLORS,
    title,
    subtitle,
    innerRadius = 60,
    outerRadius = 95,
    height = 240,
    dataKey = 'value',
    nameKey = 'name',
}) => (
    <Card shadow="md" style={{ padding: '20px 24px' }}>
        {title && (
            <div style={{ marginBottom: 16 }}>
                <h4 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#1f2937' }}>{title}</h4>
                {subtitle && <p style={{ margin: '4px 0 0', fontSize: 12, color: '#6b7280' }}>{subtitle}</p>}
            </div>
        )}
        <ResponsiveContainer width="100%" height={height}>
            <PieChart>
                <Pie
                    data={data}
                    dataKey={dataKey}
                    nameKey={nameKey}
                    cx="50%" cy="50%"
                    innerRadius={innerRadius}
                    outerRadius={outerRadius}
                    paddingAngle={3}
                >
                    {data.map((_, i) => (
                        <Cell key={i} fill={colors[i % colors.length]} />
                    ))}
                </Pie>
                <Tooltip
                    contentStyle={{ borderRadius: 10, border: '1px solid #e5e7eb', fontSize: 13 }}
                />
                <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontSize: 13 }} />
            </PieChart>
        </ResponsiveContainer>
    </Card>
);

export default GraphPie;
