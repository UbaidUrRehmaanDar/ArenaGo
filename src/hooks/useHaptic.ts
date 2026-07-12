export function useHaptic() {
  const trigger = (type: 'light' | 'medium' | 'heavy' = 'light') => {
    if ('vibrate' in navigator) {
      const duration = type === 'light' ? 10 : type === 'medium' ? 20 : 30
      navigator.vibrate(duration)
    }
  }

  const triggerSuccess = () => {
    if ('vibrate' in navigator) {
      navigator.vibrate([10, 50, 10])
    }
  }

  const triggerError = () => {
    if ('vibrate' in navigator) {
      navigator.vibrate([
        30, 50, 30, 50, 30
      ])
    }
  }

  return { trigger, triggerSuccess, triggerError }
}
