import { CartesianGrid, Line, LineChart, Tooltip, XAxis, YAxis } from 'recharts'
import type { Exercise } from '../../db/types'
import type { LoadPoint } from '../../lib/gym'
import { formatDate } from '../../lib/date'
import { fmtNum } from '../../lib/format'
import { ACTIVE_DOT, AXIS_TICK, CHART_MARGIN, ChartBox, CURSOR, LINE_WIDTH, MARKER_R, TooltipCard, niceScale, tickDate, timeDomain } from '../charts/chart'

interface LoadChartProps {
  exercise: Exercise
  points: LoadPoint[]
}

/** Progressione del carico (o dei secondi) di un esercizio nel tempo. */
export function LoadChart({ exercise, points }: LoadChartProps) {
  const time = exercise.mode === 'time'
  const unit = time ? 's' : 'kg'
  const xDomain = timeDomain(points.map((p) => p.t))
  const y = niceScale(points.map((p) => p.value), 4, time ? 5 : 1)
  const dot = { r: MARKER_R, fill: 'var(--accent)', stroke: 'var(--surface)', strokeWidth: 2 }

  return (
    <ChartBox height={190}>
      <LineChart responsive data={points} margin={CHART_MARGIN} style={{ width: '100%', height: '100%' }}>
        <CartesianGrid vertical={false} stroke="var(--chart-grid)" />
        <XAxis dataKey="t" type="number" scale="time" domain={xDomain} tickFormatter={tickDate} tick={AXIS_TICK} axisLine={false} tickLine={false} minTickGap={40} />
        <YAxis domain={y.domain} ticks={y.ticks} width={34} tick={AXIS_TICK} axisLine={false} tickLine={false} tickFormatter={(v: number) => fmtNum(v, 1)} />
        <Tooltip
          cursor={CURSOR}
          isAnimationActive={false}
          content={({ active, payload }) => {
            const p = payload?.[0]?.payload as LoadPoint | undefined
            if (!active || !p) return null
            return (
              <TooltipCard
                title={formatDate(p.date, 'medium')}
                rows={[
                  { label: time ? 'Tenuta' : 'Carico', value: `${fmtNum(p.value, 1)} ${unit}`, accent: true },
                  { label: 'Serie', value: time ? `${p.sets}` : `${p.sets} × ${p.reps}` },
                  ...(p.rir !== undefined ? [{ label: 'RIR', value: `${p.rir}` }] : []),
                ]}
              />
            )
          }}
        />
        <Line type="monotone" dataKey="value" stroke="var(--accent)" strokeWidth={LINE_WIDTH} strokeLinecap="round" dot={dot} activeDot={ACTIVE_DOT} isAnimationActive={false} />
      </LineChart>
    </ChartBox>
  )
}
