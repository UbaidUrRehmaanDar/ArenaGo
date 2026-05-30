export interface ChartThemeColors {
  tick: string
  axis: string
  tooltipBg: string
  tooltipBorder: string
  tooltipText: string
  lime: string
  amber: string
}

export function readChartTheme(): ChartThemeColors {
  const styles = getComputedStyle(document.documentElement)

  const rgb = (name: string, fallback: string) => {
    const raw = styles.getPropertyValue(name).trim()
    return raw ? `rgb(${raw})` : fallback
  }

  return {
    tick: rgb('--color-mist', '#8A9A8A'),
    axis: rgb('--color-line', '#1F2B1F'),
    tooltipBg: rgb('--color-slate', '#2E3A2E'),
    tooltipBorder: rgb('--color-line', '#1F2B1F'),
    tooltipText: rgb('--color-chalk', '#F5F0E8'),
    lime: rgb('--color-lime-btn', '#C8FF00'),
    amber: rgb('--color-amber', '#FF9500'),
  }
}
