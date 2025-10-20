import React from 'react';
import { useStore } from '../../state/store';
import { computeSeries } from '../../state/selectors';
import { scaleLinear } from '@visx/scale';
import { AreaClosed, LinePath } from '@visx/shape';
import { curveMonotoneX } from '@visx/curve';

function format(n: number | undefined) {
  if (n == null) return '-';
  return new Intl.NumberFormat(undefined, { maximumFractionDigits: 0 }).format(n);
}

function formatCompact(n: number | undefined) {
  if (n == null) return '-';
  if (Math.abs(n) >= 1000000) {
    return `${(n / 1000000).toFixed(1)}M`;
  } else if (Math.abs(n) >= 1000) {
    return `${(n / 1000).toFixed(0)}K`;
  } else {
    return n.toFixed(0);
  }
}

export function AreaChart() {
  const state = useStore();
  const setZoom = useStore((s) => s.setZoom);
  const addMilestone = useStore((s) => s.addMilestone);
  const series = React.useMemo(() => computeSeries(state), [state]);
  const visible = series.slice(state.chart.zoom.minMonth, state.chart.zoom.maxMonth);
  const last = visible.at(-1);
  const totalMonths = 100 * 12;
  const [hovered, setHovered] = React.useState<number | null>(null);
  const hoveredPoint = hovered != null ? visible.find((p) => p.m === hovered) : undefined;
  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const [width, setWidth] = React.useState<number>(1000);
  React.useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setWidth(el.clientWidth));
    ro.observe(el);
    setWidth(el.clientWidth);
    return () => ro.disconnect();
  }, []);
  const height = 260;
  const padding = { left: 40, right: 20, top: 10, bottom: 30 };
  const innerW = width - padding.left - padding.right;
  const innerH = height - padding.top - padding.bottom;

  const x = scaleLinear<number>({ domain: [state.chart.zoom.minMonth, state.chart.zoom.maxMonth], range: [0, innerW] });
  const yDomain = React.useMemo(() => {
    const vals: number[] = [];
    for (const p of visible) { vals.push(p.income, p.expense, p.invest, p.netWorth, p.safety); }
    const min = Math.min(...vals, 0);
    const max = Math.max(...vals, 1);
    return [min, max] as [number, number];
  }, [visible]);
  const y = scaleLinear<number>({ domain: yDomain, range: [innerH, 0] });

  function onWheel(e: React.WheelEvent) {
    // prevent page scroll only when pointer is over the chart area
    e.preventDefault();
    e.stopPropagation();
    const delta = Math.sign(e.deltaY);
    const range = state.chart.zoom.maxMonth - state.chart.zoom.minMonth;
    const mouseX = (e.nativeEvent as any).offsetX - padding.left;
    const centerMonth = Math.round(x.invert(Math.max(0, Math.min(innerW, mouseX))));
    const zoomFactor = delta > 0 ? 1.2 : 0.8; // out/in
    let newRange = Math.max(12, Math.min(totalMonths, Math.round(range * zoomFactor)));
    let min = centerMonth - Math.round(newRange / 2);
    let max = centerMonth + Math.round(newRange / 2);
    if (min < 0) { max -= min; min = 0; }
    if (max > totalMonths) { min -= (max - totalMonths); max = totalMonths; }
    min = Math.max(0, min); max = Math.min(totalMonths, max);
    setZoom(min, max);
  }

  function onClick(e: React.MouseEvent) {
    const mouseX = (e.nativeEvent as any).offsetX - padding.left;
    const month = Math.round(x.invert(Math.max(0, Math.min(innerW, mouseX))));
    const label = window.prompt('Milestone label?');
    if (!label) return;
    addMilestone({ id: `ms-${Date.now()}`, at: { ageYears: Math.floor(month / 12), monthIndex: month }, label });
  }
  return (
    <div className="rounded-lg border bg-white">
      <div className="flex items-center justify-between px-4 py-2 border-b">
        <div className="text-sm font-medium">Timeline</div>
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="inline-flex items-center gap-1"><span className="inline-block w-2 h-2 rounded bg-green-500"></span>Income</span>
          <span className="inline-flex items-center gap-1"><span className="inline-block w-2 h-2 rounded bg-red-500"></span>Expenses</span>
          <span className="inline-flex items-center gap-1"><span className="inline-block w-2 h-2 rounded bg-blue-500"></span>Investments</span>
          <span className="inline-flex items-center gap-1"><span className="inline-block w-2 h-2 rounded bg-yellow-500"></span>Loans</span>
          <span className="inline-flex items-center gap-1"><span className="inline-block w-2 h-2 rounded bg-violet-500"></span>Net Worth</span>
          <span className="inline-flex items-center gap-1"><span className="inline-block w-2 h-2 rounded border-2 border-orange-500"></span>Safety</span>
        </div>
      </div>
      <div className="px-4 py-3 text-[13px]">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          <Kpi 
            label="Income" 
            value={format(sum(visible.map((p) => p.income)))} 
            color="text-green-600" 
            title={`Sum of income in visible window (${state.inflation.display.seriesMode})`}
            status={sum(visible.map((p) => p.income)) > 0 ? "Good cash flow" : "No income"}
          />
          <Kpi 
            label="Expenses" 
            value={format(sum(visible.map((p) => p.expense)))} 
            color="text-red-600" 
            title={`Sum of expenses in visible window (${state.inflation.display.seriesMode})`}
            status={sum(visible.map((p) => p.expense)) > sum(visible.map((p) => p.income)) ? "⚠️ Overspending" : "Controlled"}
          />
          <Kpi 
            label="Investments" 
            value={format(last?.invest)} 
            color="text-blue-600" 
            title="Total investment balance at the latest visible month"
            status={last?.invest && last.invest > 100000 ? "Strong growth" : last?.invest && last.invest > 50000 ? "Building wealth" : "Early stage"}
          />
          <Kpi 
            label="Loans" 
            value={format(last?.loans)} 
            color="text-yellow-600" 
            title="Total loan balance at the latest visible month"
            status={last?.loans && last.loans > 100000 ? "High debt" : last?.loans && last.loans > 50000 ? "Moderate debt" : last?.loans && last.loans > 0 ? "Low debt" : "Debt free"}
          />
          <Kpi 
            label="Net Worth" 
            value={format(last?.netWorth)} 
            color="text-violet-600" 
            title="Net worth at the latest visible month"
            status={last?.netWorth && last.netWorth < 0 ? "🚨 Negative" : last?.netWorth && last.netWorth > 500000 ? "Wealthy" : last?.netWorth && last.netWorth > 100000 ? "Comfortable" : "Building"}
          />
          <Kpi 
            label="Safety Level" 
            value={format(last?.safety)} 
            color="text-orange-600" 
            title="Safety savings target at the latest visible month"
            status={getSafetyStatus(last?.netWorth, last?.safety)}
          />
        </div>
        <div className="mt-4 rounded border bg-white relative" ref={containerRef}>
          <svg
            role="img"
            width="100%"
            height={260}
            viewBox={`0 0 ${width} ${260}`}
            onWheel={onWheel}
            onClick={onClick}
            onMouseMove={(e) => {
              const mx = (e.nativeEvent as any).offsetX - 40;
              const m = Math.round(x.invert(Math.max(0, Math.min(width - 60, mx))));
              setHovered(m);
            }}
            onMouseEnter={() => { document.body.style.overflowY = 'hidden'; }}
            onMouseLeave={() => { document.body.style.overflowY = ''; setHovered(null); }}
          >
            <g transform={`translate(${40},${10})`}>
              <rect x={0} y={0} width={width - 60} height={240} fill="url(#bg)" />
              <defs>
                <linearGradient id="bg" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor="#ffffff" />
                  <stop offset="100%" stopColor="#f8fafc" />
                </linearGradient>
              </defs>
              <AxisBottom x={x} width={width - 60} height={240} />
              <AxisLeft y={y} height={240} />
              <SeriesAreas x={x} y={y} data={visible} />
              <ExtremumMarkers x={x} y={y} data={visible} />
              <Milestones x={x} height={240} zoom={[state.chart.zoom.minMonth, state.chart.zoom.maxMonth]} milestones={state.milestones} />
              {hovered != null ? (
                <line x1={x(hovered)} x2={x(hovered)} y1={0} y2={240} stroke="#94a3b8" strokeDasharray="4 4" />
              ) : null}
            </g>
          </svg>
          {hovered != null ? (
            <HoverTooltip
              x={40 + x(hovered)}
              y={12}
              age={`${Math.floor(hovered/12)}y ${hovered%12}m`}
              income={hoveredPoint?.income}
              expense={hoveredPoint?.expense}
              loans={hoveredPoint?.loans}
              invest={hoveredPoint?.invest}
              netWorth={hoveredPoint?.netWorth}
              safety={hoveredPoint?.safety}
              milestone={state.milestones.find((m) => m.at.monthIndex === hovered)?.label}
            />
          ) : null}
          <div className="flex items-center justify-between px-3 py-2 border-t bg-slate-50 text-xs">
            <button onClick={() => setZoom(0, totalMonths)} className="text-xs px-2 py-1 border rounded hover:bg-white">Reset Zoom</button>
            <div className="text-[11px] text-slate-500">Scroll to zoom, click to add milestone</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Kpi(props: { label: string; value: string; color?: string; title?: string; status?: string }) {
  return (
    <div className="rounded-md border p-3" title={props.title}>
      <div className="text-xs text-slate-500">{props.label}</div>
      <div className={`text-lg font-semibold ${props.color ?? ''}`}>{props.value}</div>
      {props.status && <div className="text-xs text-slate-400 mt-1">{props.status}</div>}
    </div>
  );
}

function sum(arr: number[]): number { return arr.reduce((a, b) => a + b, 0); }

function getSafetyStatus(netWorth: number | undefined, safetyTarget: number | undefined): string {
  if (!netWorth || !safetyTarget) return "No safety target";
  
  const safetyRatio = netWorth / safetyTarget;
  
  if (safetyRatio >= 1.0) {
    return "✅ Safe";
  } else if (safetyRatio >= 0.5) {
    return "⚠️ Warning zone";
  } else {
    return "🚨 Danger zone";
  }
}

function AxisBottom({ x, width, height }: { x: any; width: number; height: number }) {
  const ticks = 11;
  const step = (x.domain()[1] - x.domain()[0]) / (ticks - 1);
  const values = new Array(ticks).fill(0).map((_, i) => Math.round(x.domain()[0] + i * step));
  return (
    <g transform={`translate(0, ${height})`}>
      {values.map((m: number) => (
        <g key={m} transform={`translate(${x(m)}, 0)`}>
          <line y1={0} y2={-height} stroke="#f1f5f9" />
          <text y={18} textAnchor="middle" fontSize={10} fill="#475569">{Math.floor(m / 12)}y</text>
        </g>
      ))}
    </g>
  );
}

function AxisLeft({ y, height: _height }: { y: any; height: number }) {
  const domain = y.domain();
  const min = domain[0];
  const max = domain[1];
  const range = max - min;
  
  // Create meaningful tick values with better formatting
  const ticks = [];
  if (range > 0) {
    const step = range / 6; // 6 horizontal lines for better readability
    for (let i = 0; i <= 6; i++) {
      const value = min + (step * i);
      ticks.push(value);
    }
  }
  
  return (
    <g>
      {ticks.map((value: number) => (
        <g key={value} transform={`translate(0, ${y(value)})`}>
          <line x1={0} x2={-40} stroke="#e2e8f0" strokeWidth={1} />
          <text x={-45} y={4} textAnchor="end" fontSize={9} fill="#64748b" fontFamily="ui-monospace, monospace">
            {formatCompact(value)}
          </text>
        </g>
      ))}
    </g>
  );
}

function ExtremumMarkers({ x, y, data }: { x: any; y: any; data: any[] }) {
  if (data.length < 3) return null;
  
  // Find peaks and troughs for Net Worth
  const extremums: Array<{ index: number; value: number; type: 'peak' | 'trough' }> = [];
  
  for (let i = 1; i < data.length - 1; i++) {
    const prev = data[i - 1].netWorth;
    const curr = data[i].netWorth;
    const next = data[i + 1].netWorth;
    
    // Peak: higher than neighbors
    if (curr > prev && curr > next) {
      extremums.push({ index: i, value: curr, type: 'peak' });
    }
    // Trough: lower than neighbors
    else if (curr < prev && curr < next) {
      extremums.push({ index: i, value: curr, type: 'trough' });
    }
  }
  
  // Only show the most significant extremums (top 3 peaks and bottom 3 troughs)
  const peaks = extremums.filter(e => e.type === 'peak').sort((a, b) => b.value - a.value).slice(0, 3);
  const troughs = extremums.filter(e => e.type === 'trough').sort((a, b) => a.value - b.value).slice(0, 3);
  
  return (
    <g>
      {[...peaks, ...troughs].map((ext, i) => {
        const point = data[ext.index];
        const xPos = x(point.m);
        const yPos = y(ext.value);
        
        return (
          <g key={`extremum-${i}`}>
            <circle
              cx={xPos}
              cy={yPos}
              r={4}
              fill={ext.type === 'peak' ? '#10b981' : '#ef4444'}
              stroke="white"
              strokeWidth={2}
            />
            <text
              x={xPos}
              y={ext.type === 'peak' ? yPos - 12 : yPos + 16}
              textAnchor="middle"
              fontSize={8}
              fill={ext.type === 'peak' ? '#10b981' : '#ef4444'}
              fontWeight="bold"
              fontFamily="ui-monospace, monospace"
              stroke="white"
              strokeWidth={2}
              paintOrder="stroke fill"
            >
              {formatCompact(ext.value)}
            </text>
          </g>
        );
      })}
    </g>
  );
}

function SeriesAreas({ x, y, data }: { x: any; y: any; data: any[] }) {
  const toX = (p: any) => x(p.m);
  return (
    <g>
      <Area data={data} x={toX} y={y} get={(p: any) => p.income} color="#22c55e33" stroke="#16a34a" />
      <Area data={data} x={toX} y={y} get={(p: any) => p.expense} color="#ef444433" stroke="#dc2626" />
      <Area data={data} x={toX} y={y} get={(p: any) => p.invest} color="#3b82f633" stroke="#2563eb" />
      <Line data={data} x={toX} y={y} get={(p: any) => p.netWorth} stroke="#7c3aed" />
      <Line data={data} x={toX} y={y} get={(p: any) => p.safety} stroke="#f97316" dash="4 4" />
      
      {/* Danger zones highlighting */}
      {data.map((p: any, i: number) => {
        if (p.netWorth < 0) {
          return (
            <rect
              key={`danger-${i}`}
              x={x(p.m) - 1}
              y={0}
              width={2}
              height={260}
              fill="rgba(239, 68, 68, 0.05)"
              className="pointer-events-none"
            />
          );
        }
        return null;
      })}
      
      {/* Warning zones highlighting (safety level below target) */}
      {data.map((p: any, i: number) => {
        if (p.safety > 0 && p.netWorth > 0 && p.netWorth < p.safety) {
          const safetyRatio = p.netWorth / p.safety;
          if (safetyRatio >= 0.5) {
            return (
              <rect
                key={`warning-${i}`}
                x={x(p.m) - 1}
                y={0}
                width={2}
                height={260}
                fill="rgba(245, 158, 11, 0.05)"
                className="pointer-events-none"
              />
            );
          }
        }
        return null;
      })}
    </g>
  );
}

function Area({ data, x, y, get, color, stroke }: any) {
  const path = data.map((p: any) => ({ x: x(p), y: y(get(p)) }));
  return (
    <g>
      <AreaClosed data={path} x={(d: any) => d.x} y={(d: any) => d.y} yScale={y} fill={color} stroke={stroke} curve={curveMonotoneX} />
    </g>
  );
}

function Line({ data, x, y, get, stroke, dash }: any) {
  const path = data.map((p: any) => ({ x: x(p), y: y(get(p)) }));
  return <LinePath data={path} x={(d: any) => d.x} y={(d: any) => d.y} stroke={stroke} strokeDasharray={dash} curve={curveMonotoneX} />;
}

function Milestones({ x, height, zoom, milestones }: any) {
  const [min, max] = zoom as [number, number];
  return (
    <g>
      {milestones.filter((m: any) => m.at.monthIndex >= min && m.at.monthIndex <= max).map((m: any) => (
        <g key={m.id}>
          <line x1={x(m.at.monthIndex)} x2={x(m.at.monthIndex)} y1={0} y2={height} stroke="#94a3b8" strokeDasharray="2 2" />
          <text
            x={x(m.at.monthIndex)}
            y={height - 8}
            textAnchor="middle"
            fontSize="9"
            fill="#64748b"
            className="pointer-events-none"
          >
            📍 {m.label}
          </text>
        </g>
      ))}
    </g>
  );
}

function HoverTooltip({ x, y, age, income, expense, loans, invest, netWorth, safety, milestone }: any) {
  return (
    <div style={{ position: 'absolute', left: Math.max(8, x + 8), top: y, pointerEvents: 'none' }} className="px-2 py-2 rounded border bg-white text-[11px] shadow min-w-[180px]">
      <div className="font-medium">{age}</div>
      {milestone ? <div className="text-[10px] text-slate-500">Milestone: {milestone}</div> : null}
      <div className="mt-1 grid grid-cols-2 gap-x-2">
        <span className="text-green-600">Income</span><span className="text-right">{format(income)}</span>
        <span className="text-red-600">Expenses</span><span className="text-right">{format(expense)}</span>
        <span className="text-yellow-600">Loans</span><span className="text-right">{format(loans)}</span>
        <span className="text-blue-600">Investments</span><span className="text-right">{format(invest)}</span>
        <span className="text-violet-600">Net Worth</span><span className="text-right">{format(netWorth)}</span>
        <span className="text-orange-600">Safety</span><span className="text-right">{format(safety)}</span>
      </div>
    </div>
  );
}


