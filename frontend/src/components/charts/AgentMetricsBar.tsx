"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

interface MetricItem {
  name: string;
  value: number;
  color?: string;
}

interface Props {
  data: MetricItem[];
  title?: string;
}

const COLORS = [
  "#6366f1",
  "#10b981",
  "#f59e0b",
  "#ef4444",
  "#06b6d4",
  "#a855f7",
];

export default function AgentMetricsBar({ data, title }: Props) {
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
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#2a2a3d" />
          <XAxis dataKey="name" tick={{ fill: "#8a8aa3", fontSize: 11 }} />
          <YAxis tick={{ fill: "#8a8aa3", fontSize: 11 }} />
          <Tooltip
            contentStyle={{
              background: "#16162a",
              border: "1px solid #2a2a3d",
              borderRadius: 8,
              color: "#e0e0f0",
            }}
          />
          <Bar dataKey="value" radius={[4, 4, 0, 0]}>
            {data.map((entry, idx) => (
              <Cell
                key={entry.name}
                fill={entry.color || COLORS[idx % COLORS.length]}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
