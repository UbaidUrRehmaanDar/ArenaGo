import { useMemo } from 'react'
import { useTheme } from '../context/ThemeContext'
import { readChartTheme, type ChartThemeColors } from '../utils/chartTheme'

export function useChartTheme(): ChartThemeColors {
  const { theme } = useTheme()
  return useMemo(() => readChartTheme(), [theme])
}
