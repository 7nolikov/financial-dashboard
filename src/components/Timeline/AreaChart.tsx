import React from 'react';
import { useStore } from '../../state/store';
import { useSeries } from '../../state/SeriesContext';
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
  const series = useSeries(); // shared — no recomputation on zoom
  const visible = series.slice(state.chart.zoom.minMonth, state.chart.zoom.maxMonth);
  const last = visible.at(-1);
  const totalMonths = 100 * 12;
  const [hovered, setHovered] = React.useState<number | null>(null);
  const hoveredPoint = hovered != null ? visible.find((p) => p.m === hovered) : undefined;
  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const [width, setWidth] = React.useState<number>(1000);
  const [isMobile, setIsMobile] = React.useState<boolean>(false);
  const [pendingMilestone, setPendingMilestone] = React.useState<{ month: number; x: number } | null>(null);
  const [milestoneLabel, setMilestoneLabel] = React.useState('');
  const milestoneInputRef = React.useRef<HTMLInputElement | null>(null);

  React.useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const updateDimensions = () => {
      setWidth(el.clientWidth);
      setIsMobile(window.innerWidth < 640);
    };

    const ro = new ResizeObserver(updateDimensions);
    ro.observe(el);
    updateDimensions();

    window.addEventListener('resize', updateDimensions);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', updateDimensions);
    };
  }, []);

  React.useEffect(() => {
    if (pendingMilestone && milestoneInputRef.current) {
      milestoneInputRef.current.focus();
    }
  }, [pendingMilestone]);

  const height = isMobile ? 200 : 260;
  const padding = { left: isMobile ? 30 : 40, right: 20, top: 10, bottom: 30 };
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
    e.preventDefault();
    e.stopPropagation();
    const delta = Math.sign(e.deltaY);
    const range = state.chart.zoom.maxMonth - state.chart.zoom.minMonth;
    const mouseX = (e.nativeEvent as MouseEvent).offsetX - padding.left;
    const centerMonth = Math.round(x.invert(Math.max(0, Math.min(innerW, mouseX))));
    const zoomFactor = delta > 0 ? 1.2 : 0.8;
    let newRange = Math.max(12, Math.min(totalMonths, Math.round(range * zoomFactor)));
    let min = centerMonth - Math.round(newRange / 2);
    let max = centerMonth + Math.round(newRange / 2);
    if (min < 0) { max -= min; min = 0; }
    if (max > totalMonths) { min -= (max - totalMonths); max = totalMonths; }
    min = Math.max(0, min); max = Math.min(totalMonths, max);
    setZoom(min, max);
  }

  function onClick(e: React.MouseEvent) {
    if (pendingMilestone) return;
    const mouseX = (e.nativeEvent as MouseEvent).offsetX - padding.left;
    const month = Math.round(x.invert(Math.max(0, Math.min(innerW, mouseX))));
    const svgRect = containerRef.current?.getBoundingClientRect();
    const clickX = e.clientX - (svgRect?.left ?? 0);
    setPendingMilestone({ month, x: clickX });
    setMilestoneLabel('');
  }

  function confirmMilestone() {
    if (!pendingMilestone || !milestoneLabel.trim()) {
      setPendingMilestone(null);
      return;
    }
    addMilestone({
      id: `ms-${Date.now()}`,
      at: { ageYears: Math.floor(pendingMilestone.month / 12), monthIndex: pendingMilestone.month },
      label: milestoneLabel.trim(),
    });
    setPendingMilestone(null);
    setMilestoneLabel('');
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-50 to-slate-100 px-6 py-4 border-b border-slate-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-gradient-to-br from-slate-700 to-slate-900 rounded-lg flex items-center justify-center shadow-sm">
              <span className="text-white font-bold text-lg">📈</span>
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-800">Financial Projection Timeline</h2>
              <div className="flex items-center gap-3 mt-1">
                <div className={`text-xs px-3 py-1 rounded-md font-semibold ${
                  state.inflation.display.seriesMode === 'nominal'
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                    : 'bg-blue-100 text-blue-800 border border-blue-200'
                }`}>
                  {state.inflation.display.seriesMode === 'nominal' ? 'Nominal Values' : 'Real Values'}
                  ({((state.inflation.singleRate ?? 0) * 100).toFixed(1)}% inflation)
                </div>
              </div>
            </div>
          </div>

          {/* Legend */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-white rounded-md border border-slate-200 shadow-sm">
              <span className="inline-block w-3 h-3 rounded bg-emerald-500"></span>
              <span className="font-semibold text-slate-700">Income</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 bg-white rounded-md border border-slate-200 shadow-sm">
              <span className="inline-block w-3 h-3 rounded bg-red-500"></span>
              <span className="font-semibold text-slate-700">Expenses</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 bg-white rounded-md border border-slate-200 shadow-sm">
              <span className="inline-block w-3 h-3 rounded bg-blue-500"></span>
              <span className="font-semibold text-slate-700">Investments</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 bg-white rounded-md border border-slate-200 shadow-sm">
              <span className="inline-block w-3 h-3 rounded bg-amber-500"></span>
              <span className="font-semibold text-slate-700">Loans</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 bg-white rounded-md border border-slate-200 shadow-sm">
              <span className="inline-block w-3 h-3 rounded bg-violet-500"></span>
              <span className="font-semibold text-slate-700">Net Worth</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 bg-white rounded-md border border-slate-200 shadow-sm">
              <span className="inline-block w-3 h-3 rounded border-2 border-orange-500"></span>
              <span className="font-semibold text-slate-700">Safety</span>
            </div>
          </div>
        </div>
      </div>
      <div className="px-4 py-3 text-[13px]">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          <Kpi
            label="Income"
            value={format(sum(visible.map((p) => p.income)))}
            color="text-green-600"
            title={`Sum of income in visible window (${state.inflation.display.seriesMode})`}
            status={sum(visible.map((p) => p.income)) > 0 ? 'Good cash flow' : 'No income'}
          />
          <Kpi
            label="Expenses"
            value={format(sum(visible.map((p) => p.expense)))}
            color="text-red-600"
            title={`Sum of expenses in visible window (${state.inflation.display.seriesMode})`}
            status={sum(visible.map((p) => p.expense)) > sum(visible.map((p) => p.income)) ? '⚠️ Overspending' : 'Controlled'}
          />
          <Kpi
            label="Investments"
            value={format(last?.invest)}
            color="text-blue-600"
            title="Total investment balance at the latest visible month"
            status={last?.invest && last.invest > 100000 ? 'Strong growth' : last?.invest && last.invest > 50000 ? 'Building wealth' : 'Early stage'}
          />
          <Kpi
            label="Loans"
            value={format(last?.loans)}
            color="text-yellow-600"
            title="Total loan balance at the latest visible month"
            status={last?.loans && last.loans > 100000 ? 'High debt' : last?.loans && last.loans > 50000 ? 'Moderate debt' : last?.loans && last.loans > 0 ? 'Low debt' : 'Debt free'}
          />
          <Kpi
            label="Net Worth"
            value={format(last?.netWorth)}
            color="text-violet-600"
            title="Net worth at the latest visible month"
            status={last?.netWorth && last.netWorth < 0 ? '🚨 Negative' : last?.netWorth && last.netWorth > 500000 ? 'Wealthy' : last?.netWorth && last.netWorth > 100000 ? 'Comfortable' : 'Building'}
          />
          <Kpi
            label="Safety Level"
            value={format(last?.safety)}
            color="text-orange-600"
            title="Safety savings target at the latest visible month"
            status={getSafetyStatus(last?.netWorth, last?.safety)}
          />
        </div>
        <div className="mt-6 rounded-xl border border-slate-200 bg-white relative shadow-sm" ref={containerRef}>
          <svg
            role="img"
            aria-label="Financial projection timeline chart"
            width="100%"
            height={height}
            viewBox={`0 0 ${width} ${height}`}
            onWheel={onWheel}
            onClick={onClick}
            onMouseMove={(e) => {
              const mx = (e.nativeEvent as MouseEvent).offsetX - padding.left;
              const m = Math.round(x.invert(Math.max(0, Math.min(innerW, mx))));
              setHovered(m);
            }}
            onMouseLeave={() => { setHovered(null); }}
          >
            <g transform={`translate(${padding.left},${padding.top})`}>
              <rect x={0} y={0} width={innerW} height={innerH} fill="url(#bg)" />
              <defs>
                <linearGradient id="bg" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor="#ffffff" />
                  <stop offset="100%" stopColor="#f8fafc" />
                </linearGradient>
              </defs>
              <AxisBottom x={x} innerW={innerW} innerH={innerH} />
              <AxisLeft y={y} innerH={innerH} />
              <SeriesAreas x={x} y={y} data={visible} innerH={innerH} />
              <ExtremumMarkers x={x} y={y} data={visible} />
              <Milestones x={x} innerH={innerH} zoom={[state.chart.zoom.minMonth, state.chart.zoom.maxMonth]} milestones={state.milestones} />
              {hovered != null && (
                <line x1={x(hovered)} x2={x(hovered)} y1={0} y2={innerH} stroke="#94a3b8" strokeDasharray="4 4" />
              )}
            </g>
          </svg>

          {/* Inline milestone input */}
          {pendingMilestone && (
            <div
              className="absolute top-2 z-20 bg-white border border-blue-300 rounded-xl shadow-xl p-3 flex flex-col gap-2 min-w-[220px]"
              style={{ left: Math.min(pendingMilestone.x, width - 240) }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="text-xs font-semibold text-slate-700">
                📍 Add milestone at age {Math.floor(pendingMilestone.month / 12)}
              </div>
              <input
                ref={milestoneInputRef}
                className="border border-slate-300 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                placeholder="e.g. Buy a house"
                value={milestoneLabel}
                onChange={(e) => setMilestoneLabel(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') confirmMilestone();
                  if (e.key === 'Escape') setPendingMilestone(null);
                }}
                maxLength={40}
              />
              <div className="flex gap-2 justify-end">
                <button
                  className="px-3 py-1 text-xs border border-slate-300 rounded-lg hover:bg-slate-50 font-medium"
                  onClick={() => setPendingMilestone(null)}
                >
                  Cancel
                </button>
                <button
                  className="px-3 py-1 text-xs bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium disabled:opacity-50"
                  disabled={!milestoneLabel.trim()}
                  onClick={confirmMilestone}
                >
                  Add
                </button>
              </div>
            </div>
          )}

          {hovered != null && (
            <HoverTooltip
              x={padding.left + x(hovered)}
              y={padding.top + 2}
              containerWidth={width}
              age={`${Math.floor(hovered / 12)}y ${hovered % 12}m`}
              income={hoveredPoint?.income}
              expense={hoveredPoint?.expense}
              loans={hoveredPoint?.loans}
              invest={hoveredPoint?.invest}
              netWorth={hoveredPoint?.netWorth}
              safety={hoveredPoint?.safety}
              cashFlow={hoveredPoint?.cashFlow}
              milestone={state.milestones.find((m) => m.at.monthIndex === hovered)?.label}
            />
          )}
          <div className="flex items-center justify-between px-4 py-3 border-t bg-gradient-to-r from-slate-50 to-slate-100 text-xs">
            <button
              onClick={() => setZoom(0, totalMonths)}
              className="px-4 py-2 border border-slate-300 rounded-md hover:bg-white hover:border-slate-400 transition-all text-xs font-semibold text-slate-700"
            >
              Reset Zoom
            </button>
            <div className="text-xs text-slate-600 font-medium">Scroll to zoom • Click to add milestone</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Kpi(props: { label: string; value: string; color?: string; title?: string; status?: string }) {
  return (
    <div className="bg-white rounded-lg border border-slate-200 p-4 shadow-sm hover:shadow-md transition-all duration-200" title={props.title}>
      <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">{props.label}</div>
      <div className={`text-xl font-bold ${props.color ?? 'text-slate-800'} mb-1`}>{props.value}</div>
      {props.status && <div className="text-xs text-slate-500 font-medium">{props.status}</div>}
    </div>
  );
}

function sum(arr: number[]): number { return arr.reduce((a, b) => a + b, 0); }

function getSafetyStatus(netWorth: number | undefined, safetyTarget: number | undefined): string {
  if (!netWorth || !safetyTarget) return 'No safety target';
  const safetyRatio = netWorth / safetyTarget;
  if (safetyRatio >= 1.0) return '✅ Safe';
  else if (safetyRatio >= 0.5) return '⚠️ Warning zone';
  else return '🚨 Danger zone';
}

function AxisBottom({ x, innerW, innerH }: { x: any; innerW: number; innerH: number }) {
  const ticks = 11;
  const step = (x.domain()[1] - x.domain()[0]) / (ticks - 1);
  const values = new Array(ticks).fill(0).map((_, i) => Math.round(x.domain()[0] + i * step));
  const minAge = values.length > 0 ? Math.floor((values[0] ?? 0) / 12) : 0;
  const maxAge = values.length > 0 ? Math.floor((values[values.length - 1] ?? 0) / 12) : 100;

  return (
    <g transform={`translate(0, ${innerH})`}>
      <line x1={0} x2={innerW} y1={0} y2={0} stroke="#e2e8f0" strokeWidth={1} />
      {values.map((m: number) => (
        <g key={m} transform={`translate(${x(m)}, 0)`}>
          <line y1={0} y2={-innerH} stroke="#f1f5f9" strokeWidth={1} />
          <text y={18} textAnchor="middle" fontSize={10} fill="#64748b" fontWeight="500">
            {Math.floor(m / 12)}y
          </text>
        </g>
      ))}
      <text x={0} y={35} fontSize={11} fill="#475569" fontWeight="600" textAnchor="start">
        Age: {minAge}y
      </text>
      <text x={innerW} y={35} fontSize={11} fill="#475569" fontWeight="600" textAnchor="end">
        Age: {maxAge}y
      </text>
    </g>
  );
}

function AxisLeft({ y, innerH }: { y: any; innerH: number }) {
  const domain = y.domain();
  const min = domain[0];
  const max = domain[1];
  const range = max - min;

  const ticks: number[] = [];
  if (range > 0) {
    const step = range / 6;
    for (let i = 0; i <= 6; i++) {
      ticks.push(min + step * i);
    }
  }

  return (
    <g>
      <line x1={0} x2={0} y1={0} y2={innerH} stroke="#e2e8f0" strokeWidth={1} />
      {ticks.map((value: number) => (
        <g key={value} transform={`translate(0, ${y(value)})`}>
          <line x1={0} x2={-6} stroke="#e2e8f0" strokeWidth={1} />
          <text x={-10} y={4} textAnchor="end" fontSize={9} fill="#64748b" fontFamily="ui-monospace, monospace" fontWeight="500">
            {formatCompact(value)}
          </text>
        </g>
      ))}
    </g>
  );
}

function ExtremumMarkers({ x, y, data }: { x: any; y: any; data: any[] }) {
  if (data.length < 3) return null;

  const extremums: Array<{ index: number; value: number; type: 'peak' | 'trough' | 'savings-depleted' }> = [];

  for (let i = 1; i < data.length - 1; i++) {
    const prev = data[i - 1].netWorth;
    const curr = data[i].netWorth;
    const next = data[i + 1].netWorth;

    if (data[i].savingsDepleted) {
      extremums.push({ index: i, value: curr, type: 'savings-depleted' });
    } else if (curr > prev && curr > next) {
      extremums.push({ index: i, value: curr, type: 'peak' });
    } else if (curr < prev && curr < next) {
      extremums.push({ index: i, value: curr, type: 'trough' });
    }
  }

  const peaks = extremums.filter(e => e.type === 'peak').sort((a, b) => b.value - a.value).slice(0, 3);
  const troughs = extremums.filter(e => e.type === 'trough').sort((a, b) => a.value - b.value).slice(0, 3);
  const savingsDepleted = extremums.filter(e => e.type === 'savings-depleted');

  return (
    <g>
      {[...peaks, ...troughs, ...savingsDepleted].map((ext, i) => {
        const point = data[ext.index];
        const xPos = x(point.m);
        const yPos = y(ext.value);
        let fillColor = '#ef4444';
        let label = formatCompact(ext.value);
        if (ext.type === 'peak') fillColor = '#10b981';
        else if (ext.type === 'savings-depleted') { fillColor = '#dc2626'; label = '💸 Depleted'; }
        return (
          <g key={`extremum-${i}`}>
            <circle cx={xPos} cy={yPos} r={ext.type === 'savings-depleted' ? 6 : 4} fill={fillColor} stroke="white" strokeWidth={2} />
            <text
              x={xPos}
              y={ext.type === 'peak' ? yPos - 12 : yPos + 16}
              textAnchor="middle"
              fontSize={ext.type === 'savings-depleted' ? 9 : 8}
              fill={fillColor}
              fontWeight="bold"
              fontFamily="ui-monospace, monospace"
              stroke="white"
              strokeWidth={2}
              paintOrder="stroke fill"
            >
              {label}
            </text>
          </g>
        );
      })}
    </g>
  );
}

/**
 * Collapse a boolean predicate over data into a list of contiguous [start, end]
 * month ranges. Renders O(ranges) rects instead of O(data.length) rects —
 * worst-case goes from ~2,400 SVG elements to a handful.
 */
function computeZoneRanges(
  data: Array<{ m: number }>,
  predicate: (p: any) => boolean,
): Array<{ start: number; end: number }> {
  const ranges: Array<{ start: number; end: number }> = [];
  let start: number | null = null;
  for (const p of data) {
    if (predicate(p)) {
      if (start === null) start = p.m;
    } else {
      if (start !== null) { ranges.push({ start, end: p.m }); start = null; }
    }
  }
  if (start !== null && data.length > 0) {
    ranges.push({ start, end: data[data.length - 1]!.m });
  }
  return ranges;
}

function SeriesAreas({ x, y, data, innerH }: { x: any; y: any; data: any[]; innerH: number }) {
  const toX = (p: { m: number }) => x(p.m);

  const dangerRanges = React.useMemo(
    () => computeZoneRanges(data, (p) => p.netWorth < 0),
    [data],
  );
  const warningRanges = React.useMemo(
    () => computeZoneRanges(data, (p) => p.safety > 0 && p.netWorth > 0 && p.netWorth < p.safety && p.netWorth / p.safety >= 0.5),
    [data],
  );

  return (
    <g>
      <Area data={data} x={toX} y={y} get={(p: { income: number }) => p.income} color="#22c55e33" stroke="#16a34a" />
      <Area data={data} x={toX} y={y} get={(p: { expense: number }) => p.expense} color="#ef444433" stroke="#dc2626" />
      <Area data={data} x={toX} y={y} get={(p: { invest: number }) => p.invest} color="#3b82f633" stroke="#2563eb" />
      <Line data={data} x={toX} y={y} get={(p: { netWorth: number }) => p.netWorth} stroke="#7c3aed" />
      <Line data={data} x={toX} y={y} get={(p: { safety: number }) => p.safety} stroke="#f97316" dash="4 4" />

      {/* Danger zones — one rect per contiguous range, not per data point */}
      {dangerRanges.map((r) => (
        <rect
          key={`danger-${r.start}`}
          x={x(r.start)}
          y={0}
          width={Math.max(1, x(r.end) - x(r.start))}
          height={innerH}
          fill="rgba(239,68,68,0.06)"
          className="pointer-events-none"
        />
      ))}

      {/* Warning zones — one rect per contiguous range */}
      {warningRanges.map((r) => (
        <rect
          key={`warning-${r.start}`}
          x={x(r.start)}
          y={0}
          width={Math.max(1, x(r.end) - x(r.start))}
          height={innerH}
          fill="rgba(245,158,11,0.06)"
          className="pointer-events-none"
        />
      ))}
    </g>
  );
}

function Area({ data, x, y, get, color, stroke }: any) {
  const path = data.map((p: unknown) => ({ x: x(p as number), y: y(get(p)) }));
  return (
    <g>
      <AreaClosed data={path} x={(d: { x: number; y: number }) => d.x} y={(d: { x: number; y: number }) => d.y} yScale={y} fill={color} stroke={stroke} curve={curveMonotoneX} />
    </g>
  );
}

function Line({ data, x, y, get, stroke, dash }: any) {
  const path = data.map((p: unknown) => ({ x: x(p as number), y: y(get(p)) }));
  return <LinePath data={path} x={(d: { x: number; y: number }) => d.x} y={(d: { x: number; y: number }) => d.y} stroke={stroke} strokeDasharray={dash} curve={curveMonotoneX} />;
}

function Milestones({ x, innerH, zoom, milestones }: any) {
  const [min, max] = zoom as [number, number];
  const visibleMilestones = milestones.filter((m: any) => m.at.monthIndex >= min && m.at.monthIndex <= max);

  const labelHeight = 20;
  const labelSpacing = 5;
  const labelPositions: Array<{ milestone: any; x: number; y: number; width: number }> = [];

  visibleMilestones.forEach((m: any) => {
    const xPos = x(m.at.monthIndex);
    const text = `📍 ${m.label}`;
    const estimatedWidth = text.length * 6;
    labelPositions.push({ milestone: m, x: xPos, y: innerH - 8, width: estimatedWidth });
  });

  const resolvedPositions: Array<{ milestone: any; x: number; y: number }> = [];
  const occupiedRanges: Array<{ x: number; width: number; bottomY: number }> = [];

  labelPositions.forEach((label) => {
    let finalY = label.y;
    let hasOverlap = true;
    let attempts = 0;
    while (hasOverlap && attempts < 10) {
      hasOverlap = false;
      for (const occupied of occupiedRanges) {
        const labelLeft = label.x - label.width / 2;
        const labelRight = label.x + label.width / 2;
        const occupiedLeft = occupied.x - occupied.width / 2;
        const occupiedRight = occupied.x + occupied.width / 2;
        if (labelLeft < occupiedRight && labelRight > occupiedLeft) {
          if (finalY < occupied.bottomY + labelSpacing) {
            hasOverlap = true;
            finalY = occupied.bottomY + labelSpacing;
            break;
          }
        }
      }
      attempts++;
    }
    occupiedRanges.push({ x: label.x, width: label.width, bottomY: finalY + labelHeight });
    resolvedPositions.push({ milestone: label.milestone, x: label.x, y: finalY });
  });

  return (
    <g>
      {resolvedPositions.map((pos) => (
        <g key={pos.milestone.id}>
          <line x1={pos.x} x2={pos.x} y1={0} y2={innerH} stroke="#94a3b8" strokeDasharray="2 2" strokeWidth={1} />
          <text
            x={pos.x}
            y={pos.y}
            textAnchor="middle"
            fontSize="9"
            fill="#64748b"
            className="pointer-events-none"
            style={{ fontFamily: 'ui-sans-serif, system-ui, sans-serif' }}
          >
            📍 {pos.milestone.label}
          </text>
        </g>
      ))}
    </g>
  );
}

function HoverTooltip({ x, y, containerWidth, age, income, expense, loans, invest, netWorth, safety, cashFlow, milestone }: any) {
  const tooltipWidth = 210;
  const left = x + 8 + tooltipWidth > containerWidth ? x - tooltipWidth - 8 : x + 8;
  return (
    <div style={{ position: 'absolute', left: Math.max(8, left), top: y, pointerEvents: 'none' }} className="px-3 py-2 rounded-lg border bg-white text-[11px] shadow-lg min-w-[200px]">
      <div className="font-medium text-slate-800">{age}</div>
      {milestone ? <div className="text-[10px] text-slate-500 mb-1">📍 {milestone}</div> : null}
      <div className="mt-1 grid grid-cols-2 gap-x-3 gap-y-1">
        <span className="text-green-600 font-medium">Income</span><span className="text-right">{format(income)}</span>
        <span className="text-red-600 font-medium">Expenses</span><span className="text-right">{format(expense)}</span>
        <span className="text-blue-600 font-medium">Cash Flow</span><span className={`text-right ${(cashFlow ?? 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>{format(cashFlow)}</span>
        <span className="text-yellow-600 font-medium">Loans</span><span className="text-right">{format(loans)}</span>
        <span className="text-blue-600 font-medium">Investments</span><span className="text-right">{format(invest)}</span>
        <span className="text-violet-600 font-medium">Net Worth</span><span className={`text-right ${(netWorth ?? 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>{format(netWorth)}</span>
        <span className="text-orange-600 font-medium">Safety</span><span className="text-right">{format(safety)}</span>
      </div>
    </div>
  );
}
