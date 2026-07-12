import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Check, X, Info } from 'lucide-react'
import { cn } from '../../utils/formatters'

type ToastType = 'success' | 'error' | 'info'

interface Toast {
  id: string
  type: ToastType
  message: string
  duration?: number
}

const TOAST_ICONS: Record<ToastType, typeof Check> = {
  success: Check,
  error: X,
  info: Info,
}

const TOAST_COLORS: Record<ToastType, string> = {
  success: 'text-lime bg-lime/10 border-lime/20',
  error: 'text-red-400 bg-red-400/10 border-red-400/20',
  info: 'text-chalk bg-turf border-line',
}

let toastListeners: ((toast: Toast) => void)[] = []
let toastIdCounter = 0

export function showToast(toast: Omit<Toast, 'id'>) {
  const id = `toast-${++toastIdCounter}`
  const fullToast: Toast = { ...toast, id }
  toastListeners.forEach(listener => listener(fullToast))
}

export function ToastContainer() {
  const [toasts, setToasts] = useState<Toast[]>([])

  useEffect(() => {
    toastListeners.push((toast) => {
      setToasts(prev => [...prev, toast])
      
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== toast.id))
      }, toast.duration ?? 4000)
    })

    return () => {
      toastListeners = []
    }
  }, [])

  return (
    <div className="fixed bottom-20 md:bottom-6 left-1/2 -translate-x-1/2 z-[100] flex flex-col gap-2 items-center pointer-events-none">
      <AnimatePresence mode="popLayout">
        {toasts.map(toast => {
          const Icon = TOAST_ICONS[toast.type]
          return (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: 20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
              className={cn(
                'pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-xl border shadow-[0_8px_24px_rgba(0,0,0,0.4)] backdrop-blur-sm',
                'min-w-[300px] max-w-sm',
                TOAST_COLORS[toast.type]
              )}
            >
              <Icon size={18} className={cn('shrink-0', toast.type === 'info' && 'text-lime')} />
              <p className="font-body text-sm text-chalk flex-1">{toast.message}</p>
              <button
                onClick={() => setToasts(prev => prev.filter(t => t.id !== toast.id))}
                className="shrink-0 text-mist hover:text-chalk transition-colors"
              >
                <X size={14} />
              </button>
            </motion.div>
          )
        })}
      </AnimatePresence>
    </div>
  )
}
