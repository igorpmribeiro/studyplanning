"use client";

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";

const chartConfig = {
  minutos: {
    label: "Minutos",
    color: "var(--color-primary)",
  },
} satisfies ChartConfig;

function formatLabel(nome: string): string {
  if (nome.length <= 12) return nome;
  return nome.slice(0, 10) + "…";
}

export function StudyTimeChart({
  data,
}: {
  data: { nome: string; minutos: number }[];
}) {
  const chartData = data.map((d) => ({
    ...d,
    label: formatLabel(d.nome),
  }));

  return (
    <ChartContainer config={chartConfig} className="h-[220px] w-full">
      <BarChart data={chartData} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
        <XAxis
          dataKey="label"
          tick={{ fontSize: 11 }}
          className="text-muted-foreground"
        />
        <YAxis
          tick={{ fontSize: 11 }}
          tickFormatter={(v) => `${v}min`}
          className="text-muted-foreground"
        />
        <ChartTooltip
          content={
            <ChartTooltipContent
              formatter={(value) => `${value} min`}
              labelFormatter={(_label, payload) => payload?.[0]?.payload?.nome ?? _label}
            />
          }
        />
        <Bar
          dataKey="minutos"
          fill="var(--color-minutos)"
          radius={[4, 4, 0, 0]}
        />
      </BarChart>
    </ChartContainer>
  );
}
