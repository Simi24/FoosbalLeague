import type { EloHistoryPoint } from "../types";

type EloHistoryChartProps = {
  data: EloHistoryPoint[];
  width?: number;
  height?: number;
};

export const EloHistoryChart = ({
  data,
  width = 600,
  height = 200,
}: EloHistoryChartProps) => {
  if (data.length === 0) return null;

  const padding = { top: 20, right: 20, bottom: 30, left: 50 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  const elos = data.map((d) => d.elo);
  const minElo = Math.min(...elos) - 50;
  const maxElo = Math.max(...elos) + 50;

  const xScale = (i: number) => (i / (data.length - 1)) * chartWidth;
  const yScale = (elo: number) =>
    chartHeight - ((elo - minElo) / (maxElo - minElo)) * chartHeight;

  const points = data.map((d, i) => `${xScale(i)},${yScale(d.elo)}`).join(" ");

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="w-full"
      preserveAspectRatio="xMidYMid meet"
    >
      <g transform={`translate(${padding.left},${padding.top})`}>
        {/* Grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map((pct) => {
          const y = pct * chartHeight;
          const elo = Math.round(maxElo - pct * (maxElo - minElo));
          return (
            <g key={pct}>
              <line
                x1={0}
                y1={y}
                x2={chartWidth}
                y2={y}
                stroke="#e5e7eb"
                strokeDasharray="4"
              />
              <text
                x={-8}
                y={y + 4}
                textAnchor="end"
                fill="#6b7280"
                fontSize={10}
                fontFamily="monospace"
              >
                {elo}
              </text>
            </g>
          );
        })}

        {/* Line */}
        <polyline
          points={points}
          fill="none"
          stroke="#f59e0b"
          strokeWidth={2}
          strokeLinejoin="round"
        />

        {/* Dots */}
        {data.map((d, i) => (
          <circle
            key={d.match_id}
            cx={xScale(i)}
            cy={yScale(d.elo)}
            r={3}
            fill="#f59e0b"
          />
        ))}
      </g>
    </svg>
  );
};
