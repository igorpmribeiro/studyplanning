"use client";

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ReferenceLine } from "recharts";

const chartConfig = {
  acerto: {
    label: "Acerto",
    color: "var(--color-primary)",
  },
} satisfies ChartConfig;

export function PerformanceChart({
  data,
}: {
  data: { index: number; data: string; acerto: number }[];
}) {
  return (
    <ChartContainer config={chartConfig} className="h-[220px] w-full">
      <LineChart data={data} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
        <XAxis
          dataKey="data"
          tick={{ fontSize: 11 }}
          className="text-muted-foreground"
        />
        <YAxis
          domain={[0, 100]}
          tick={{ fontSize: 11 }}
          tickFormatter={(v) => `${v}%`}
          className="text-muted-foreground"
        />
        <ChartTooltip
          content={<ChartTooltipContent formatter={(value) => `${value}%`} />}
        />
        <ReferenceLine y={70} stroke="hsl(var(--muted-foreground))" strokeDasharray="4 4" opacity={0.4} />
        <Line
          type="monotone"
          dataKey="acerto"
          stroke="var(--color-acerto)"
          strokeWidth={2.5}
          dot={{ r: 4, fill: "var(--color-acerto)" }}
          activeDot={{ r: 6 }}
        />
      </LineChart>
    </ChartContainer>
  );
}
