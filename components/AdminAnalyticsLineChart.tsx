"use client";

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";

type Point = {
  label: string;
  value: number;
};

type Props = {
  data: Point[];
  label: string;
  color: string;
};

export default function AdminAnalyticsLineChart({ data, label, color }: Props) {
  if (data.length === 0) return null;

  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data} margin={{ top: 12, right: 16, left: 0, bottom: 12 }}>
        <defs>
          <linearGradient id="analyticsArea" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.35} />
            <stop offset="100%" stopColor={color} stopOpacity={0.05} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="4 4" stroke="rgba(148, 163, 184, 0.2)" vertical={false} />
        <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fontSize: 12 }} />
        <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 12 }} allowDecimals={false} width={40} />
        <Tooltip
          cursor={{ stroke: color, strokeOpacity: 0.4 }}
          formatter={(value: number) => [value.toLocaleString(), label]}
        />
        <Area type="monotone" dataKey="value" stroke={color} strokeWidth={2} fill="url(#analyticsArea)" />
      </AreaChart>
    </ResponsiveContainer>
  );
}
