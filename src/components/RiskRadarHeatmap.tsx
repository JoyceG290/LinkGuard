import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as d3 from 'd3';
import { ScanResult } from '../types/scanner';
import { calculateRadarRiskCategories, RadarCategoryScore } from '../utils/radarMetrics';
import { ShieldAlert, ShieldCheck, Info, Activity } from 'lucide-react';

interface RiskRadarHeatmapProps {
  result: ScanResult;
}

export const RiskRadarHeatmap: React.FC<RiskRadarHeatmapProps> = ({ result }) => {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [hoveredCategory, setHoveredCategory] = useState<RadarCategoryScore | null>(null);

  const categories = useMemo(() => calculateRadarRiskCategories(result), [result]);

  useEffect(() => {
    if (!svgRef.current || categories.length === 0) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const width = 500;
    const height = 400;
    const cx = width / 2;
    const cy = height / 2;
    const radius = 135;
    const numAxes = categories.length;
    const angleSlice = (Math.PI * 2) / numAxes;

    // Defs for gradients & filters
    const defs = svg.append('defs');

    // Glow filter
    const filter = defs.append('filter').attr('id', 'radar-glow').attr('x', '-50%').attr('y', '-50%').attr('width', '200%').attr('height', '200%');
    filter.append('feGaussianBlur').attr('stdDeviation', '4').attr('result', 'coloredBlur');
    const feMerge = filter.append('feMerge');
    feMerge.append('feMergeNode').attr('in', 'coloredBlur');
    feMerge.append('feMergeNode').attr('in', 'SourceGraphic');

    // Overall threat theme color
    const isCritical = result.level === 'critical' || result.level === 'dangerous';
    const primaryRadarColor = isCritical ? '#EF4444' : result.level === 'suspicious' ? '#F59E0B' : '#10B981';
    const primaryFillColor = isCritical ? 'rgba(239, 68, 68, 0.35)' : result.level === 'suspicious' ? 'rgba(245, 158, 11, 0.3)' : 'rgba(16, 185, 129, 0.25)';

    // Polygon radial gradient
    const polyGradient = defs.append('radialGradient')
      .attr('id', 'polygon-heat-gradient')
      .attr('cx', '50%')
      .attr('cy', '50%')
      .attr('r', '50%');
    polyGradient.append('stop').attr('offset', '0%').attr('stop-color', primaryRadarColor).attr('stop-opacity', '0.6');
    polyGradient.append('stop').attr('offset', '70%').attr('stop-color', primaryRadarColor).attr('stop-opacity', '0.25');
    polyGradient.append('stop').attr('offset', '100%').attr('stop-color', primaryRadarColor).attr('stop-opacity', '0.05');

    const g = svg.append('g').attr('transform', `translate(${cx}, ${cy})`);

    // Scale
    const rScale = d3.scaleLinear().domain([0, 100]).range([0, radius]);

    // Risk levels concentric circles
    const levels = [25, 50, 75, 100];
    const levelLabels = ['25 Low', '50 Mod', '75 High', '100 Crit'];

    levels.forEach((level, i) => {
      // Concentric polygon or circle
      g.append('circle')
        .attr('r', rScale(level))
        .attr('fill', i % 2 === 0 ? 'rgba(30, 41, 59, 0.35)' : 'rgba(15, 23, 42, 0.5)')
        .attr('stroke', 'rgba(71, 85, 105, 0.35)')
        .attr('stroke-dasharray', i === 3 ? 'none' : '3,3');

      // Concentric level marker text
      g.append('text')
        .attr('x', 4)
        .attr('y', -rScale(level) + 10)
        .attr('font-size', '9px')
        .attr('font-family', 'JetBrains Mono, monospace')
        .attr('fill', '#64748B')
        .text(levelLabels[i]);
    });

    // Outer Sector Heatmap Ring
    // We draw radial heatmap arc slices along the perimeter to show the heat category
    const arcGenerator = d3.arc<RadarCategoryScore>()
      .innerRadius(radius + 6)
      .outerRadius(radius + 14)
      .startAngle((_, i) => i * angleSlice - angleSlice / 2)
      .endAngle((_, i) => (i + 1) * angleSlice - angleSlice / 2)
      .padAngle(0.04)
      .cornerRadius(2);

    const heatColorScale = (score: number) => {
      if (score >= 75) return '#EF4444'; // Red
      if (score >= 50) return '#F97316'; // Orange
      if (score >= 25) return '#F59E0B'; // Amber
      return '#10B981'; // Green
    };

    g.selectAll('.sector-heatmap-arc')
      .data(categories)
      .enter()
      .append('path')
      .attr('class', 'sector-heatmap-arc')
      .attr('d', arcGenerator as any)
      .attr('fill', d => heatColorScale(d.score))
      .attr('fill-opacity', d => hoveredCategory?.key === d.key ? 1 : 0.75)
      .attr('stroke', d => heatColorScale(d.score))
      .attr('stroke-width', d => hoveredCategory?.key === d.key ? 2 : 0)
      .style('cursor', 'pointer')
      .on('mouseenter', (_, d) => setHoveredCategory(d))
      .on('mouseleave', () => setHoveredCategory(null));

    // Axis Lines (Spokes)
    categories.forEach((cat, i) => {
      const angle = i * angleSlice - Math.PI / 2;
      const x = Math.cos(angle) * (radius + 4);
      const y = Math.sin(angle) * (radius + 4);

      g.append('line')
        .attr('x1', 0)
        .attr('y1', 0)
        .attr('x2', x)
        .attr('y2', y)
        .attr('stroke', hoveredCategory?.key === cat.key ? primaryRadarColor : 'rgba(71, 85, 105, 0.4)')
        .attr('stroke-width', hoveredCategory?.key === cat.key ? 2 : 1);

      // Axis label position (placed slightly beyond the heat ring)
      const labelRadius = radius + 32;
      const lx = Math.cos(angle) * labelRadius;
      const ly = Math.sin(angle) * labelRadius;

      // Text alignment based on angle position
      let textAnchor: 'start' | 'middle' | 'end' = 'middle';
      if (Math.cos(angle) > 0.25) textAnchor = 'start';
      else if (Math.cos(angle) < -0.25) textAnchor = 'end';

      const labelG = g.append('g')
        .attr('transform', `translate(${lx}, ${ly})`)
        .style('cursor', 'pointer')
        .on('mouseenter', () => setHoveredCategory(cat))
        .on('mouseleave', () => setHoveredCategory(null));

      // Category Name
      labelG.append('text')
        .attr('text-anchor', textAnchor)
        .attr('font-size', '11px')
        .attr('font-weight', '600')
        .attr('fill', hoveredCategory?.key === cat.key ? '#FFFFFF' : '#CBD5E1')
        .text(cat.category);

      // Category Score Tabular Indicator
      labelG.append('text')
        .attr('text-anchor', textAnchor)
        .attr('y', 13)
        .attr('font-size', '10px')
        .attr('font-family', 'JetBrains Mono, monospace')
        .attr('font-weight', '700')
        .attr('fill', heatColorScale(cat.score))
        .text(`${cat.score}/100`);
    });

    // Radar Polygon Line
    const radarLine = d3.lineRadial<RadarCategoryScore>()
      .radius(d => rScale(d.score))
      .angle((_, i) => i * angleSlice)
      .curve(d3.curveLinearClosed);

    // Draw Radar Area
    g.append('path')
      .datum(categories)
      .attr('d', radarLine)
      .attr('fill', 'url(#polygon-heat-gradient)')
      .attr('stroke', primaryRadarColor)
      .attr('stroke-width', 2.5)
      .attr('filter', 'url(#radar-glow)')
      .style('opacity', 0.95);

    // Draw Data Vertex Points
    categories.forEach((cat, i) => {
      const angle = i * angleSlice - Math.PI / 2;
      const r = rScale(cat.score);
      const px = Math.cos(angle) * r;
      const py = Math.sin(angle) * r;
      const isHovered = hoveredCategory?.key === cat.key;

      // Outer ripple on hover
      if (isHovered) {
        g.append('circle')
          .attr('cx', px)
          .attr('cy', py)
          .attr('r', 10)
          .attr('fill', 'none')
          .attr('stroke', primaryRadarColor)
          .attr('stroke-width', 1.5)
          .attr('opacity', 0.8);
      }

      // Vertex dot
      g.append('circle')
        .attr('cx', px)
        .attr('cy', py)
        .attr('r', isHovered ? 6 : 4)
        .attr('fill', heatColorScale(cat.score))
        .attr('stroke', '#0B0F17')
        .attr('stroke-width', 2)
        .style('cursor', 'pointer')
        .on('mouseenter', () => setHoveredCategory(cat))
        .on('mouseleave', () => setHoveredCategory(null));
    });

  }, [categories, hoveredCategory, result.level]);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-emerald-400" />
            <h3 className="text-base font-bold text-white tracking-tight">
              Multi-Vector Risk Radar & Heatmap
            </h3>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            D3-rendered polar threat dispersion across domain age, SSL validity, registrar trust, and architectural vectors.
          </p>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-3 text-[11px] font-mono text-slate-400 bg-slate-950/80 px-3 py-1.5 rounded-lg border border-slate-800">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>0-24 Safe</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            <span>25-49 Mod</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-orange-500" />
            <span>50-74 High</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-rose-500" />
            <span>75+ Crit</span>
          </span>
        </div>
      </div>

      {/* Main D3 Graphic Container */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
        {/* SVG Radar */}
        <div className="lg:col-span-7 flex flex-col items-center justify-center p-2 bg-slate-950/60 rounded-xl border border-slate-800/80 relative">
          <svg
            ref={svgRef}
            viewBox="0 0 500 400"
            className="w-full max-w-[460px] h-auto overflow-visible"
            aria-label="Risk Radar Heatmap Chart"
          />

          {/* Active Hover Callout Card */}
          {hoveredCategory && (
            <div className="absolute bottom-3 left-3 right-3 sm:left-auto sm:right-3 sm:max-w-xs p-3 bg-slate-900/95 backdrop-blur-md border border-slate-700/80 rounded-xl shadow-xl text-xs z-10 transition-all pointer-events-none">
              <div className="flex items-center justify-between mb-1">
                <span className="font-bold text-white">{hoveredCategory.category}</span>
                <span className={`px-2 py-0.5 rounded font-mono font-bold text-[10px] uppercase ${
                  hoveredCategory.level === 'critical'
                    ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                    : hoveredCategory.level === 'high'
                    ? 'bg-orange-500/20 text-orange-300 border border-orange-500/30'
                    : hoveredCategory.level === 'moderate'
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                    : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                }`}>
                  {hoveredCategory.score}/100 {hoveredCategory.level}
                </span>
              </div>
              <p className="text-slate-300 leading-relaxed text-[11px]">
                {hoveredCategory.details}
              </p>
            </div>
          )}
        </div>

        {/* Category Breakdown Metric Cards */}
        <div className="lg:col-span-5 space-y-2.5">
          <div className="text-xs uppercase font-semibold tracking-wider text-slate-400 mb-2">
            Vector Risk Breakdown
          </div>
          {categories.map((cat) => {
            const isHovered = hoveredCategory?.key === cat.key;
            const levelBadge =
              cat.level === 'critical'
                ? 'bg-rose-500/15 text-rose-400 border-rose-500/30'
                : cat.level === 'high'
                ? 'bg-orange-500/15 text-orange-400 border-orange-500/30'
                : cat.level === 'moderate'
                ? 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                : 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30';

            return (
              <div
                key={cat.key}
                onMouseEnter={() => setHoveredCategory(cat)}
                onMouseLeave={() => setHoveredCategory(null)}
                className={`p-3 rounded-xl border transition-all cursor-pointer ${
                  isHovered
                    ? 'bg-slate-800/90 border-slate-600 shadow-md'
                    : 'bg-slate-950/60 border-slate-800/80 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span className="text-xs font-bold text-white flex items-center gap-1.5">
                    {cat.category}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-slate-200 tabular-nums">
                      {cat.score}/100
                    </span>
                    <span className={`px-1.5 py-0.2 rounded text-[10px] uppercase font-bold tracking-wider border ${levelBadge}`}>
                      {cat.level}
                    </span>
                  </div>
                </div>
                <p className="text-[11px] text-slate-400 leading-snug line-clamp-2">
                  {cat.details}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
