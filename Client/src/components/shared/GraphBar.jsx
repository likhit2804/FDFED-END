
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend
} from "recharts";
import {
  UE_CHART_AXIS,
  UE_CHART_CURSOR,
  UE_CHART_GRID,
  UE_CHART_PALETTE,
  UE_CHART_TOOLTIP_BORDER
} from "./chartPalette";
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
    xAngle = -20,
    xHeight = 50,
    xInterval = 0,
}) => (
    <div style={{ width: '100%' }}>
        {title && (
            <div style={{ marginBottom: 12 }}>
                <h4 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#0f172a' }}>{title}</h4>
                {subtitle && <p style={{ margin: '3px 0 0', fontSize: 12, color: '#64748b' }}>{subtitle}</p>}
            </div>
        )}
        <ResponsiveContainer width="100%" height={height}>
            <BarChart
                data={data}
                barGap={4}
                margin={{ top: 10, right: 16, left: 0, bottom: xAngle !== 0 ? xHeight - 15 : 10 }}
            >
                {grid && <CartesianGrid strokeDasharray="3 3" stroke={UE_CHART_GRID} vertical={false} />}
                <XAxis
                    dataKey={xKey}
                    interval={xInterval}
                    angle={xAngle}
                    textAnchor={xAngle !== 0 ? "end" : "middle"}
                    height={xHeight}
                    tick={{ fontSize: 11, fill: UE_CHART_AXIS }}
                    tickFormatter={(val) => {
                        if (typeof val === 'string' && val.length > 18) {
                            return val.slice(0, 16) + '…';
                        }
                        return val;
                    }}
                    axisLine={{ stroke: '#e2e8f0' }}
                    tickLine={false}
                />
                <YAxis
                    tick={{ fontSize: 11, fill: UE_CHART_AXIS }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(val) => (val >= 1000 ? `₹${(val / 1000).toFixed(0)}k` : `₹${val}`)}
                />
                <Tooltip
                    contentStyle={{
                        borderRadius: 8,
                        border: `1px solid ${UE_CHART_TOOLTIP_BORDER}`,
                        fontSize: 12.5,
                        boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                    }}
                    formatter={(value, name) => [`₹${Number(value).toLocaleString()}`, name]}
                    labelFormatter={(label, payload) => {
                        const fullLabel = payload?.[0]?.payload?.fullX || label;
                        return fullLabel;
                    }}
                    cursor={{ fill: UE_CHART_CURSOR }}
                />
                {bars.length > 1 && <Legend wrapperStyle={{ fontSize: 12, paddingTop: 6 }} />}
                {bars.map(({ key, label, color }, index) => (
                    <Bar
                        key={key}
                        dataKey={key}
                        name={label || key}
                        fill={color || UE_CHART_PALETTE[index % UE_CHART_PALETTE.length]}
                        radius={[radius, radius, 0, 0]}
                    />
                ))}
            </BarChart>
        </ResponsiveContainer>
    </div>
);
export default GraphBar;
