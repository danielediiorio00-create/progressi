import { Bar, BarChart, CartesianGrid, Line, LineChart, Tooltip, XAxis, YAxis } from 'recharts'
import type { RunPoint } from '../../lib/running'
import { runTypeLabel } from '../../lib/running'
import { formatDate } from '../../lib/date'
import { fmtDuration, fmtNum, fmtPace } from '../../lib/format'
import { ACTIVE_DOT, AXIS_TICK, CHART_MARGIN, ChartBox, CURSOR, LINE_WIDTH, MARKER_R, TIME_STEPS, TooltipCard, niceScale, tickDate, timeDomain } from '../charts/chart'

function RunTooltip({ p }: { p: RunPoint }) {
  return (
    <TooltipCard
      title={`${formatDate(p.date, 'medium')} · ${runTypeLabel(p.type).toLowerCase()}`}
      rows={[
        { label: 'Distanza', value: `${fmtNum(p.distanceKm, 2)} km`, accent: true },
        { label: 'Tempo', value: fmtDuration(p.durationSec) },
        { label: 'Passo', value: fmtPace(p.paceSec, true) },
        { label: 'Sensazione', value: `${p.feeling}/10` },
      ]}
    />
  )
}

/** Distanza di ogni corsa: una colonna per corsa, in ordine cronologico. */
export function DistanceChart({ points }: { points: RunPoint[] }) {
  const y = niceScale(points.map((p) => p.distanceKm), 4, 0.5, { fromZero: true })
  return (
    <ChartBox height={190}>
      <BarChart responsive data={points} margin={CHART_MARGIN} style={{ width: '100%', height: '100%' }} barCategoryGap="30%">
        <CartesianGrid vertical={false} stroke="var(--chart-grid)" />
        <XAxis dataKey="date" tickFormatter={(d: string) => formatDate(d, 'short')} tick={AXIS_TICK} axisLine={false} tickLine={false} minTickGap={28} />
        <YAxis domain={y.domain} ticks={y.ticks} width={30} tick={AXIS_TICK} axisLine={false} tickLine={false} tickFormatter={(v: number) => fmtNum(v, 1)} />
        <Tooltip
          cursor={{ fill: 'var(--btn-secondary-bg)' }}
          isAnimationActive={false}
          content={({ active, payload }) => {
            const p = payload?.[0]?.payload as RunPoint | undefined
            return active && p ? <RunTooltip p={p} /> : null
          }}
        />
        <Bar dataKey="distanceKm" fill="var(--accent)" radius={[4, 4, 0, 0]} maxBarSize={24} isAnimationActive={false} />
      </BarChart>
    </ChartBox>
  )
}

interface DotProps {
  cx?: number
  cy?: number
  payload?: RunPoint
  index?: number
}

/** Marker pieno per le corse all'aperto, vuoto per il tapis roulant. */
function PaceDot({ cx, cy, payload, index }: DotProps) {
  if (cx === undefined || cy === undefined || !payload) return null
  const outdoor = payload.type === 'outdoor'
  return (
    <circle
      key={index}
      cx={cx}
      cy={cy}
      r={MARKER_R}
      fill={outdoor ? 'var(--accent)' : 'var(--surface)'}
      stroke={outdoor ? 'var(--surface)' : 'var(--accent)'}
      strokeWidth={2}
    />
  )
}

/** Passo nel tempo: asse invertito, cosi' salire = andare piu' veloce. */
export function PaceChart({ points }: { points: RunPoint[] }) {
  const xDomain = timeDomain(points.map((p) => p.t))
  const y = niceScale(points.map((p) => p.paceSec), 4, 15, { steps: TIME_STEPS })
  return (
    <ChartBox height={190}>
      <LineChart responsive data={points} margin={CHART_MARGIN} style={{ width: '100%', height: '100%' }}>
        <CartesianGrid vertical={false} stroke="var(--chart-grid)" />
        <XAxis dataKey="t" type="number" scale="time" domain={xDomain} tickFormatter={tickDate} tick={AXIS_TICK} axisLine={false} tickLine={false} minTickGap={40} />
        <YAxis reversed domain={y.domain} ticks={y.ticks} width={38} tick={AXIS_TICK} axisLine={false} tickLine={false} tickFormatter={(v: number) => fmtPace(v)} />
        <Tooltip
          cursor={CURSOR}
          isAnimationActive={false}
          content={({ active, payload }) => {
            const p = payload?.[0]?.payload as RunPoint | undefined
            return active && p ? <RunTooltip p={p} /> : null
          }}
        />
        <Line
          type="monotone"
          dataKey="paceSec"
          stroke="var(--accent)"
          strokeWidth={LINE_WIDTH}
          strokeLinecap="round"
          dot={<PaceDot />}
          activeDot={ACTIVE_DOT}
          isAnimationActive={false}
        />
      </LineChart>
    </ChartBox>
  )
}

/** Frequenza cardiaca media per corsa, nel tempo. Solo nella schermata dedicata. */
export function HrChart({ points }: { points: RunPoint[] }) {
  const data = points.filter((p) => p.avgHr !== undefined)
  const xDomain = timeDomain(data.map((p) => p.t))
  const y = niceScale(data.map((p) => p.avgHr!), 4, 5, { steps: [5, 10, 20, 25, 50] })
  return (
    <ChartBox height={190}>
      <LineChart responsive data={data} margin={CHART_MARGIN} style={{ width: '100%', height: '100%' }}>
        <CartesianGrid vertical={false} stroke="var(--chart-grid)" />
        <XAxis dataKey="t" type="number" scale="time" domain={xDomain} tickFormatter={tickDate} tick={AXIS_TICK} axisLine={false} tickLine={false} minTickGap={40} />
        <YAxis domain={y.domain} ticks={y.ticks} width={32} tick={AXIS_TICK} axisLine={false} tickLine={false} />
        <Tooltip
          cursor={CURSOR}
          isAnimationActive={false}
          content={({ active, payload }) => {
            const p = payload?.[0]?.payload as RunPoint | undefined
            if (!active || !p) return null
            return (
              <TooltipCard
                title={formatDate(p.date, 'medium')}
                rows={[
                  { label: 'FC media', value: `${p.avgHr} bpm`, accent: true },
                  { label: 'Passo', value: fmtPace(p.paceSec, true) },
                  { label: 'Distanza', value: `${fmtNum(p.distanceKm, 2)} km` },
                ]}
              />
            )
          }}
        />
        <Line
          type="monotone"
          dataKey="avgHr"
          stroke="var(--accent)"
          strokeWidth={LINE_WIDTH}
          strokeLinecap="round"
          dot={<PaceDot />}
          activeDot={ACTIVE_DOT}
          isAnimationActive={false}
        />
      </LineChart>
    </ChartBox>
  )
}
