import {
  Bar,
  BarChart,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import type { HourlyData } from '../../types'
import { useChartTheme } from '../../hooks/useChartTheme'

interface PeakHoursChartProps {
  data: HourlyData[]
}

export function PeakHoursChart({ data }: PeakHoursChartProps) {
  const chart = useChartTheme()

  const chartData = data.map((d) => ({
    hour: d.hour < 12 ? `${d.hour} AM` : d.hour === 12 ? '12 PM' : `${d.hour - 12} PM`,
    occupancy: d.occupancy,
    fill: d.occupancy > 70 ? chart.amber : chart.lime,
  }))

  return (
    <div className="w-full h-[280px]">
      <h3 className="font-display text-sm text-chalk tracking-wide mb-4">BUSIEST TIMES</h3>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
          <XAxis
            dataKey="hour"
            tick={{ fill: chart.tick, fontSize: 10, fontFamily: 'JetBrains Mono' }}
            axisLine={{ stroke: chart.axis }}
            tickLine={false}
            interval={2}
          />
          <YAxis
            tick={{ fill: chart.tick, fontSize: 10, fontFamily: 'JetBrains Mono' }}
            axisLine={false}
            tickLine={false}
            unit="%"
          />
          <Tooltip
            contentStyle={{
              background: chart.tooltipBg,
              border: `1px solid ${chart.tooltipBorder}`,
              borderRadius: 4,
              color: chart.tooltipText,
            }}
            formatter={(value) => [`${value}%`, 'Occupancy']}
          />
          <Bar dataKey="occupancy" radius={[2, 2, 0, 0]}>
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.fill} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
