import { Link } from 'react-router-dom'
import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { cn } from '../../utils/formatters'

export type BtnVariant = 'primary' | 'outline' | 'inverse'
export type BtnShape = 'default' | 'attached-right'

const variantClass: Record<BtnVariant, string> = {
  primary: 'arena-btn--primary',
  outline: 'arena-btn--outline',
  inverse: 'arena-btn--inverse',
}

function btnClass(
  variant: BtnVariant,
  shape: BtnShape,
  className?: string,
  extra?: string
) {
  return cn(
    'arena-btn',
    variantClass[variant],
    shape === 'attached-right' && 'arena-btn--attached-r',
    extra,
    className
  )
}

interface BtnProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode
  variant?: BtnVariant
  shape?: BtnShape
}

interface BtnLinkProps {
  children: ReactNode
  to: string
  className?: string
  variant?: BtnVariant
  shape?: BtnShape
}

/** Asymmetrical morph — slow on hover in, fast on hover out (see testbutton.html / index.css) */
export function Btn({
  children,
  className = '',
  variant = 'primary',
  shape = 'default',
  type = 'button',
  ...props
}: BtnProps) {
  return (
    <button type={type} className={btnClass(variant, shape, className)} {...props}>
      {children}
    </button>
  )
}

export function BtnLink({
  children,
  to,
  className = '',
  variant = 'primary',
  shape = 'default',
}: BtnLinkProps) {
  return (
    <Link to={to} className={btnClass(variant, shape, className)}>
      {children}
    </Link>
  )
}

/** Pill label inside a .group link (trending cards) */
export function BtnMorphLabel({
  children,
  className = '',
  variant = 'primary',
}: {
  children: ReactNode
  className?: string
  variant?: BtnVariant
}) {
  return (
    <span className={btnClass(variant, 'default', className, 'arena-btn--in-group')}>
      {children}
    </span>
  )
}
