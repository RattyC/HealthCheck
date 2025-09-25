"use client";

import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { format } from "date-fns";

export type PriceHistoryPoint = {
  recordedAt: string;
  price: number;
};

type PriceHistoryChartProps = {
  data: PriceHistoryPoint[];
};

export default function PriceHistoryChart({ data }: PriceHistoryChartProps) {
  if (data.length === 0) {
    return null;
  }

  const chartData = data.map((point) => ({
    price: point.price,
    recordedAt: format(new Date(point.recordedAt), "dd MMM"),
  }));

  return (
    <ResponsiveContainer width="100%" height={260}>
      <LineChart data={chartData} margin={{ top: 12, right: 16, bottom: 8, left: 8 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.25)" />
        <XAxis dataKey="recordedAt" stroke="rgba(148, 163, 184, 0.9)" tickLine={false} axisLine={false} fontSize={12} />
        <YAxis
          stroke="rgba(148, 163, 184, 0.9)"
          tickFormatter={(value) => `฿${value.toLocaleString()}`}
          width={80}
          fontSize={12}
        />
        <Tooltip
          formatter={(value: number) => [`฿${value.toLocaleString()}`, "ราคา"]}
          labelFormatter={(label) => `วันที่ ${label}`}
        />
        <Line type="monotone" dataKey="price" stroke="#0ea5a0" strokeWidth={2.5} dot={{ r: 3 }} activeDot={{ r: 5 }} />
      </LineChart>
    </ResponsiveContainer>
  );
}
