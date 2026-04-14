import React from 'react';
import { useStore } from '../../state/store';
import type { Income, Expense, Investment, Loan } from '../../state/store';
import { useSeries } from '../../state/SeriesContext';
import type { SeriesPoint } from '../../state/selectors';
import { scaleLinear } from '@visx/scale';
import { AreaClosed, LinePath } from '@visx/shape';
import { curveMonotoneX } from '@visx/curve';

type LinearScale = ReturnType<typeof scaleLinear<number>>;
type DerivedMilestone = { id: string; monthIndex: number; label: string };

function deriveMilestones(
  incomes: Income[],
  expenses: Expense[],
  investments: Investment[],
  loans: Loan[],
): DerivedMilestone[] {
  const ms: DerivedMilestone[] = [];

  for (const inc of incomes) {
    if (inc.recurrence.kind === 'recurring') {
      ms.push({
        id: `inc-${inc.id}`,
        monthIndex: inc.recurrence.start.monthIndex,
        label: inc.label,
      });
      if (inc.recurrence.end) {
        ms.push({
          id: `inc-end-${inc.id}`,
          monthIndex: inc.recurrence.end.monthIndex,
          label: `${inc.label} ends`,
        });
      }
    }
  }

  for (const exp of expenses) {
    if (exp.recurrence.kind === 'recurring' && exp.recurrence.start.monthIndex > 0) {
      ms.push({
        id: `exp-${exp.id}`,
        monthIndex: exp.recurrence.start.monthIndex,
        label: exp.label,
      });
    }
  }

  for (const inv of investments) {
    const start =
      inv.recurrence.kind === 'recurring'
        ? inv.recurrence.start.monthIndex
        : inv.recurrence.kind === 'one_time'
          ? inv.recurrence.at.monthIndex
          : null;
    if (start != null) {
      ms.push({ id: `inv-${inv.id}`, monthIndex: start, label: inv.label });
    }
  }

  for (const loan of loans) {
    if (loan.recurrence.kind === 'recurring') {
      ms.push({
        id: `loan-${loan.id}`,
        monthIndex: loan.recurrence.start.monthIndex,
        label: loan.label,
      });
      if (loan.recurrence.end) {
        ms.push({
          id: `loan-end-${loan.id}`,
          monthIndex: loan.recurrence.end.monthIndex,
          label: `${loan.label} paid off`,
        });
      }
    }
  }

  ms.sort((a, b) => a.monthIndex - b.monthIndex);

  // Deduplicate milestones at the same month — merge labels
  const deduped: DerivedMilestone[] = [];
  for (const m of ms) {
    const prev = deduped[deduped.length - 1];
    if (prev && Math.abs(prev.monthIndex - m.monthIndex) < 6) {
      prev.label = `${prev.label}, ${m.label}`;
      prev.id = `${prev.id}+${m.id}`;
    } else {
      deduped.push({ ...m });
    }
  }

  return deduped;
}

function format(n: number | undefined) {
  if (n == null) return '-';
  return new Intl.NumberFormat(undefined, { maximumFractionDigits: 0 }).format(n);
}

function formatCompact(n: number | undefined) {
  if (n == null) return '-';
  const sign = n < 0 ? '-' : '';
  const abs = Math.abs(n);
  if (abs >= 1_000_000) return `${sign}€${(abs / 1_000_000).toFixed(1)}M`;
  if (abs >= 1_000) return `${sign}€${(abs / 1_000).toFixed(0)}K`;
  return `${sign}€${abs.toFixed(0)}`;
}

export function AreaChart() {
  const state = useStore();
  const setZoom = useStore((s) => s.setZoom);
  const series = useSeries();
  const visible = series.slice(state.chart.zoom.minMonth, state.chart.zoom.maxMonth);

  const milestones = React.useMemo(
    () => deriveMilestones(state.incomes, state.expenses, state.investments, state.loans),
    [state.incomes, state.expenses, state.investments, state.loans],
  );

  // Compute FIRE month across the full series (not just visible window).
  const fireDateMonth = React.useMemo(() => {
    const dobYear = new Date(state.dobISO).getFullYear();
    const currentYear = new Date().getFullYear();
    const currentAgeMonths = Math.max(0, (currentYear - dobYear) * 12);
    const currentPoint = series[Math.min(currentAgeMonths, series.length - 1)];
    const annualExpenses = (currentPoint?.expense ?? 0) * 12;
    const fireNumber = annualExpenses * 25;
    if (fireNumber <= 0) return null;
    for (const point of series) {
      if (point.invest >= fireNumber) return point.m;
    }
    return null;
  }, [series, state.dobISO]);
  const retirementMonth = (state.retirement?.age ?? 65) * 12;
  const totalMonths = 100 * 12;
  const [hovered, setHovered] = React.useState<number | null>(null);
  const hoveredPoint = hovered != null ? visible.find((p) => p.m === hovered) : undefined;
  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const [width, setWidth] = React.useState<number>(1000);
  const [isMobile, setIsMobile] = React.useState<boolean>(false);

  const height = isMobile ? 300 : 340;
  // Mobile needs taller bottom padding to fit the larger axis tick labels and
  // the secondary "Age: …" labels without clipping the SVG viewBox; mobile
  // also needs slightly more left padding for the y-axis number labels.
  const padding = {
    left: isMobile ? 46 : 48,
    right: 20,
    top: 12,
    bottom: isMobile ? 56 : 32,
  };
  const innerW = width - padding.left - padding.right;
  const innerH = height - padding.top - padding.bottom;

  // Stable ref so event listeners added once can always read current values.
  const stateRef = React.useRef({ zoom: state.chart.zoom, innerW, padding, totalMonths });
  stateRef.current = { zoom: state.chart.zoom, innerW, padding, totalMonths };

  // Touch tracking ref for pan / pinch-to-zoom.
  const touchRef = React.useRef<{
    type: 'pan' | 'pinch';
    startX: number;
    startMinMonth: number;
    startMaxMonth: number;
    initialDistance: number;
    centerMonth: number;
    tapX: number;
    tapY: number;
  } | null>(null);

  React.useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    // ResizeObserver handles all size changes — no window resize listener needed.
    const updateDimensions = () => {
      setWidth(el.clientWidth);
      setIsMobile(window.innerWidth < 640);
    };
    const ro = new ResizeObserver(updateDimensions);
    ro.observe(el);
    updateDimensions();

    // Non-passive wheel listener so preventDefault() actually works in Chrome.
    const wheelHandler = (e: WheelEvent) => {
      e.preventDefault();
      const { zoom, innerW: iW, padding: p } = stateRef.current;
      const range = zoom.maxMonth - zoom.minMonth;
      const delta = Math.sign(e.deltaY);
      const rect = el.getBoundingClientRect();
      const mouseX = e.clientX - rect.left - p.left;
      const xScale = scaleLinear<number>({
        domain: [zoom.minMonth, zoom.maxMonth],
        range: [0, iW],
      });
      const centerMonth = Math.round(xScale.invert(Math.max(0, Math.min(iW, mouseX))));
      const zoomFactor = delta > 0 ? 1.2 : 0.8;
      const total = 100 * 12;
      let newRange = Math.max(12, Math.min(total, Math.round(range * zoomFactor)));
      let min = centerMonth - Math.round(newRange / 2);
      let max = centerMonth + Math.round(newRange / 2);
      if (min < 0) {
        max -= min;
        min = 0;
      }
      if (max > total) {
        min -= max - total;
        max = total;
      }
      setZoom(Math.max(0, min), Math.min(total, max));
    };
    el.addEventListener('wheel', wheelHandler, { passive: false });

    // Non-passive touchstart/touchmove so we can prevent page scroll during pan/pinch.
    const touchStartHandler = (e: TouchEvent) => {
      const { zoom, innerW: iW, padding: p } = stateRef.current;
      const rect = el.getBoundingClientRect();
      if (e.touches.length === 1) {
        const t = e.touches[0]!;
        touchRef.current = {
          type: 'pan',
          startX: t.clientX,
          startMinMonth: zoom.minMonth,
          startMaxMonth: zoom.maxMonth,
          initialDistance: 0,
          centerMonth: 0,
          tapX: t.clientX - rect.left - p.left,
          tapY: t.clientY - rect.top - p.top,
        };
      } else if (e.touches.length === 2) {
        e.preventDefault();
        const t0 = e.touches[0]!;
        const t1 = e.touches[1]!;
        const dist = Math.hypot(t1.clientX - t0.clientX, t1.clientY - t0.clientY);
        const midX = (t0.clientX + t1.clientX) / 2 - rect.left - p.left;
        const xScale = scaleLinear<number>({
          domain: [zoom.minMonth, zoom.maxMonth],
          range: [0, iW],
        });
        const centerMonth = Math.round(xScale.invert(Math.max(0, Math.min(iW, midX))));
        touchRef.current = {
          type: 'pinch',
          startX: 0,
          startMinMonth: zoom.minMonth,
          startMaxMonth: zoom.maxMonth,
          initialDistance: dist,
          centerMonth,
          tapX: 0,
          tapY: 0,
        };
      }
    };
    const touchMoveHandler = (e: TouchEvent) => {
      if (!touchRef.current) return;
      e.preventDefault();
      const { innerW: iW } = stateRef.current;
      const total = 100 * 12;
      const cur = touchRef.current;
      if (e.touches.length === 1 && cur.type === 'pan') {
        const t = e.touches[0]!;
        const range = cur.startMaxMonth - cur.startMinMonth;
        const pixelsPerMonth = iW / range;
        const dx = t.clientX - cur.startX;
        const monthDelta = Math.round(dx / pixelsPerMonth);
        let newMin = cur.startMinMonth - monthDelta;
        let newMax = cur.startMaxMonth - monthDelta;
        if (newMin < 0) {
          newMax -= newMin;
          newMin = 0;
        }
        if (newMax > total) {
          newMin -= newMax - total;
          newMax = total;
        }
        setZoom(Math.max(0, newMin), Math.min(total, newMax));
      } else if (e.touches.length === 2 && cur.type === 'pinch') {
        const t0 = e.touches[0]!;
        const t1 = e.touches[1]!;
        const currentDist = Math.hypot(t1.clientX - t0.clientX, t1.clientY - t0.clientY);
        if (currentDist < 1 || cur.initialDistance < 1) return;
        const scale = currentDist / cur.initialDistance;
        const initialRange = cur.startMaxMonth - cur.startMinMonth;
        let newRange = Math.max(12, Math.min(total, Math.round(initialRange / scale)));
        let newMin = cur.centerMonth - Math.round(newRange / 2);
        let newMax = cur.centerMonth + Math.round(newRange / 2);
        if (newMin < 0) {
          newMax -= newMin;
          newMin = 0;
        }
        if (newMax > total) {
          newMin -= newMax - total;
          newMax = total;
        }
        setZoom(Math.max(0, newMin), Math.min(total, newMax));
      }
    };
    const touchEndHandler = () => {
      touchRef.current = null;
    };
    el.addEventListener('touchstart', touchStartHandler, { passive: false });
    el.addEventListener('touchmove', touchMoveHandler, { passive: false });
    el.addEventListener('touchend', touchEndHandler);

    return () => {
      ro.disconnect();
      el.removeEventListener('wheel', wheelHandler);
      el.removeEventListener('touchstart', touchStartHandler);
      el.removeEventListener('touchmove', touchMoveHandler);
      el.removeEventListener('touchend', touchEndHandler);
    };
    // State is accessed via stateRef and setZoom is a stable Zustand action,
    // so this effect intentionally runs only once on mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const x = scaleLinear<number>({
    domain: [state.chart.zoom.minMonth, state.chart.zoom.maxMonth],
    range: [0, innerW],
  });
  const yDomain = React.useMemo(() => {
    const vals: number[] = [];
    for (const p of visible) {
      vals.push(p.income, p.expense, p.invest, p.loans, p.netWorth, p.safety);
    }
    const min = Math.min(...vals, 0);
    const max = Math.max(...vals, 1);
    return [min, max] as [number, number];
  }, [visible]);
  const y = scaleLinear<number>({ domain: yDomain, range: [innerH, 0] });

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-50 to-slate-100 px-4 sm:px-6 py-3.5 sm:py-4 border-b border-slate-200">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
            <div className="w-9 h-9 sm:w-10 sm:h-10 bg-gradient-to-br from-slate-700 to-slate-900 rounded-xl flex items-center justify-center shadow-md shrink-0">
              <span className="text-white font-bold text-base sm:text-lg" aria-hidden="true">
                📈
              </span>
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="text-[15px] sm:text-xl font-bold text-slate-900 truncate leading-tight">
                <span className="hidden sm:inline">Financial Projection Timeline</span>
                <span className="sm:hidden">Timeline</span>
              </h2>
              <div className="flex items-center gap-2 mt-1">
                <div
                  className={`text-[10px] sm:text-xs px-2 py-0.5 rounded-md font-semibold ${
                    state.inflation.display.seriesMode === 'nominal'
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                      : 'bg-blue-100 text-blue-800 border border-blue-200'
                  }`}
                >
                  {state.inflation.display.seriesMode === 'nominal' ? 'Nominal' : 'Real'} ·{' '}
                  {((state.inflation.singleRate ?? 0) * 100).toFixed(1)}% inf
                </div>
              </div>
            </div>
          </div>

          {/* Legend — compact on mobile, full on desktop */}
          <div className="hidden sm:flex flex-wrap items-center gap-2 text-xs shrink-0">
            {[
              { color: 'bg-emerald-500', label: 'Income', style: 'filled' as const },
              { color: 'bg-red-500', label: 'Expenses', style: 'filled' as const },
              { color: 'bg-blue-500', label: 'Investments', style: 'filled' as const },
              { color: 'bg-amber-600', label: 'Loans', style: 'dashed' as const },
              { color: 'bg-violet-500', label: 'Net Worth', style: 'filled' as const },
              { color: 'bg-orange-500', label: 'Safety', style: 'dashed' as const },
            ].map(({ color, label, style }) => (
              <div
                key={label}
                className="flex items-center gap-1.5 px-2.5 py-1.5 bg-white rounded-md border border-slate-200 shadow-sm"
              >
                {style === 'dashed' ? (
                  <span className="inline-flex items-center w-3 h-3">
                    <span
                      className={`inline-block w-3 h-[3px] ${color} rounded-full`}
                      style={{
                        backgroundImage:
                          'repeating-linear-gradient(90deg, currentColor 0, currentColor 2px, transparent 2px, transparent 4px)',
                      }}
                    />
                  </span>
                ) : (
                  <span className={`inline-block w-3 h-3 rounded ${color}`} />
                )}
                <span className="font-semibold text-slate-700">{label}</span>
              </div>
            ))}
          </div>
          {/* Mobile-only compact legend */}
          <div
            className="flex sm:hidden items-center gap-1.5 shrink-0"
            role="list"
            aria-label="Chart series legend"
          >
            {[
              { color: 'bg-emerald-500', title: 'Income' },
              { color: 'bg-red-500', title: 'Expenses' },
              { color: 'bg-blue-500', title: 'Investments' },
              { color: 'bg-amber-600', title: 'Loans' },
              { color: 'bg-violet-500', title: 'Net Worth' },
              { color: 'bg-orange-500', title: 'Safety' },
            ].map(({ color, title }) => (
              <span
                key={title}
                role="listitem"
                title={title}
                className={`inline-block w-2.5 h-2.5 rounded-full ring-1 ring-white shadow-sm ${color}`}
                aria-label={title}
              ></span>
            ))}
          </div>
        </div>
      </div>
      <div className="px-3 sm:px-4 py-3 sm:py-4">
        <div
          className="rounded-xl border border-slate-200 bg-white relative shadow-sm"
          ref={containerRef}
        >
          <svg
            role="img"
            aria-label="Financial projection timeline chart"
            width="100%"
            height={height}
            viewBox={`0 0 ${width} ${height}`}
            style={{ touchAction: 'none' }}
            onMouseMove={(e) => {
              const mx = (e.nativeEvent as MouseEvent).offsetX - padding.left;
              const m = Math.round(x.invert(Math.max(0, Math.min(innerW, mx))));
              setHovered(m);
            }}
            onMouseLeave={() => {
              setHovered(null);
            }}
          >
            <g transform={`translate(${padding.left},${padding.top})`}>
              <rect x={0} y={0} width={innerW} height={innerH} fill="url(#chartBg)" />
              <defs>
                <linearGradient id="chartBg" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor="#f8faff" />
                  <stop offset="100%" stopColor="#f1f5f9" />
                </linearGradient>
              </defs>
              <AxisBottom x={x} innerW={innerW} innerH={innerH} isMobile={isMobile} />
              <AxisLeft y={y} innerH={innerH} isMobile={isMobile} />
              <SeriesAreas
                x={x}
                y={y}
                data={visible}
                innerH={innerH}
                fireDateMonth={fireDateMonth}
                retirementMonth={retirementMonth}
              />
              <ExtremumMarkers x={x} y={y} data={visible} />
              <Milestones
                x={x}
                innerH={innerH}
                zoom={[state.chart.zoom.minMonth, state.chart.zoom.maxMonth]}
                milestones={milestones}
              />
              {hovered != null && (
                <line
                  x1={x(hovered)}
                  x2={x(hovered)}
                  y1={0}
                  y2={innerH}
                  stroke="#94a3b8"
                  strokeDasharray="4 4"
                />
              )}
            </g>
          </svg>

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
              milestone={milestones.find((m) => m.monthIndex === hovered)?.label}
            />
          )}
          <div className="flex items-center justify-between gap-2 px-3 sm:px-4 py-3 border-t bg-gradient-to-r from-slate-50 to-slate-100 text-xs">
            <button
              onClick={() => setZoom(0, totalMonths)}
              className="shrink-0 whitespace-nowrap px-3 py-2 border border-slate-300 rounded-md hover:bg-white hover:border-slate-400 transition-all text-xs font-semibold text-slate-700"
            >
              Reset Zoom
            </button>
            <div className="text-xs text-slate-600 font-medium hidden sm:block">
              Scroll to zoom • Hover to inspect
            </div>
            <div className="text-[11px] leading-tight text-slate-600 font-medium sm:hidden text-right min-w-0">
              Pinch to zoom • Pan to explore
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function AxisBottom({
  x,
  innerW,
  innerH,
  isMobile,
}: {
  x: LinearScale;
  innerW: number;
  innerH: number;
  isMobile: boolean;
}) {
  // Show fewer ticks on mobile so labels never collide.
  const ticks = isMobile ? 6 : 11;
  const [d0 = 0, d1 = 0] = x.domain();
  const step = (d1 - d0) / (ticks - 1);
  const values = new Array(ticks).fill(0).map((_, i) => Math.round(d0 + i * step));
  const minAge = values.length > 0 ? Math.floor((values[0] ?? 0) / 12) : 0;
  const maxAge = values.length > 0 ? Math.floor((values[values.length - 1] ?? 0) / 12) : 100;
  const tickFont = isMobile ? 12 : 10;
  const tickY = isMobile ? 20 : 18;
  const ageFont = isMobile ? 12 : 11;
  const ageY = isMobile ? 40 : 35;

  return (
    <g transform={`translate(0, ${innerH})`}>
      <line x1={0} x2={innerW} y1={0} y2={0} stroke="#e2e8f0" strokeWidth={1} />
      {values.map((m: number) => (
        <g key={m} transform={`translate(${x(m)}, 0)`}>
          <line y1={0} y2={-innerH} stroke="#e2e8f0" strokeWidth={1} />
          <text
            y={tickY}
            textAnchor="middle"
            fontSize={tickFont}
            fill="#64748b"
            fontWeight="500"
            style={{ fontVariantNumeric: 'tabular-nums' }}
          >
            {Math.floor(m / 12)}y
          </text>
        </g>
      ))}
      <text x={0} y={ageY} fontSize={ageFont} fill="#475569" fontWeight="600" textAnchor="start">
        Age: {minAge}y
      </text>
      <text x={innerW} y={ageY} fontSize={ageFont} fill="#475569" fontWeight="600" textAnchor="end">
        Age: {maxAge}y
      </text>
    </g>
  );
}

function AxisLeft({ y, innerH, isMobile }: { y: LinearScale; innerH: number; isMobile: boolean }) {
  const [min = 0, max = 0] = y.domain();
  const range = max - min;

  // Fewer ticks on mobile so larger labels do not collide vertically.
  const tickCount = isMobile ? 4 : 6;
  const ticks: number[] = [];
  if (range > 0) {
    const step = range / tickCount;
    for (let i = 0; i <= tickCount; i++) {
      ticks.push(min + step * i);
    }
  }
  const labelFont = isMobile ? 11 : 9;

  return (
    <g>
      <line x1={0} x2={0} y1={0} y2={innerH} stroke="#e2e8f0" strokeWidth={1} />
      {ticks.map((value: number) => (
        <g key={value} transform={`translate(0, ${y(value)})`}>
          <line x1={0} x2={-6} stroke="#e2e8f0" strokeWidth={1} />
          <text
            x={-10}
            y={4}
            textAnchor="end"
            fontSize={labelFont}
            fill="#64748b"
            fontFamily="ui-monospace, monospace"
            fontWeight="500"
            style={{ fontVariantNumeric: 'tabular-nums' }}
          >
            {formatCompact(value)}
          </text>
        </g>
      ))}
    </g>
  );
}

function ExtremumMarkers({ x, y, data }: { x: LinearScale; y: LinearScale; data: SeriesPoint[] }) {
  if (data.length < 3) return null;

  const extremums: Array<{
    index: number;
    value: number;
    type: 'peak' | 'trough' | 'savings-depleted';
  }> = [];

  for (let i = 1; i < data.length - 1; i++) {
    const prev = data[i - 1]!.netWorth;
    const curr = data[i]!.netWorth;
    const next = data[i + 1]!.netWorth;

    if (data[i]!.savingsDepleted) {
      extremums.push({ index: i, value: curr, type: 'savings-depleted' });
    } else if (curr > prev && curr > next) {
      extremums.push({ index: i, value: curr, type: 'peak' });
    } else if (curr < prev && curr < next) {
      extremums.push({ index: i, value: curr, type: 'trough' });
    }
  }

  const peaks = extremums
    .filter((e) => e.type === 'peak')
    .sort((a, b) => b.value - a.value)
    .slice(0, 3);
  const troughs = extremums
    .filter((e) => e.type === 'trough')
    .sort((a, b) => a.value - b.value)
    .slice(0, 3);
  const savingsDepleted = extremums.filter((e) => e.type === 'savings-depleted');

  return (
    <g>
      {[...peaks, ...troughs, ...savingsDepleted].map((ext, i) => {
        const point = data[ext.index]!;
        const xPos = x(point.m);
        const yPos = y(ext.value);
        let fillColor = '#ef4444';
        let label = formatCompact(ext.value);
        if (ext.type === 'peak') fillColor = '#10b981';
        else if (ext.type === 'savings-depleted') {
          fillColor = '#dc2626';
          label = '💸 Depleted';
        }
        return (
          <g key={`extremum-${i}`}>
            <circle
              cx={xPos}
              cy={yPos}
              r={ext.type === 'savings-depleted' ? 6 : 4}
              fill={fillColor}
              stroke="white"
              strokeWidth={2}
            />
            <text
              x={xPos}
              y={ext.type === 'peak' ? yPos - 13 : yPos + 18}
              textAnchor="middle"
              fontSize={ext.type === 'savings-depleted' ? 10 : 9}
              fill={fillColor}
              fontWeight="bold"
              fontFamily="ui-sans-serif, system-ui, sans-serif"
              stroke="white"
              strokeWidth={3}
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
  data: SeriesPoint[],
  predicate: (p: SeriesPoint) => boolean,
): Array<{ start: number; end: number }> {
  const ranges: Array<{ start: number; end: number }> = [];
  let start: number | null = null;
  for (const p of data) {
    if (predicate(p)) {
      if (start === null) start = p.m;
    } else {
      if (start !== null) {
        ranges.push({ start, end: p.m });
        start = null;
      }
    }
  }
  if (start !== null && data.length > 0) {
    ranges.push({ start, end: data[data.length - 1]!.m });
  }
  return ranges;
}

function SeriesAreas({
  x,
  y,
  data,
  innerH,
  fireDateMonth,
  retirementMonth,
}: {
  x: LinearScale;
  y: LinearScale;
  data: SeriesPoint[];
  innerH: number;
  fireDateMonth: number | null;
  retirementMonth: number;
}) {
  const toX = (p: { m: number }) => x(p.m);

  const dangerRanges = React.useMemo(() => computeZoneRanges(data, (p) => p.netWorth < 0), [data]);
  const warningRanges = React.useMemo(
    () =>
      computeZoneRanges(
        data,
        (p) =>
          p.safety > 0 && p.netWorth > 0 && p.netWorth < p.safety && p.netWorth / p.safety >= 0.5,
      ),
    [data],
  );

  // Visibility checks for vertical markers
  const [domMin = 0, domMax = 0] = x.domain();
  const fireVisible = fireDateMonth != null && fireDateMonth >= domMin && fireDateMonth <= domMax;
  const fireX = fireDateMonth != null ? x(fireDateMonth) : null;
  const retireVisible = retirementMonth >= domMin && retirementMonth <= domMax;
  const retireX = x(retirementMonth);
  const retireAge = Math.floor(retirementMonth / 12);

  return (
    <g>
      <defs>
        <linearGradient id="income-fill" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="#22c55e" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#22c55e" stopOpacity="0.05" />
        </linearGradient>
        <linearGradient id="expense-fill" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="#ef4444" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#ef4444" stopOpacity="0.05" />
        </linearGradient>
        <linearGradient id="invest-fill" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.40" />
          <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.05" />
        </linearGradient>
      </defs>

      {/* Areas — render order: largest first so smaller series stay visible on top */}
      <Area
        data={data}
        x={toX}
        y={y}
        get={(p: { invest: number }) => p.invest}
        color="url(#invest-fill)"
        stroke="#2563eb"
        strokeWidth={1.5}
      />
      <Area
        data={data}
        x={toX}
        y={y}
        get={(p: { income: number }) => p.income}
        color="url(#income-fill)"
        stroke="#16a34a"
        strokeWidth={1.5}
      />
      <Area
        data={data}
        x={toX}
        y={y}
        get={(p: { expense: number }) => p.expense}
        color="url(#expense-fill)"
        stroke="#dc2626"
        strokeWidth={1.5}
      />

      {/* Lines */}
      <Line
        data={data}
        x={toX}
        y={y}
        get={(p: { loans: number }) => p.loans}
        stroke="#d97706"
        dash="4 3"
        strokeWidth={1.5}
      />
      <Line
        data={data}
        x={toX}
        y={y}
        get={(p: { netWorth: number }) => p.netWorth}
        stroke="#7c3aed"
        strokeWidth={2.5}
      />
      <Line
        data={data}
        x={toX}
        y={y}
        get={(p: { safety: number }) => p.safety}
        stroke="#f97316"
        dash="2 2"
        strokeWidth={1.5}
      />

      {/* Danger zones — one rect per contiguous range */}
      {dangerRanges.map((r) => (
        <rect
          key={`danger-${r.start}`}
          x={x(r.start)}
          y={0}
          width={Math.max(1, x(r.end) - x(r.start))}
          height={innerH}
          fill="rgba(239,68,68,0.10)"
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
          fill="rgba(245,158,11,0.10)"
          className="pointer-events-none"
        />
      ))}

      {/* Retirement age line */}
      {retireVisible && (
        <g className="pointer-events-none">
          <line
            x1={retireX}
            x2={retireX}
            y1={0}
            y2={innerH}
            stroke="#64748b"
            strokeWidth={1.5}
            strokeDasharray="8 4"
            opacity={0.7}
          />
          <rect
            x={retireX - 30}
            y={innerH - 22}
            width={60}
            height={18}
            rx={4}
            fill="#475569"
            opacity={0.85}
          />
          <text
            x={retireX}
            y={innerH - 10}
            textAnchor="middle"
            fontSize={10}
            fill="white"
            fontWeight="bold"
            fontFamily="ui-sans-serif, system-ui, sans-serif"
          >
            Retire {retireAge}
          </text>
        </g>
      )}

      {/* FIRE date line */}
      {fireVisible && fireX != null && (
        <g className="pointer-events-none">
          <line
            x1={fireX}
            x2={fireX}
            y1={0}
            y2={innerH}
            stroke="#f59e0b"
            strokeWidth={2}
            strokeDasharray="6 3"
            opacity={0.9}
          />
          <rect x={fireX - 28} y={4} width={56} height={20} rx={5} fill="#f59e0b" opacity={0.9} />
          <text
            x={fireX}
            y={17}
            textAnchor="middle"
            fontSize={11}
            fill="white"
            fontWeight="bold"
            fontFamily="ui-sans-serif, system-ui, sans-serif"
          >
            FIRE
          </text>
        </g>
      )}
    </g>
  );
}

function Area({
  data,
  x,
  y,
  get,
  color,
  stroke,
  strokeWidth = 1.5,
}: {
  data: SeriesPoint[];
  x: (p: SeriesPoint) => number;
  y: LinearScale;
  get: (p: SeriesPoint) => number;
  color: string;
  stroke: string;
  strokeWidth?: number;
}) {
  const path = data.map((p) => ({ x: x(p), y: y(get(p)) }));
  return (
    <g>
      <AreaClosed
        data={path}
        x={(d: { x: number; y: number }) => d.x}
        y={(d: { x: number; y: number }) => d.y}
        yScale={y}
        fill={color}
        stroke={stroke}
        strokeWidth={strokeWidth}
        curve={curveMonotoneX}
      />
    </g>
  );
}

function Line({
  data,
  x,
  y,
  get,
  stroke,
  dash,
  strokeWidth = 1.5,
}: {
  data: SeriesPoint[];
  x: (p: SeriesPoint) => number;
  y: LinearScale;
  get: (p: SeriesPoint) => number;
  stroke: string;
  dash?: string;
  strokeWidth?: number;
}) {
  const path = data.map((p) => ({ x: x(p), y: y(get(p)) }));
  return (
    <LinePath
      data={path}
      x={(d: { x: number; y: number }) => d.x}
      y={(d: { x: number; y: number }) => d.y}
      stroke={stroke}
      strokeWidth={strokeWidth}
      strokeDasharray={dash}
      curve={curveMonotoneX}
    />
  );
}

function Milestones({
  x,
  innerH,
  zoom,
  milestones,
}: {
  x: LinearScale;
  innerH: number;
  zoom: [number, number];
  milestones: DerivedMilestone[];
}) {
  const [min, max] = zoom;
  const visible = milestones.filter((m) => m.monthIndex >= min && m.monthIndex <= max);

  // Truncate long labels in SVG — keep first 20 chars
  const maxLabelLen = 20;

  const labelHeight = 20;
  const labelSpacing = 5;
  const labelPositions: Array<{
    ms: DerivedMilestone;
    x: number;
    y: number;
    width: number;
    text: string;
  }> = [];

  visible.forEach((m) => {
    const xPos = x(m.monthIndex);
    const text = m.label.length > maxLabelLen ? m.label.slice(0, maxLabelLen) + '…' : m.label;
    const estimatedWidth = text.length * 6.5 + 16;
    labelPositions.push({ ms: m, x: xPos, y: innerH - 8, width: estimatedWidth, text });
  });

  const resolved: Array<{ ms: DerivedMilestone; x: number; y: number; text: string }> = [];
  const occupied: Array<{ x: number; width: number; bottomY: number }> = [];

  labelPositions.forEach((label) => {
    let finalY = label.y;
    // Push upward (negative direction) to stay inside chart
    let hasOverlap = true;
    let attempts = 0;
    while (hasOverlap && attempts < 5) {
      hasOverlap = false;
      for (const occ of occupied) {
        const labelLeft = label.x - label.width / 2;
        const labelRight = label.x + label.width / 2;
        const occLeft = occ.x - occ.width / 2;
        const occRight = occ.x + occ.width / 2;
        if (labelLeft < occRight && labelRight > occLeft) {
          if (Math.abs(finalY - occ.bottomY + labelHeight) < labelHeight + labelSpacing) {
            hasOverlap = true;
            finalY = finalY - labelHeight - labelSpacing;
            break;
          }
        }
      }
      attempts++;
    }
    // Clamp: don't go above chart top
    finalY = Math.max(labelHeight + 4, finalY);
    occupied.push({ x: label.x, width: label.width, bottomY: finalY + labelHeight });
    resolved.push({ ms: label.ms, x: label.x, y: finalY, text: label.text });
  });

  return (
    <g>
      {resolved.map((pos) => {
        const textWidth = pos.text.length * 6.2 + 14;
        return (
          <g key={pos.ms.id} className="pointer-events-none">
            <line
              x1={pos.x}
              x2={pos.x}
              y1={0}
              y2={innerH}
              stroke="#94a3b8"
              strokeDasharray="3 3"
              strokeWidth={1}
            />
            <circle
              cx={pos.x}
              cy={pos.y + 4}
              r={3}
              fill="#6366f1"
              stroke="white"
              strokeWidth={1.5}
            />
            <rect
              x={pos.x - textWidth / 2}
              y={pos.y - 14}
              width={textWidth}
              height={16}
              rx={4}
              fill="#6366f1"
              opacity={0.85}
            />
            <text
              x={pos.x}
              y={pos.y - 3}
              textAnchor="middle"
              fontSize="10"
              fill="white"
              fontWeight="600"
              fontFamily="ui-sans-serif, system-ui, sans-serif"
            >
              {pos.text}
            </text>
          </g>
        );
      })}
    </g>
  );
}

function HoverTooltip({
  x,
  y,
  containerWidth,
  age,
  income,
  expense,
  loans,
  invest,
  netWorth,
  safety,
  cashFlow,
  milestone,
}: {
  x: number;
  y: number;
  containerWidth: number;
  age: string;
  income: number | undefined;
  expense: number | undefined;
  loans: number | undefined;
  invest: number | undefined;
  netWorth: number | undefined;
  safety: number | undefined;
  cashFlow: number | undefined;
  milestone: string | undefined;
}) {
  const tooltipWidth = 210;
  const left = x + 8 + tooltipWidth > containerWidth ? x - tooltipWidth - 8 : x + 8;
  return (
    <div
      style={{ position: 'absolute', left: Math.max(8, left), top: y, pointerEvents: 'none' }}
      className="px-3 py-2 rounded-lg border bg-white text-[11px] shadow-lg min-w-[200px]"
    >
      <div className="font-medium text-slate-800">{age}</div>
      {milestone ? <div className="text-[10px] text-slate-500 mb-1">📍 {milestone}</div> : null}
      <div className="mt-1 grid grid-cols-2 gap-x-3 gap-y-1">
        <span className="text-green-600 font-medium">Income</span>
        <span className="text-right">{format(income)}</span>
        <span className="text-red-600 font-medium">Expenses</span>
        <span className="text-right">{format(expense)}</span>
        <span className="text-blue-600 font-medium">Cash Flow</span>
        <span className={`text-right ${(cashFlow ?? 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
          {format(cashFlow)}
        </span>
        <span className="text-amber-600 font-medium">Loans</span>
        <span className="text-right">{format(loans)}</span>
        <span className="text-blue-600 font-medium">Investments</span>
        <span className="text-right">{format(invest)}</span>
        <span className="text-violet-600 font-medium">Net Worth</span>
        <span className={`text-right ${(netWorth ?? 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
          {format(netWorth)}
        </span>
        <span className="text-orange-600 font-medium">Safety</span>
        <span className="text-right">{format(safety)}</span>
      </div>
    </div>
  );
}
