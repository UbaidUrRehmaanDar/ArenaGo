import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { gsap } from 'gsap'
import './PillNav.css'

export interface NavItem {
  label: string
  href: string
  ariaLabel?: string
}

interface PillNavProps {
  items: NavItem[]
  activeHref?: string
  className?: string
  ease?: string
  baseColor?: string
  pillColor?: string
  hoveredPillTextColor?: string
  pillTextColor?: string
  /** Called whenever the open/closed state changes */
  onToggle?: (open: boolean) => void
  /** Controlled from outside – pass true to force-close */
  forceClose?: boolean
}

const isExternal = (href: string) =>
  /^(https?:\/\/|\/\/|mailto:|tel:|#)/.test(href)

export function PillNav({
  items,
  activeHref,
  className = '',
  ease = 'power3.easeOut',
  baseColor = 'rgb(26 31 26)',
  pillColor = 'rgb(200 255 0)',
  hoveredPillTextColor = 'rgb(10 10 10)',
  pillTextColor = 'rgb(245 240 232)',
  onToggle,
  forceClose,
}: PillNavProps) {
  const [open, setOpen] = useState(false)

  const circleRefs = useRef<(HTMLSpanElement | null)[]>([])
  const tlRefs = useRef<gsap.core.Timeline[]>([])
  const activeTweenRefs = useRef<gsap.core.Tween[]>([])
  const navItemsRef = useRef<HTMLDivElement>(null)
  const hamburgerRef = useRef<HTMLButtonElement>(null)

  /* ── close when forceClose fires ─────────────────────────────────────── */
  useEffect(() => {
    if (forceClose && open) closeMenu()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [forceClose])

  /* ── GSAP pill hover setup ────────────────────────────────────────────── */
  useEffect(() => {
    const layout = () => {
      circleRefs.current.forEach((circle) => {
        if (!circle?.parentElement) return
        const pill = circle.parentElement
        const { width: w, height: h } = pill.getBoundingClientRect()
        const R = ((w * w) / 4 + h * h) / (2 * h)
        const D = Math.ceil(2 * R) + 2
        const delta = Math.ceil(R - Math.sqrt(Math.max(0, R * R - (w * w) / 4))) + 1
        const originY = D - delta

        circle.style.width = `${D}px`
        circle.style.height = `${D}px`
        circle.style.bottom = `-${delta}px`
        gsap.set(circle, { xPercent: -50, scale: 0, transformOrigin: `50% ${originY}px` })

        const label = pill.querySelector<HTMLElement>('.pill-label')
        const hover = pill.querySelector<HTMLElement>('.pill-label-hover')
        if (label) gsap.set(label, { y: 0 })
        if (hover) gsap.set(hover, { y: h + 12, opacity: 0 })

        const index = circleRefs.current.indexOf(circle)
        if (index === -1) return
        tlRefs.current[index]?.kill()

        const tl = gsap.timeline({ paused: true })
        tl.to(circle, { scale: 1.2, xPercent: -50, duration: 2, ease, overwrite: 'auto' }, 0)
        if (label) tl.to(label, { y: -(h + 8), duration: 2, ease, overwrite: 'auto' }, 0)
        if (hover) {
          gsap.set(hover, { y: Math.ceil(h + 100), opacity: 0 })
          tl.to(hover, { y: 0, opacity: 1, duration: 2, ease, overwrite: 'auto' }, 0)
        }
        tlRefs.current[index] = tl
      })
    }

    layout()
    window.addEventListener('resize', layout)
    document.fonts?.ready?.then(layout).catch(() => {})
    return () => window.removeEventListener('resize', layout)
  }, [items, ease])

  /* ── hover handlers ─────────────────────────────────────────────────── */
  const handleEnter = (i: number) => {
    const tl = tlRefs.current[i]
    if (!tl) return
    activeTweenRefs.current[i]?.kill()
    activeTweenRefs.current[i] = tl.tweenTo(tl.duration(), { duration: 0.3, ease, overwrite: 'auto' })
  }
  const handleLeave = (i: number) => {
    const tl = tlRefs.current[i]
    if (!tl) return
    activeTweenRefs.current[i]?.kill()
    activeTweenRefs.current[i] = tl.tweenTo(0, { duration: 0.2, ease, overwrite: 'auto' })
  }

  /* ── hamburger animation ────────────────────────────────────────────── */
  const animateHamburger = (toOpen: boolean) => {
    const btn = hamburgerRef.current
    if (!btn) return
    const lines = btn.querySelectorAll<HTMLElement>('.hamburger-line')
    if (toOpen) {
      gsap.to(lines[0], { rotation: 45, y: 3.5, duration: 0.28, ease })
      gsap.to(lines[1], { rotation: -45, y: -3.5, duration: 0.28, ease })
    } else {
      gsap.to(lines[0], { rotation: 0, y: 0, duration: 0.28, ease })
      gsap.to(lines[1], { rotation: 0, y: 0, duration: 0.28, ease })
    }
  }

  const closeMenu = () => {
    setOpen(false)
    animateHamburger(false)
    onToggle?.(false)
  }

  const toggleMenu = () => {
    const next = !open
    setOpen(next)
    animateHamburger(next)
    onToggle?.(next)
  }

  /* ── render pill ─────────────────────────────────────────────────────── */
  const renderPill = (item: NavItem, i: number) => {
    const pillClass = `pill${activeHref === item.href ? ' is-active' : ''}`
    const inner = (
      <>
        <span className="hover-circle" aria-hidden="true" ref={(el) => { circleRefs.current[i] = el }} />
        <span className="label-stack">
          <span className="pill-label">{item.label}</span>
          <span className="pill-label-hover" aria-hidden="true">{item.label}</span>
        </span>
      </>
    )
    return !isExternal(item.href) ? (
      <Link role="menuitem" to={item.href} className={pillClass}
        aria-label={item.ariaLabel ?? item.label}
        onMouseEnter={() => handleEnter(i)} onMouseLeave={() => handleLeave(i)}>
        {inner}
      </Link>
    ) : (
      <a role="menuitem" href={item.href} className={pillClass}
        aria-label={item.ariaLabel ?? item.label}
        onMouseEnter={() => handleEnter(i)} onMouseLeave={() => handleLeave(i)}>
        {inner}
      </a>
    )
  }

  const cssVars = {
    '--base': baseColor,
    '--pill-bg': pillColor,
    '--hover-text': hoveredPillTextColor,
    '--pill-text': pillTextColor,
  } as React.CSSProperties

  return (
    <>
      {/* ── Desktop pill track ──────────────────────────────────────────── */}
      <nav
        className={`pill-nav pill-nav--desktop ${className}`}
        aria-label="Primary"
        style={cssVars}
        ref={navItemsRef}
      >
        <div className="pill-nav-items">
          <ul className="pill-list" role="menubar">
            {items.map((item, i) => (
              <li key={item.href ?? `item-${i}`} role="none">
                {renderPill(item, i)}
              </li>
            ))}
          </ul>
        </div>
      </nav>

      {/* ── Mobile hamburger button only ─────────────────────────────────── */}
      <button
        type="button"
        className="pill-hamburger"
        onClick={toggleMenu}
        aria-label={open ? 'Close menu' : 'Open menu'}
        aria-expanded={open}
        ref={hamburgerRef}
        style={cssVars}
      >
        <span className="hamburger-line" />
        <span className="hamburger-line" />
      </button>
    </>
  )
}
