import { CartesianGrid, ComposedChart, Line, Scatter, Tooltip, XAxis, YAxis, ZAxis } from 'recharts'
import type { WeightPoint } from '../../lib/body'
import { formatDate } from '../../lib/date'
import { fmtNum } from '../../lib/format'
import { ACTIVE_DOT, AXIS_TICK, CHART_MARGIN, ChartBox, CURSOR, LINE_WIDTH, MARKER_R, TooltipCard, niceScale, tickDate, timeDomain } from '../charts/chart'

interface WeightChartProps {
  points: WeightPoint[]
}

/**
 * Peso nel tempo: puntini grigi per le singole pesate, linea arancione
 * per la media mobile a 7 giorni (il valore che conta davvero).
 */
export function WeightChart({ points }: WeightChartProps) {
  const xDomain = timeDomain(points.map((p) => p.t))
  const y = niceScale(points.flatMap((p) => [p.weight, p.avg7]), 4, 0.5)

  return (
    <ChartBox height={210}>
      <ComposedChart responsive data={points} margin={CHART_MARGIN} style={{ width: '100%', height: '100%' }}>
        <CartesianGrid vertical={false} stroke="var(--chart-grid)" />
        <XAxis
          dataKey="t"
          type="number"
          scale="time"
          domain={xDomain}
          tickFormatter={tickDate}
          tick={AXIS_TICK}
          axisLine={false}
          tickLine={false}
          minTickGap={40}
        />
        <YAxis
          domain={y.domain}
          ticks={y.ticks}
          width={36}
          tick={AXIS_TICK}
          axisLine={false}
          tickLine={false}
          tickFormatter={(v: number) => fmtNum(v, 1)}
        />
        <ZAxis range={[50, 50]} />
        <Tooltip
          cursor={CURSOR}
          isAnimationActive={false}
          content={({ active, payload }) => {
            const p = payload?.[0]?.payload as WeightPoint | undefined
            if (!active || !p) return null
            return (
              <TooltipCard
                title={formatDate(p.date, 'medium')}
                rows={[
                  { label: 'Media 7 giorni', value: `${fmtNum(p.avg7, 1)} kg`, accent: true },
                  { label: 'Pesata', value: `${fmtNum(p.weight, 1)} kg` },
                ]}
              />
            )
          }}
        />
        <Scatter dataKey="weight" fill="var(--chart-secondary)" stroke="var(--surface)" strokeWidth={2} isAnimationActive={false} />
        <Line
          type="monotone"
          dataKey="avg7"
          stroke="var(--accent)"
          strokeWidth={LINE_WIDTH}
          strokeLinecap="round"
          dot={points.length === 1 ? { r: MARKER_R, fill: 'var(--accent)', stroke: 'var(--surface)', strokeWidth: 2 } : false}
          activeDot={ACTIVE_DOT}
          isAnimationActive={false}
        />
      </ComposedChart>
    </ChartBox>
  )
}
