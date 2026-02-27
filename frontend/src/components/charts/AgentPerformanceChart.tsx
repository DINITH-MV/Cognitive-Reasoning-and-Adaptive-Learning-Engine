"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface DataPoint {
  label: string;
  value: number;
}

interface Props {
  data: DataPoint[];
  color?: string;
  title?: string;
  yLabel?: string;
}

export default function AgentPerformanceChart({
  data,
  color = "#6366f1",
  title,
  yLabel,
}: Props) {
  return (
    <div>
      {title && (
        <h4
          className="text-sm font-medium mb-3"
          style={{ color: "var(--color-text)" }}
        >
          {title}
        </h4>
      )}
      <ResponsiveContainer width="100%" height={220}>
        <AreaChart data={data}>
          <defs>
            <linearGradient id={`grad-${color}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={color} stopOpacity={0.3} />
              <stop offset="95%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#2a2a3d" />
          <XAxis dataKey="label" tick={{ fill: "#8a8aa3", fontSize: 11 }} />
          <YAxis
            tick={{ fill: "#8a8aa3", fontSize: 11 }}
            label={
              yLabel
                ? {
                    value: yLabel,
                    angle: -90,
                    position: "insideLeft",
                    fill: "#8a8aa3",
                    fontSize: 11,
                  }
                : undefined
            }
          />
          <Tooltip
            contentStyle={{
              background: "#16162a",
              border: "1px solid #2a2a3d",
              borderRadius: 8,
              color: "#e0e0f0",
            }}
          />
          <Area
            type="monotone"
            dataKey="value"
            stroke={color}
            fill={`url(#grad-${color})`}
            strokeWidth={2}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
