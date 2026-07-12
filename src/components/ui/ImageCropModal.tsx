import { useState, useCallback } from 'react'
import Cropper from 'react-easy-crop'
import type { Area } from 'react-easy-crop'
import { RotateCw, X, Check } from 'lucide-react'
import { cn } from '../../utils/formatters'
import { Btn } from './Btn'

// ─── Canvas helper ────────────────────────────────────────────────────────────
// react-easy-crop's croppedAreaPixels are in the ORIGINAL IMAGE's coordinate
// space regardless of rotation. The correct approach:
//   1. Draw the full source onto a rotated intermediate canvas.
//   2. Translate the crop coordinates from image-space → rotated-canvas-space.
//   3. Cut that region out as the final output.

export async function getCroppedBlob(
  imageSrc: string,
  croppedAreaPixels: Area,
  rotation: number,
  quality = 0.92
): Promise<Blob> {
  const image = await new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image()
    img.addEventListener('load', () => resolve(img))
    img.addEventListener('error', reject)
    img.src = imageSrc
  })

  const iw = image.naturalWidth
  const ih = image.naturalHeight

  // ── Step 1: draw the full image rotated onto an intermediate canvas ──────
  const radians = (rotation * Math.PI) / 180
  const sin = Math.abs(Math.sin(radians))
  const cos = Math.abs(Math.cos(radians))
  const rotW = Math.round(iw * cos + ih * sin)
  const rotH = Math.round(iw * sin + ih * cos)

  const rotCanvas = document.createElement('canvas')
  rotCanvas.width  = rotW
  rotCanvas.height = rotH
  const rotCtx = rotCanvas.getContext('2d')!
  // Rotate around the centre of the rotated canvas
  rotCtx.translate(rotW / 2, rotH / 2)
  rotCtx.rotate(radians)
  // Draw image centred at origin
  rotCtx.drawImage(image, -iw / 2, -ih / 2)

  // ── Step 2: convert crop coords from image-space → rotated-canvas-space ──
  // The image was placed so its centre aligns with the rotated canvas centre.
  // react-easy-crop's pixel coords are in the original image's space (before
  // rotation), so we need to offset by the margin added by the rotation expansion.
  const offsetX = (rotW - iw) / 2
  const offsetY = (rotH - ih) / 2

  const srcX = croppedAreaPixels.x + offsetX
  const srcY = croppedAreaPixels.y + offsetY
  const outW = croppedAreaPixels.width
  const outH = croppedAreaPixels.height

  // ── Step 3: cut the crop region into the final canvas ────────────────────
  const outCanvas = document.createElement('canvas')
  outCanvas.width  = outW
  outCanvas.height = outH
  const outCtx = outCanvas.getContext('2d')!
  outCtx.drawImage(rotCanvas, srcX, srcY, outW, outH, 0, 0, outW, outH)

  return new Promise((resolve, reject) => {
    outCanvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('canvas.toBlob failed'))),
      'image/jpeg',
      quality
    )
  })
}

// ─── Aspect ratio presets ─────────────────────────────────────────────────────

const ASPECT_PRESETS = [
  { label: '1 : 1',  value: 1 },
  { label: '4 : 5',  value: 4 / 5 },
  { label: '16 : 9', value: 16 / 9 },
  { label: 'Free',   value: 0 },   // 0 → pass undefined to Cropper
] as const

type AspectValue = (typeof ASPECT_PRESETS)[number]['value']

// ─── Component ────────────────────────────────────────────────────────────────

interface ImageCropModalProps {
  imageSrc: string
  onDone: (file: File | null) => void
}

export function ImageCropModal({ imageSrc, onDone }: ImageCropModalProps) {
  const [crop,              setCrop]              = useState({ x: 0, y: 0 })
  const [zoom,              setZoom]              = useState(1)
  const [rotation,          setRotation]          = useState(0)
  const [aspectPreset,      setAspectPreset]      = useState<AspectValue>(1)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null)
  const [applying,          setApplying]          = useState(false)

  const onCropComplete = useCallback((_: Area, pixels: Area) => {
    setCroppedAreaPixels(pixels)
  }, [])

  // Reset crop position when aspect changes so the crop box re-centres
  const handleAspectChange = (value: AspectValue) => {
    setAspectPreset(value)
    setCrop({ x: 0, y: 0 })
    setZoom(1)
  }

  const handleApply = async () => {
    if (!croppedAreaPixels) return
    setApplying(true)
    try {
      const blob = await getCroppedBlob(imageSrc, croppedAreaPixels, rotation)
      const file = new File([blob], 'image.jpg', { type: 'image/jpeg' })
      onDone(file)
    } catch (err) {
      console.error('Crop failed', err)
      onDone(null)
    } finally {
      setApplying(false)
    }
  }

  const cropperAspect = aspectPreset === 0 ? undefined : aspectPreset

  return (
    // Full-screen backdrop — sits above the post modal (z-50) at z-[60]
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm">

      {/* Sheet — full width on mobile, capped on desktop */}
      <div className="
        w-full sm:max-w-md
        bg-turf border border-line
        rounded-t-2xl sm:rounded-2xl
        shadow-[0_-8px_40px_rgba(0,0,0,0.6)] sm:shadow-[0_16px_48px_rgba(0,0,0,0.5)]
        flex flex-col
        max-h-[95dvh]
        overflow-hidden
      ">

        {/* ── Header ───────────────────────────────────────────────── */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-line shrink-0">
          <h3 className="font-display text-xl text-chalk tracking-wide">Crop Image</h3>
          <button
            onClick={() => onDone(null)}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-mist hover:text-chalk hover:bg-slate transition-colors duration-150"
            aria-label="Cancel"
          >
            <X size={18} />
          </button>
        </div>

        {/* ── Cropper canvas — fixed height, never scrolls ──────────── */}
        <div className="relative w-full bg-black shrink-0" style={{ height: 300 }}>
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            rotation={rotation}
            aspect={cropperAspect}
            showGrid
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={onCropComplete}
            style={{
              containerStyle: { background: '#000' },
              cropAreaStyle: {
                border: '2px solid rgba(200,255,0,0.85)',
                boxShadow: '0 0 0 9999px rgba(0,0,0,0.6)',
              },
            }}
          />
        </div>

        {/* ── Controls — scrollable if viewport is tiny ─────────────── */}
        <div className="overflow-y-auto overscroll-contain px-5 py-5 space-y-5 shrink">

          {/* Aspect ratio */}
          <div>
            <p className="text-[10px] font-mono text-mist uppercase tracking-[0.18em] mb-2.5">
              Aspect Ratio
            </p>
            <div className="grid grid-cols-4 gap-2">
              {ASPECT_PRESETS.map((preset) => (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => handleAspectChange(preset.value)}
                  className={cn(
                    'py-2 rounded-lg text-xs font-medium border transition-all duration-150',
                    aspectPreset === preset.value
                      ? 'bg-lime text-on-lime border-transparent shadow-[0_0_10px_rgba(200,255,0,0.3)]'
                      : 'bg-slate text-mist border-line hover:text-chalk hover:border-chalk/20'
                  )}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          {/* Zoom */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-[10px] font-mono text-mist uppercase tracking-[0.18em]">Zoom</p>
              <span className="text-[11px] font-mono text-lime">{zoom.toFixed(2)}×</span>
            </div>
            <input
              type="range"
              min={1}
              max={3}
              step={0.02}
              value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
              className="w-full accent-lime cursor-pointer"
            />
          </div>

          {/* Rotation */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-[10px] font-mono text-mist uppercase tracking-[0.18em]">Rotation</p>
              <span className="text-[11px] font-mono text-lime">{rotation}°</span>
            </div>
            <input
              type="range"
              min={0}
              max={360}
              step={1}
              value={rotation}
              onChange={(e) => setRotation(Number(e.target.value))}
              className="w-full accent-lime cursor-pointer"
            />
          </div>

          {/* Action buttons */}
          <div className="flex gap-2 pb-1">
            <Btn
              type="button"
              variant="outline"
              onClick={() => setRotation((r) => (r + 90) % 360)}
              className="flex items-center justify-center gap-2 text-sm px-4"
            >
              <RotateCw size={14} />
              90°
            </Btn>
            <Btn
              type="button"
              onClick={handleApply}
              disabled={applying}
              className="flex-1 flex items-center justify-center gap-2 text-sm"
            >
              {applying ? (
                <>
                  <span className="w-4 h-4 border-2 border-on-lime/30 border-t-on-lime rounded-full animate-spin" />
                  Applying…
                </>
              ) : (
                <>
                  <Check size={15} />
                  Apply Crop
                </>
              )}
            </Btn>
          </div>
        </div>
      </div>
    </div>
  )
}
