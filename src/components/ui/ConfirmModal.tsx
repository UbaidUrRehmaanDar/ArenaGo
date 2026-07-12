import { X } from 'lucide-react'
import { Btn } from './Btn'

interface ConfirmModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  variant?: 'danger' | 'warning' | 'info'
  error?: string | null
}

export function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'danger',
  error = null,
}: ConfirmModalProps) {
  if (!isOpen) return null

  const variantColors = {
    danger: 'text-red-400',
    warning: 'text-amber',
    info: 'text-lime',
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-6">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal */}
      <div className="relative bg-slate rounded-sm border border-line w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-line">
          <h2 className={`font-display text-xl ${variantColors[variant]}`}>{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-white/5 text-mist hover:text-chalk transition-colors"
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <p className="text-chalk/90 text-[15px] leading-relaxed">{message}</p>
          {error && (
            <p className="text-red-400 text-sm mt-3">{error}</p>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-line flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-2.5 rounded-sm border border-line text-chalk hover:bg-white/5 transition-colors font-body text-sm"
          >
            {cancelText}
          </button>
          <Btn
            type="button"
            onClick={onConfirm}
            variant={variant === 'danger' ? 'primary' : 'primary'}
            className="flex-1 px-4 py-2.5 text-sm"
          >
            {confirmText}
          </Btn>
        </div>
      </div>
    </div>
  )
}
