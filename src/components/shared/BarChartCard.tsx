"use client";

/**
 * Gráfico de barras de uma série (magnitude) com tooltip e tabela acessível.
 * Uma cor só (--primary): série única não precisa de legenda; o título nomeia o dado.
 * Carregado via next/dynamic (Recharts é pesado).
 */
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export type BarDatum = { label: string; value: number };

type BarChartCardProps = {
  title: string;
  data: BarDatum[];
  format: (value: number) => string;
  /** Barras horizontais para categorias com nome longo. */
  horizontal?: boolean;
  height?: number;
};

const TICK = { fill: "var(--text-muted)", fontSize: 12 };

export default function BarChartCard({
  title,
  data,
  format,
  horizontal = false,
  height = 220,
}: BarChartCardProps) {
  return (
    <figure className="rounded-card border-border bg-surface flex flex-col gap-3 border p-4">
      <figcaption className="font-medium">{title}</figcaption>
      <div style={{ height }} aria-hidden>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            layout={horizontal ? "vertical" : "horizontal"}
            margin={{ top: 4, right: 8, bottom: 0, left: horizontal ? 8 : 0 }}
            barCategoryGap={2}
          >
            <CartesianGrid
              stroke="var(--border)"
              strokeDasharray="0"
              vertical={horizontal}
              horizontal={!horizontal}
            />
            {horizontal ? (
              <>
                <XAxis
                  type="number"
                  tick={TICK}
                  tickFormatter={format}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  type="category"
                  dataKey="label"
                  tick={TICK}
                  width={96}
                  axisLine={false}
                  tickLine={false}
                />
              </>
            ) : (
              <>
                <XAxis
                  dataKey="label"
                  tick={TICK}
                  axisLine={false}
                  tickLine={false}
                  interval="preserveStartEnd"
                />
                <YAxis
                  tick={TICK}
                  tickFormatter={format}
                  width={64}
                  axisLine={false}
                  tickLine={false}
                />
              </>
            )}
            <Tooltip
              cursor={{ fill: "var(--surface-2)" }}
              formatter={(value) => [format(Number(value)), title]}
              contentStyle={{
                background: "var(--surface)",
                border: "1px solid var(--border)",
                borderRadius: 6,
                color: "var(--text)",
              }}
              labelStyle={{ color: "var(--text-muted)" }}
            />
            <Bar
              dataKey="value"
              fill="var(--primary)"
              radius={horizontal ? [0, 4, 4, 0] : [4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <details className="text-sm">
        <summary className="text-text-muted cursor-pointer">
          Ver em tabela
        </summary>
        <table className="mt-2 w-full">
          <tbody>
            {data.map((d) => (
              <tr
                key={d.label}
                className="border-border border-b last:border-0"
              >
                <th scope="row" className="py-1 text-left font-normal">
                  {d.label}
                </th>
                <td className="py-1 text-right tabular-nums">
                  {format(d.value)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </figure>
  );
}
