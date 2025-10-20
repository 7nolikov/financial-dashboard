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
        <div className="flex items-center gap-2 text-xs">
          <span className="inline-flex items-center gap-1"><span className="inline-block w-2 h-2 rounded bg-green-500"></span>Income</span>
          <span className="inline-flex items-center gap-1"><span className="inline-block w-2 h-2 rounded bg-red-500"></span>Expenses</span>
          <span className="inline-flex items-center gap-1"><span className="inline-block w-2 h-2 rounded bg-blue-500"></span>Investments</span>
          <span className="inline-flex items-center gap-1"><span className="inline-block w-2 h-2 rounded bg-violet-500"></span>Net Worth</span>
          <span className="inline-flex items-center gap-1"><span className="inline-block w-2 h-2 rounded border-2 border-orange-500"></span>Safety</span>
        </div>
      </div>
      <div className="px-4 py-3 text-[13px]">
        <div className="grid grid-cols-5 gap-4">
          <Kpi label="Income (visible)" value={format(sum(visible.map((p) => p.income)))} color="text-green-600" title={`Sum of income in visible window (${state.inflation.display.seriesMode})`} />
          <Kpi label="Expenses (visible)" value={format(sum(visible.map((p) => p.expense)))} color="text-red-600" title={`Sum of expenses in visible window (${state.inflation.display.seriesMode})`} />
          <Kpi label="Investments (last)" value={format(last?.invest)} color="text-blue-600" title="Total investment balance at the latest visible month" />
          <Kpi label="Net Worth (last)" value={format(last?.netWorth)} color="text-violet-600" title="Net worth at the latest visible month" />
          <Kpi label="Safety (visible)" value={format(sum(visible.map((p) => p.safety)))} color="text-orange-600" title="Sum of safety savings targets over visible window" />
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
            onMouseLeave={() => setHovered(null)}
            style={{ cursor: 'crosshair' }}
            onMouseEnter={() => { document.body.style.overflowY = 'hidden'; }}
            onMouseLeave={() => { document.body.style.overflowY = ''; setHovered(null); }}
          >
            <g transform={`translate(${40},${10})`}>
              <rect x={0} y={0} width={width - 60} height={240} fill="url(#bg)" />
              <defs>
                <linearGradient id="bg" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor="#f8fafc" />
                  <stop offset="100%" stopColor="#eef2f7" />
                </linearGradient>
              </defs>
              <AxisBottom x={x} width={width - 60} height={240} />
              <SeriesAreas x={x} y={y} data={visible} />
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

function Kpi(props: { label: string; value: string; color?: string; title?: string }) {
  return (
    <div className="rounded-md border p-3" title={props.title}>
      <div className="text-xs text-slate-500">{props.label}</div>
      <div className={`text-lg font-semibold ${props.color ?? ''}`}>{props.value}</div>
    </div>
  );
}

function sum(arr: number[]): number { return arr.reduce((a, b) => a + b, 0); }

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

function SeriesAreas({ x, y, data }: { x: any; y: any; data: any[] }) {
  const toX = (p: any) => x(p.m);
  return (
    <g>
      <Area data={data} x={toX} y={y} get={(p) => p.income} color="#22c55e33" stroke="#16a34a" />
      <Area data={data} x={toX} y={y} get={(p) => p.expense} color="#ef444433" stroke="#dc2626" />
      <Area data={data} x={toX} y={y} get={(p) => p.invest} color="#3b82f633" stroke="#2563eb" />
      <Line data={data} x={toX} y={y} get={(p) => p.netWorth} stroke="#7c3aed" />
      <Line data={data} x={toX} y={y} get={(p) => p.safety} stroke="#f97316" dash="4 4" />
    </g>
  );
}

function Area({ data, x, y, get, color, stroke }: any) {
  const path = data.map((p: any) => ({ x: x(p), y: y(get(p)) }));
  return (
    <g>
      <AreaClosed data={path} x={(d) => d.x} y={(d) => d.y} yScale={y} fill={color} stroke={stroke} curve={curveMonotoneX} />
    </g>
  );
}

function Line({ data, x, y, get, stroke, dash }: any) {
  const path = data.map((p: any) => ({ x: x(p), y: y(get(p)) }));
  return <LinePath data={path} x={(d) => d.x} y={(d) => d.y} stroke={stroke} strokeDasharray={dash} curve={curveMonotoneX} />;
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

function HoverTooltip({ x, y, age, income, expense, invest, netWorth, safety, milestone }: any) {
  return (
    <div style={{ position: 'absolute', left: Math.max(8, x + 8), top: y, pointerEvents: 'none' }} className="px-2 py-2 rounded border bg-white text-[11px] shadow min-w-[180px]">
      <div className="font-medium">{age}</div>
      {milestone ? <div className="text-[10px] text-slate-500">Milestone: {milestone}</div> : null}
      <div className="mt-1 grid grid-cols-2 gap-x-2">
        <span className="text-green-600">Income</span><span className="text-right">{format(income)}</span>
        <span className="text-red-600">Expenses</span><span className="text-right">{format(expense)}</span>
        <span className="text-blue-600">Investments</span><span className="text-right">{format(invest)}</span>
        <span className="text-violet-600">Net Worth</span><span className="text-right">{format(netWorth)}</span>
        <span className="text-orange-600">Safety</span><span className="text-right">{format(safety)}</span>
      </div>
    </div>
  );
}


