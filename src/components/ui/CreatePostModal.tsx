import { useState, useRef } from 'react'
import { X, Image as ImageIcon, Loader2, Crop } from 'lucide-react'
import type { PostType } from '../../types'
import { cn } from '../../utils/formatters'
import { ImageCropModal } from './ImageCropModal'

interface CreatePostModalProps {
  isOpen: boolean
  onClose: () => void
  onCreatePost: (data: { caption: string; postType: PostType; images: File[] }) => void
  isLoading?: boolean
  initialCaption?: string
  initialPostType?: PostType
  isEdit?: boolean
}

const POST_TYPES = [
  { value: 'general',      label: 'General' },
  { value: 'announcement', label: 'Announcement' },
  { value: 'tournament',   label: 'Tournament' },
]

export function CreatePostModal({
  isOpen,
  onClose,
  onCreatePost,
  isLoading,
  initialCaption,
  initialPostType,
  isEdit,
}: CreatePostModalProps) {
  const [caption,    setCaption]    = useState(initialCaption  || '')
  const [postType,   setPostType]   = useState<PostType>(initialPostType || 'general')
  const [images,     setImages]     = useState<File[]>([])
  const [previews,   setPreviews]   = useState<string[]>([])

  // Crop modal state — one image queued at a time
  const [cropSrc,    setCropSrc]    = useState<string | null>(null)

  const fileInputRef = useRef<HTMLInputElement>(null)

  if (!isOpen) return null

  // ── helpers ────────────────────────────────────────────────────────────────

  /** Convert a File to a data-URL for the cropper */
  const fileToDataUrl = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload  = () => resolve(reader.result as string)
      reader.onerror = reject
      reader.readAsDataURL(file)
    })

  /** Convert a File to an object-URL for preview thumbnails */
  const fileToObjectUrl = (file: File) => URL.createObjectURL(file)

  // ── file input → open crop modal ───────────────────────────────────────────

  const handleFileInput = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    // reset so the same file can be re-selected after a cancel
    if (fileInputRef.current) fileInputRef.current.value = ''
    if (!file) return
    if (images.length >= 5) return

    const dataUrl = await fileToDataUrl(file)
    setCropSrc(dataUrl)
  }

  // ── crop modal callback ────────────────────────────────────────────────────

  const handleCropDone = (croppedFile: File | null) => {
    setCropSrc(null)
    if (!croppedFile) return                         // user cancelled

    setImages(prev  => [...prev, croppedFile])
    setPreviews(prev => [...prev, fileToObjectUrl(croppedFile)])
  }

  // ── remove an already-added image ─────────────────────────────────────────

  const removeImage = (index: number) => {
    // revoke the object-URL to free memory
    URL.revokeObjectURL(previews[index])
    setImages(prev  => prev.filter((_, i) => i !== index))
    setPreviews(prev => prev.filter((_, i) => i !== index))
  }

  // ── re-crop an existing image ──────────────────────────────────────────────

  const recropImage = async (index: number) => {
    const dataUrl = await fileToDataUrl(images[index])
    // remove the slot first; the new cropped file will be appended at the end
    // (keeping position would require more complex logic; appending is fine for posts)
    removeImage(index)
    setCropSrc(dataUrl)
  }

  // ── submit ─────────────────────────────────────────────────────────────────

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!caption.trim() && images.length === 0) return
    onCreatePost({ caption: caption.trim(), postType, images })
  }

  // ── close / reset ──────────────────────────────────────────────────────────

  const handleClose = () => {
    previews.forEach(URL.revokeObjectURL)
    setCaption('')
    setPostType('general')
    setImages([])
    setPreviews([])
    setCropSrc(null)
    onClose()
  }

  // ─────────────────────────────────────────────────────────────────────────

  return (
    <>
      {/* ── Post modal ──────────────────────────────────────────────────── */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <div
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          onClick={handleClose}
        />

        {/* Panel */}
        <div className="relative bg-turf rounded-2xl w-full max-w-lg border border-line shadow-2xl flex flex-col max-h-[90dvh]">

          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-line shrink-0">
            <h2 className="font-display text-xl text-chalk tracking-wide">
              {isEdit ? 'Edit Post' : 'Create Post'}
            </h2>
            <button
              onClick={handleClose}
              disabled={isLoading}
              className="w-8 h-8 flex items-center justify-center rounded-lg text-mist hover:text-chalk hover:bg-slate transition-colors duration-150"
            >
              <X size={18} />
            </button>
          </div>

          {/* Scrollable body */}
          <form onSubmit={handleSubmit} className="flex flex-col gap-4 p-5 overflow-y-auto">

            {/* Post Type */}
            <div>
              <p className="text-xs font-mono text-mist uppercase tracking-widest mb-2">Post Type</p>
              <div className="flex gap-2">
                {POST_TYPES.map((type) => (
                  <button
                    key={type.value}
                    type="button"
                    onClick={() => setPostType(type.value as PostType)}
                    className={cn(
                      'flex-1 px-3 py-2 rounded-lg text-sm font-medium border transition-all duration-150',
                      postType === type.value
                        ? 'bg-lime text-on-lime border-transparent'
                        : 'bg-slate text-mist border-line hover:text-chalk hover:border-chalk/20'
                    )}
                  >
                    {type.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Caption */}
            <div>
              <textarea
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                placeholder="What's on your mind?"
                rows={4}
                maxLength={500}
                disabled={isLoading}
                className="w-full p-3 bg-slate border border-line rounded-xl text-sm text-chalk placeholder:text-mist/50 resize-none focus:outline-none focus:ring-2 focus:ring-lime/40 focus:border-lime/30 transition-all duration-200"
              />
              <p className="text-right text-xs font-mono text-mist mt-1">{caption.length}/500</p>
            </div>

            {/* Images */}
            <div>
              <p className="text-xs font-mono text-mist uppercase tracking-widest mb-2">
                Images
                <span className="ml-1 text-mist/50">({images.length}/5)</span>
              </p>

              {/* Hidden file input — single file only; the cropper handles it */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                disabled={isLoading || images.length >= 5}
                onChange={handleFileInput}
              />

              {previews.length > 0 ? (
                <div className="grid grid-cols-3 gap-2">
                  {previews.map((preview, index) => (
                    <div
                      key={index}
                      className="relative aspect-square rounded-xl overflow-hidden bg-slate group"
                    >
                      <img
                        src={preview}
                        alt={`Image ${index + 1}`}
                        className="w-full h-full object-cover"
                      />

                      {/* Hover overlay */}
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-colors duration-200 flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                        {/* Re-crop */}
                        <button
                          type="button"
                          onClick={() => recropImage(index)}
                          className="w-8 h-8 flex items-center justify-center rounded-full bg-lime text-on-lime hover:brightness-110 transition-all duration-150"
                          title="Re-crop"
                          disabled={isLoading}
                        >
                          <Crop size={14} />
                        </button>
                        {/* Remove */}
                        <button
                          type="button"
                          onClick={() => removeImage(index)}
                          className="w-8 h-8 flex items-center justify-center rounded-full bg-red-500/90 text-white hover:bg-red-500 transition-all duration-150"
                          title="Remove"
                          disabled={isLoading}
                        >
                          <X size={14} />
                        </button>
                      </div>
                    </div>
                  ))}

                  {/* Add more slot */}
                  {images.length < 5 && (
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isLoading}
                      className="aspect-square rounded-xl border-2 border-dashed border-line flex flex-col items-center justify-center gap-1 text-mist hover:text-chalk hover:border-lime/40 transition-all duration-200"
                    >
                      <ImageIcon size={20} />
                      <span className="text-[10px] font-mono">Add</span>
                    </button>
                  )}
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isLoading}
                  className="w-full py-8 border-2 border-dashed border-line rounded-xl flex flex-col items-center justify-center gap-2 text-mist hover:text-chalk hover:border-lime/40 transition-all duration-200 group"
                >
                  <div className="w-10 h-10 rounded-full bg-slate flex items-center justify-center group-hover:bg-lime/10 transition-colors duration-200">
                    <ImageIcon size={20} />
                  </div>
                  <span className="text-sm">Add images</span>
                  <span className="text-xs font-mono text-mist/60">Up to 5 · tap to crop after selecting</span>
                </button>
              )}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading || (!caption.trim() && images.length === 0)}
              className={cn(
                'w-full py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all duration-200',
                isLoading || (!caption.trim() && images.length === 0)
                  ? 'bg-slate text-mist cursor-not-allowed'
                  : 'bg-lime text-on-lime hover:brightness-105 active:scale-[0.99]'
              )}
            >
              {isLoading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  {isEdit ? 'Updating…' : 'Posting…'}
                </>
              ) : (
                isEdit ? 'Update Post' : 'Post'
              )}
            </button>
          </form>
        </div>
      </div>

      {/* ── Crop modal (layers above post modal) ────────────────────────── */}
      {cropSrc && (
        <ImageCropModal
          imageSrc={cropSrc}
          onDone={handleCropDone}
        />
      )}
    </>
  )
}
