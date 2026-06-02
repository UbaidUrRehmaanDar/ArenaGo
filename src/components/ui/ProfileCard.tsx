import React, { useEffect, useRef, useCallback, useMemo, useState } from 'react';
import { X, Mail, ExternalLink } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import './ProfileCard.css';

const DEFAULT_INNER_GRADIENT =
  'linear-gradient(145deg, rgba(200,255,0,0.08) 0%, rgba(26,31,26,0.6) 100%)';

const ANIMATION_CONFIG = {
  INITIAL_DURATION: 1200,
  INITIAL_X_OFFSET: 70,
  INITIAL_Y_OFFSET: 60,
  DEVICE_BETA_OFFSET: 20,
  ENTER_TRANSITION_MS: 180,
};

const clamp = (v: number, min = 0, max = 100) => Math.min(Math.max(v, min), max);
const round = (v: number, precision = 3) => parseFloat(v.toFixed(precision));
const adjust = (v: number, fMin: number, fMax: number, tMin: number, tMax: number) =>
  round(tMin + ((tMax - tMin) * (v - fMin)) / (fMax - fMin));

interface TiltEngine {
  setImmediate(x: number, y: number): void;
  setTarget(x: number, y: number): void;
  toCenter(): void;
  beginInitial(durationMs: number): void;
  getCurrent(): { x: number; y: number; tx: number; ty: number };
  cancel(): void;
}

interface ProfileCardProps {
  avatarUrl?: string;
  iconUrl?: string;
  grainUrl?: string;
  innerGradient?: string;
  behindGlowEnabled?: boolean;
  behindGlowColor?: string;
  behindGlowSize?: string;
  className?: string;
  enableTilt?: boolean;
  enableMobileTilt?: boolean;
  mobileTiltSensitivity?: number;
  miniAvatarUrl?: string;
  name?: string;
  title?: string;
  handle?: string;
  status?: string;
  contactText?: string;
  showUserInfo?: boolean;
  onContactClick?: () => void;
  email?: string;
  linkedin?: string;
  github?: string;
}

const ProfileCardComponent: React.FC<ProfileCardProps> = ({
  avatarUrl = '',
  iconUrl = '',
  grainUrl = '',
  innerGradient,
  behindGlowEnabled = true,
  behindGlowColor,
  behindGlowSize,
  className = '',
  enableTilt = true,
  enableMobileTilt = false,
  mobileTiltSensitivity = 5,
  miniAvatarUrl,
  name = 'Creator',
  title = 'Co-Founder',
  handle = 'arenago',
  status = 'Building ArenaGo',
  contactText = 'Contact',
  showUserInfo = true,
  onContactClick,
  email = '',
  linkedin = '',
  github = '',
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  // Close on Escape key
  useEffect(() => {
    if (!isExpanded) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setIsExpanded(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isExpanded]);

  const wrapRef = useRef<HTMLDivElement>(null);
  const shellRef = useRef<HTMLDivElement>(null);
  const enterTimerRef = useRef<number | null>(null);
  const leaveRafRef = useRef<number | null>(null);

  const tiltEngine = useMemo<TiltEngine | null>(() => {
    if (!enableTilt) return null;

    let rafId: number | null = null;
    let running = false;
    let lastTs = 0;
    let currentX = 0;
    let currentY = 0;
    let targetX = 0;
    let targetY = 0;
    const DEFAULT_TAU = 0.14;
    const INITIAL_TAU = 0.6;
    let initialUntil = 0;

    const setVarsFromXY = (x: number, y: number) => {
      const shell = shellRef.current;
      const wrap = wrapRef.current;
      if (!shell || !wrap) return;
      const width = shell.clientWidth || 1;
      const height = shell.clientHeight || 1;
      const percentX = clamp((100 / width) * x);
      const percentY = clamp((100 / height) * y);
      const centerX = percentX - 50;
      const centerY = percentY - 50;
      const properties: Record<string, string> = {
        '--pointer-x': `${percentX}%`,
        '--pointer-y': `${percentY}%`,
        '--background-x': `${adjust(percentX, 0, 100, 35, 65)}%`,
        '--background-y': `${adjust(percentY, 0, 100, 35, 65)}%`,
        '--pointer-from-center': `${clamp(Math.hypot(percentY - 50, percentX - 50) / 50, 0, 1)}`,
        '--pointer-from-top': `${percentY / 100}`,
        '--pointer-from-left': `${percentX / 100}`,
        '--rotate-x': `${round(-(centerX / 12))}deg`,
        '--rotate-y': `${round(centerY / 10)}deg`,
      };
      for (const [k, v] of Object.entries(properties)) wrap.style.setProperty(k, v);
    };

    const step = (ts: number) => {
      if (!running) return;
      if (lastTs === 0) lastTs = ts;
      const dt = (ts - lastTs) / 1000;
      lastTs = ts;
      const tau = ts < initialUntil ? INITIAL_TAU : DEFAULT_TAU;
      const k = 1 - Math.exp(-dt / tau);
      currentX += (targetX - currentX) * k;
      currentY += (targetY - currentY) * k;
      setVarsFromXY(currentX, currentY);
      const stillFar = Math.abs(targetX - currentX) > 0.05 || Math.abs(targetY - currentY) > 0.05;
      if (stillFar || document.hasFocus()) {
        rafId = requestAnimationFrame(step);
      } else {
        running = false;
        lastTs = 0;
        if (rafId) { cancelAnimationFrame(rafId); rafId = null; }
      }
    };

    const start = () => {
      if (running) return;
      running = true;
      lastTs = 0;
      rafId = requestAnimationFrame(step);
    };

    return {
      setImmediate(x, y) { currentX = x; currentY = y; setVarsFromXY(x, y); },
      setTarget(x, y) { targetX = x; targetY = y; start(); },
      toCenter() {
        const shell = shellRef.current;
        if (!shell) return;
        this.setTarget(shell.clientWidth / 2, shell.clientHeight / 2);
      },
      beginInitial(durationMs) { initialUntil = performance.now() + durationMs; start(); },
      getCurrent() { return { x: currentX, y: currentY, tx: targetX, ty: targetY }; },
      cancel() {
        if (rafId) cancelAnimationFrame(rafId);
        rafId = null; running = false; lastTs = 0;
      },
    };
  }, [enableTilt]);

  const getOffsets = (evt: PointerEvent, el: HTMLElement) => {
    const rect = el.getBoundingClientRect();
    return { x: evt.clientX - rect.left, y: evt.clientY - rect.top };
  };

  const handlePointerMove = useCallback((event: PointerEvent) => {
    const shell = shellRef.current;
    if (!shell || !tiltEngine) return;
    const { x, y } = getOffsets(event, shell);
    tiltEngine.setTarget(x, y);
  }, [tiltEngine]);

  const handlePointerEnter = useCallback((event: PointerEvent) => {
    const shell = shellRef.current;
    if (!shell || !tiltEngine) return;
    shell.classList.add('active', 'entering');
    if (enterTimerRef.current) window.clearTimeout(enterTimerRef.current);
    enterTimerRef.current = window.setTimeout(() => {
      shell.classList.remove('entering');
    }, ANIMATION_CONFIG.ENTER_TRANSITION_MS);
    const { x, y } = getOffsets(event, shell);
    tiltEngine.setTarget(x, y);
  }, [tiltEngine]);

  const handlePointerLeave = useCallback(() => {
    const shell = shellRef.current;
    if (!shell || !tiltEngine) return;
    tiltEngine.toCenter();
    const checkSettle = () => {
      const { x, y, tx, ty } = tiltEngine.getCurrent();
      if (Math.hypot(tx - x, ty - y) < 0.6) {
        shell.classList.remove('active');
        leaveRafRef.current = null;
      } else {
        leaveRafRef.current = requestAnimationFrame(checkSettle);
      }
    };
    if (leaveRafRef.current) cancelAnimationFrame(leaveRafRef.current);
    leaveRafRef.current = requestAnimationFrame(checkSettle);
  }, [tiltEngine]);

  const handleDeviceOrientation = useCallback((event: DeviceOrientationEvent) => {
    const shell = shellRef.current;
    if (!shell || !tiltEngine) return;
    const { beta, gamma } = event;
    if (beta == null || gamma == null) return;
    const centerX = shell.clientWidth / 2;
    const centerY = shell.clientHeight / 2;
    const x = clamp(centerX + gamma * mobileTiltSensitivity, 0, shell.clientWidth);
    const y = clamp(centerY + (beta - ANIMATION_CONFIG.DEVICE_BETA_OFFSET) * mobileTiltSensitivity, 0, shell.clientHeight);
    tiltEngine.setTarget(x, y);
  }, [tiltEngine, mobileTiltSensitivity]);

  useEffect(() => {
    if (!enableTilt || !tiltEngine) return;
    const shell = shellRef.current;
    if (!shell) return;

    shell.addEventListener('pointerenter', handlePointerEnter as EventListener);
    shell.addEventListener('pointermove', handlePointerMove as EventListener);
    shell.addEventListener('pointerleave', handlePointerLeave as EventListener);

    const handleClick = () => {
      if (!enableMobileTilt) return;
      const anyMotion = window.DeviceMotionEvent as unknown as { requestPermission?: () => Promise<string> };
      if (anyMotion?.requestPermission) {
        anyMotion.requestPermission().then((state: string) => {
          if (state === 'granted') window.addEventListener('deviceorientation', handleDeviceOrientation as EventListener);
        }).catch(console.error);
      } else {
        window.addEventListener('deviceorientation', handleDeviceOrientation as EventListener);
      }
    };
    shell.addEventListener('click', handleClick);

    const initialX = (shell.clientWidth || 0) - ANIMATION_CONFIG.INITIAL_X_OFFSET;
    const initialY = ANIMATION_CONFIG.INITIAL_Y_OFFSET;
    tiltEngine.setImmediate(initialX, initialY);
    tiltEngine.toCenter();
    tiltEngine.beginInitial(ANIMATION_CONFIG.INITIAL_DURATION);

    return () => {
      shell.removeEventListener('pointerenter', handlePointerEnter as EventListener);
      shell.removeEventListener('pointermove', handlePointerMove as EventListener);
      shell.removeEventListener('pointerleave', handlePointerLeave as EventListener);
      shell.removeEventListener('click', handleClick);
      window.removeEventListener('deviceorientation', handleDeviceOrientation as EventListener);
      if (enterTimerRef.current) window.clearTimeout(enterTimerRef.current);
      if (leaveRafRef.current) cancelAnimationFrame(leaveRafRef.current);
      tiltEngine.cancel();
      shell.classList.remove('entering');
    };
  }, [enableTilt, enableMobileTilt, tiltEngine, handlePointerMove, handlePointerEnter, handlePointerLeave, handleDeviceOrientation]);

  const cardStyle = useMemo(() => ({
    '--icon': iconUrl ? `url(${iconUrl})` : 'none',
    '--grain': grainUrl ? `url(${grainUrl})` : 'none',
    '--inner-gradient': innerGradient ?? DEFAULT_INNER_GRADIENT,
    '--behind-glow-color': behindGlowColor ?? 'rgba(200, 255, 0, 0.35)',
    '--behind-glow-size': behindGlowSize ?? '50%',
  } as React.CSSProperties), [iconUrl, grainUrl, innerGradient, behindGlowColor, behindGlowSize]);

  const handleContactClick = useCallback(() => {
    setIsExpanded(true);
    onContactClick?.();
  }, [onContactClick]);

  return (
    <>
      {/* Normal Card */}
      <div ref={wrapRef} className={`pc-card-wrapper ${className}`.trim()} style={cardStyle}>
        {behindGlowEnabled && <div className="pc-behind" />}
        <div ref={shellRef} className="pc-card-shell">
          <section className="pc-card">
            <div className="pc-inside">
              <div className="pc-shine" />
              <div className="pc-glare" />
              <div className="pc-content pc-avatar-content">
                <img
                  className="avatar"
                  src={avatarUrl}
                  alt={`${name} avatar`}
                  loading="lazy"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                />
                {showUserInfo && (
                  <div className="pc-user-info">
                    <div className="pc-user-details">
                      <div className="pc-user-text">
                        <div className="pc-handle">@{handle}</div>
                        <div className="pc-status">{status}</div>
                      </div>
                    </div>
                    <button
                      className="pc-contact-btn"
                      onClick={handleContactClick}
                      style={{ pointerEvents: 'auto' }}
                      type="button"
                      aria-label={`Contact ${name}`}
                    >
                      {contactText}
                    </button>
                  </div>
                )}
              </div>
              <div className="pc-content">
                <div className="pc-details">
                  <h3>{name}</h3>
                  <p>{title}</p>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>

      {/* Expanded Card Overlay */}
      <AnimatePresence>
        {isExpanded && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsExpanded(false)}
              className="fixed inset-0 z-40 bg-ground/60 backdrop-blur-sm"
            />

            {/* Expanded Card */}
            <motion.div
              initial={{ scale: 0.8, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.8, opacity: 0, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto"
              onClick={() => setIsExpanded(false)}
            >
              <motion.div
                onClick={(e) => e.stopPropagation()}
                className="w-full max-w-xs bg-turf border border-line rounded-sm p-5 relative my-auto"
              >
                {/* Close Button */}
                <button
                  type="button"
                  onClick={() => setIsExpanded(false)}
                  className="absolute top-3 right-3 flex items-center justify-center w-7 h-7 rounded-full bg-slate border border-line text-chalk hover:text-lime transition-colors"
                  aria-label="Close"
                >
                  <X size={14} />
                </button>

                {/* Avatar and Name */}
                <div className="flex flex-col items-center gap-3 text-center mb-5">
                  <img
                    src={avatarUrl}
                    alt={name}
                    className="w-20 h-20 rounded-sm object-cover border border-line"
                  />
                  <div>
                    <h3 className="font-display text-xl text-chalk">{name}</h3>
                    <p className="text-mist text-sm mt-0.5">{title}</p>
                  </div>
                </div>

                {/* Contact Info */}
                <div className="space-y-2">
                  <p className="font-body text-[10px] text-mist uppercase tracking-widest mb-3">Get in touch</p>

                  {/* Email */}
                  <motion.a
                    href={`mailto:${email}`}
                    whileHover={{ x: 4 }}
                    className="flex items-center gap-3 p-3 rounded-sm bg-ground/40 border border-line hover:border-lime/30 transition-colors group"
                  >
                    <div className="w-8 h-8 rounded-sm bg-lime/10 flex items-center justify-center group-hover:bg-lime/20 transition-colors flex-shrink-0">
                      <Mail size={14} className="text-lime" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] text-mist mb-0.5">Email</p>
                      <p className="text-chalk text-xs truncate font-body">{email}</p>
                    </div>
                  </motion.a>

                  {/* LinkedIn */}
                  <motion.a
                    href={linkedin}
                    target="_blank"
                    rel="noopener noreferrer"
                    whileHover={{ x: 4 }}
                    className="flex items-center gap-3 p-3 rounded-sm bg-ground/40 border border-line hover:border-lime/30 transition-colors group"
                  >
                    <div className="w-8 h-8 rounded-sm bg-lime/10 flex items-center justify-center group-hover:bg-lime/20 transition-colors flex-shrink-0">
                      <ExternalLink size={14} className="text-lime" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] text-mist mb-0.5">LinkedIn</p>
                      <p className="text-chalk text-xs font-body">Connect & Follow</p>
                    </div>
                  </motion.a>

                  {/* GitHub */}
                  <motion.a
                    href={github}
                    target="_blank"
                    rel="noopener noreferrer"
                    whileHover={{ x: 4 }}
                    className="flex items-center gap-3 p-3 rounded-sm bg-ground/40 border border-line hover:border-lime/30 transition-colors group"
                  >
                    <div className="w-8 h-8 rounded-sm bg-lime/10 flex items-center justify-center group-hover:bg-lime/20 transition-colors flex-shrink-0">
                      <ExternalLink size={14} className="text-lime" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] text-mist mb-0.5">GitHub</p>
                      <p className="text-chalk text-xs font-body">View Code</p>
                    </div>
                  </motion.a>
                </div>
              </motion.div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

const ProfileCard = React.memo(ProfileCardComponent);
export default ProfileCard;
