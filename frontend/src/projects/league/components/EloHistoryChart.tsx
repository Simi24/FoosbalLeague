import { useRef, useState } from "react";

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
  const svgRef = useRef<SVGSVGElement>(null);
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

  // X-axis labels
  const xLabelCount = Math.min(data.length, 5);
  const xLabels: { i: number; label: string }[] = [];
  for (let j = 0; j < xLabelCount; j++) {
    const i = data.length <= xLabelCount
      ? j
      : Math.round((j / (xLabelCount - 1)) * (data.length - 1));
    const point = data[i];
    if (point) xLabels.push({ i, label: formatDate(point.timestamp) });
  }

  // Y-axis ticks
  const yTicks = [0, 0.25, 0.5, 0.75, 1].map((pct) => ({
    y: pct * chartHeight,
    elo: Math.round(maxElo - pct * range),
  }));

  const gradientId = "elo-gradient";

  // Find closest point to mouse X position
  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const svg = svgRef.current;
    if (!svg || data.length < 2) return;

    const rect = svg.getBoundingClientRect();
    const svgX = ((e.clientX - rect.left) / rect.width) * width - padding.left;

    let closest = 0;
    let closestDist = Infinity;
    for (let i = 0; i < points.length; i++) {
      const dist = Math.abs(points[i]![0] - svgX);
      if (dist < closestDist) {
        closestDist = dist;
        closest = i;
      }
    }
    setHovered(closest);
  };

  const hoveredPoint = hovered !== null ? data[hovered] : null;

  return (
    <svg
      ref={svgRef}
      viewBox={`0 0 ${width} ${height}`}
      className="w-full"
      preserveAspectRatio="xMidYMid meet"
      onMouseMove={handleMouseMove}
      onMouseLeave={() => setHovered(null)}
      style={{ cursor: data.length > 1 ? "crosshair" : "default" }}
    >
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#2B6BE8" stopOpacity={0.22} />
          <stop offset="100%" stopColor="#2B6BE8" stopOpacity={0} />
        </linearGradient>
      </defs>

      <g transform={`translate(${padding.left},${padding.top})`}>
        {/* Grid lines */}
        {yTicks.map(({ y, elo }) => (
          <g key={elo}>
            <line x1={0} y1={y} x2={chartWidth} y2={y} stroke="#1A1A1A" strokeOpacity={0.15} strokeDasharray="4" />
            <text x={-10} y={y + 4} textAnchor="end" fill="#4A4A4A" fontSize={10} fontFamily="JetBrains Mono, monospace" fontWeight={600}>
              {elo}
            </text>
          </g>
        ))}

        {/* Area fill */}
        {data.length > 1 && <path d={areaPath} fill={`url(#${gradientId})`} />}

        {/* Line */}
        {data.length > 1 ? (
          <path
            d={linePath}
            fill="none"
            stroke="#1A1A1A"
            strokeWidth={2.5}
            strokeLinecap="square"
            strokeLinejoin="miter"
          />
        ) : (
          <rect x={points[0]![0] - 5} y={points[0]![1] - 5} width={10} height={10} fill="#2B6BE8" stroke="#1A1A1A" strokeWidth={2} />
        )}

        {/* Dots — square markers (brutalist) */}
        {data.length > 1 &&
          points.map(([x, y], i) => {
            const isLast = i === points.length - 1;
            const isActive = hovered === i;
            const size = isActive ? 10 : isLast ? 9 : 6;

            return (
              <g key={data[i]!.match_id}>
                <rect
                  x={x - size / 2}
                  y={y - size / 2}
                  width={size}
                  height={size}
                  fill={isLast || isActive ? "#2B6BE8" : "#FAF7F2"}
                  stroke="#1A1A1A"
                  strokeWidth={2}
                />
              </g>
            );
          })}

        {/* Hover indicator */}
        {hoveredPoint && hovered !== null && points[hovered] && (
          <g>
            <line
              x1={points[hovered]![0]}
              y1={0}
              x2={points[hovered]![0]}
              y2={chartHeight}
              stroke="#1A1A1A"
              strokeWidth={1.5}
              strokeDasharray="4"
            />

            {/* Tooltip — brutalist paper card */}
            {(() => {
              const tx = points[hovered]![0];
              const flipLeft = tx > chartWidth - 120;
              const tooltipX = flipLeft ? tx - 118 : tx + 10;
              const tooltipY = Math.max(0, Math.min(points[hovered]![1] - 28, chartHeight - 56));

              return (
                <g transform={`translate(${tooltipX}, ${tooltipY})`}>
                  <rect x={3} y={3} width={108} height={52} fill="#1A1A1A" />
                  <rect width={108} height={52} fill="#FFFFFF" stroke="#1A1A1A" strokeWidth={2} />
                  <text x={10} y={22} fill="#1A1A1A" fontSize={14} fontWeight="bold" fontFamily="JetBrains Mono, monospace">
                    {hoveredPoint.elo}
                  </text>
                  <text
                    x={10}
                    y={42}
                    fill={hoveredPoint.delta >= 0 ? "#2E9E54" : "#C93838"}
                    fontSize={12}
                    fontWeight="bold"
                    fontFamily="JetBrains Mono, monospace"
                  >
                    {hoveredPoint.delta >= 0 ? "+" : ""}{hoveredPoint.delta}
                  </text>
                  <text x={52} y={42} fill="#4A4A4A" fontSize={10} fontFamily="Space Grotesk, sans-serif" fontWeight={500}>
                    {formatDate(hoveredPoint.timestamp)}
                  </text>
                </g>
              );
            })()}
          </g>
        )}

        {/* X-axis labels */}
        {xLabels.map(({ i, label }) => (
          <text
            key={i}
            x={xScale(i)}
            y={chartHeight + 20}
            textAnchor="middle"
            fill="#4A4A4A"
            fontSize={10}
            fontFamily="Space Grotesk, sans-serif"
            fontWeight={600}
          >
            {label}
          </text>
        ))}
      </g>
    </svg>
  );
};
