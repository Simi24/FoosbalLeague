import { useState } from "react";

import type { EloHistoryPoint } from "../types";

type EloHistoryChartProps = {
  data: EloHistoryPoint[];
  width?: number;
  height?: number;
};

const formatDate = (ts: string): string => {
  const d = new Date(ts);
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
};

const bezierPath = (points: [number, number][]): string => {
  if (points.length < 2) return "";

  let d = `M ${points[0]![0]},${points[0]![1]}`;

  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1]!;
    const curr = points[i]!;
    const tension = 0.3;
    const dx = (curr[0] - prev[0]) * tension;

    d += ` C ${prev[0] + dx},${prev[1]} ${curr[0] - dx},${curr[1]} ${curr[0]},${curr[1]}`;
  }

  return d;
};

export const EloHistoryChart = ({
  data,
  width = 600,
  height = 240,
}: EloHistoryChartProps) => {
  const [hovered, setHovered] = useState<number | null>(null);

  if (data.length === 0) return null;

  const padding = { top: 24, right: 24, bottom: 36, left: 50 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  const elos = data.map((d) => d.elo);
  const minElo = Math.min(...elos) - 40;
  const maxElo = Math.max(...elos) + 40;
  const range = maxElo - minElo || 1;

  const xScale = (i: number) =>
    data.length === 1 ? chartWidth / 2 : (i / (data.length - 1)) * chartWidth;
  const yScale = (elo: number) =>
    chartHeight - ((elo - minElo) / range) * chartHeight;

  const points: [number, number][] = data.map((d, i) => [xScale(i), yScale(d.elo)]);

  const linePath = bezierPath(points);

  const areaPath =
    linePath +
    ` L ${points[points.length - 1]![0]},${chartHeight}` +
    ` L ${points[0]![0]},${chartHeight} Z`;

  // X-axis labels (show ~5 evenly spaced)
  const xLabelCount = Math.min(data.length, 5);
  const xLabels: { i: number; label: string }[] = [];
  for (let j = 0; j < xLabelCount; j++) {
    const i = data.length <= xLabelCount
      ? j
      : Math.round((j / (xLabelCount - 1)) * (data.length - 1));
    const point = data[i];
    if (point) {
      xLabels.push({ i, label: formatDate(point.timestamp) });
    }
  }

  // Y-axis labels (5 ticks)
  const yTicks = [0, 0.25, 0.5, 0.75, 1].map((pct) => ({
    y: pct * chartHeight,
    elo: Math.round(maxElo - pct * range),
  }));

  const gradientId = "elo-gradient";
  const hoveredPoint = hovered !== null ? data[hovered] : null;

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="w-full"
      preserveAspectRatio="xMidYMid meet"
    >
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.25} />
          <stop offset="100%" stopColor="#f59e0b" stopOpacity={0} />
        </linearGradient>
      </defs>

      <g transform={`translate(${padding.left},${padding.top})`}>
        {/* Grid lines */}
        {yTicks.map(({ y, elo }) => (
          <g key={elo}>
            <line
              x1={0}
              y1={y}
              x2={chartWidth}
              y2={y}
              stroke="#e5e7eb"
              strokeDasharray="4"
            />
            <text
              x={-10}
              y={y + 4}
              textAnchor="end"
              fill="#9ca3af"
              fontSize={10}
              fontFamily="monospace"
            >
              {elo}
            </text>
          </g>
        ))}

        {/* Area fill */}
        {data.length > 1 && (
          <path d={areaPath} fill={`url(#${gradientId})`} />
        )}

        {/* Line */}
        {data.length > 1 ? (
          <path
            d={linePath}
            fill="none"
            stroke="#f59e0b"
            strokeWidth={2.5}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        ) : (
          <circle
            cx={points[0]![0]}
            cy={points[0]![1]}
            r={5}
            fill="#f59e0b"
          />
        )}

        {/* Dots */}
        {data.length > 1 &&
          points.map(([x, y], i) => {
            const isLast = i === points.length - 1;
            const isHovered = hovered === i;

            return (
              <g key={data[i]!.match_id}>
                {/* Invisible hit area */}
                <circle
                  cx={x}
                  cy={y}
                  r={12}
                  fill="transparent"
                  onMouseEnter={() => setHovered(i)}
                  onMouseLeave={() => setHovered(null)}
                  style={{ cursor: "pointer" }}
                />
                {/* Glow for last/hovered */}
                {(isLast || isHovered) && (
                  <circle
                    cx={x}
                    cy={y}
                    r={8}
                    fill="#f59e0b"
                    opacity={0.15}
                  />
                )}
                {/* Dot */}
                <circle
                  cx={x}
                  cy={y}
                  r={isLast ? 4.5 : isHovered ? 4 : 3}
                  fill={isLast ? "#f59e0b" : isHovered ? "#f59e0b" : "#fbbf24"}
                  stroke="white"
                  strokeWidth={isLast || isHovered ? 2 : 0}
                />
              </g>
            );
          })}

        {/* Tooltip */}
        {hoveredPoint && hovered !== null && (
          <g>
            {/* Vertical line */}
            <line
              x1={points[hovered]![0]}
              y1={0}
              x2={points[hovered]![0]}
              y2={chartHeight}
              stroke="#f59e0b"
              strokeWidth={1}
              strokeDasharray="3"
              opacity={0.4}
            />
            {/* Tooltip box */}
            <g
              transform={`translate(${
                points[hovered]![0] > chartWidth - 100
                  ? points[hovered]![0] - 110
                  : points[hovered]![0] + 10
              }, ${Math.max(0, points[hovered]![1] - 40)})`}
            >
              <rect
                width={100}
                height={48}
                rx={6}
                fill="#1f2937"
                opacity={0.95}
              />
              <text x={10} y={18} fill="white" fontSize={12} fontWeight="bold" fontFamily="monospace">
                {hoveredPoint.elo}
              </text>
              <text x={10} y={33} fill={hoveredPoint.delta >= 0 ? "#4ade80" : "#f87171"} fontSize={11} fontFamily="monospace">
                {hoveredPoint.delta >= 0 ? "+" : ""}{hoveredPoint.delta}
              </text>
              <text x={50} y={33} fill="#9ca3af" fontSize={9}>
                {formatDate(hoveredPoint.timestamp)}
              </text>
            </g>
          </g>
        )}

        {/* X-axis labels */}
        {xLabels.map(({ i, label }) => (
          <text
            key={i}
            x={xScale(i)}
            y={chartHeight + 20}
            textAnchor="middle"
            fill="#9ca3af"
            fontSize={9}
          >
            {label}
          </text>
        ))}
      </g>
    </svg>
  );
};
