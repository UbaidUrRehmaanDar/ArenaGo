import { useState, useRef } from 'react'
import { X, Image as ImageIcon, X as RemoveImage } from 'lucide-react'
import { Btn } from './Btn'
import type { PostType } from '../../types'
import { cn } from '../../utils/formatters'

interface CreatePostModalProps {
  isOpen: boolean
  onClose: () => void
  onCreatePost: (data: { caption: string; postType: PostType; images: File[] }) => void
  isLoading?: boolean
}

const POST_TYPES: { value: PostType; label: string }[] = [
  { value: 'general', label: 'General Post' },
  { value: 'announcement', label: 'Announcement' },
  { value: 'tournament', label: 'Tournament' },
]

export function CreatePostModal({ isOpen, onClose, onCreatePost, isLoading }: CreatePostModalProps) {
  const [caption, setCaption] = useState('')
  const [postType, setPostType] = useState<PostType>('general')
  const [images, setImages] = useState<File[]>([])
  const imageInputRef = useRef<HTMLInputElement>(null)

  if (!isOpen) return null

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length > 0) {
      setImages((prev) => [...prev, ...files].slice(0, 5)) // Max 5 images
    }
  }

  const handleRemoveImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!caption.trim() && images.length === 0) return

    onCreatePost({
      caption: caption.trim(),
      postType,
      images,
    })
  }

  const handleClose = () => {
    setCaption('')
    setPostType('general')
    setImages([])
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-6">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={handleClose}
        aria-hidden="true"
      />

      {/* Modal */}
      <div className="relative bg-slate rounded-sm border border-line w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-line">
          <h2 className="font-display text-xl text-chalk">Create Post</h2>
          <button
            type="button"
            onClick={handleClose}
            className="p-1.5 rounded-lg hover:bg-white/5 text-mist hover:text-chalk transition-colors"
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Post Type Selection */}
          <div>
            <label className="block text-sm font-mono text-mist mb-2 uppercase tracking-wider">
              Post Type
            </label>
            <div className="flex gap-2 flex-wrap">
              {POST_TYPES.map((type) => (
                <button
                  key={type.value}
                  type="button"
                  onClick={() => setPostType(type.value)}
                  className={cn(
                    'px-3 py-1.5 rounded-full text-sm font-body font-medium transition-colors',
                    postType === type.value
                      ? 'bg-lime text-on-lime'
                      : 'bg-slate text-mist hover:text-chalk border border-line'
                  )}
                >
                  {type.label}
                </button>
              ))}
            </div>
          </div>

          {/* Caption */}
          <div>
            <label htmlFor="caption" className="block text-sm font-mono text-mist mb-2 uppercase tracking-wider">
              Caption
            </label>
            <textarea
              id="caption"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="What's on your mind?"
              rows={4}
              maxLength={500}
              className="w-full bg-ground text-chalk px-4 py-3 rounded-sm border border-line focus:outline focus:outline-2 focus:outline-lime font-body text-[15px] resize-none"
            />
            <p className="text-xs text-mist mt-1 text-right">
              {caption.length}/500
            </p>
          </div>

          {/* Images */}
          <div>
            <label className="block text-sm font-mono text-mist mb-2 uppercase tracking-wider">
              Images {images.length > 0 && `(${images.length}/5)`}
            </label>
            
            {/* Image Preview Grid */}
            {images.length > 0 && (
              <div className="grid grid-cols-3 gap-2 mb-3">
                {images.map((image, index) => (
                  <div key={index} className="relative aspect-square rounded-sm overflow-hidden bg-ground">
                    <img
                      src={URL.createObjectURL(image)}
                      alt={`Preview ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveImage(index)}
                      className="absolute top-1 right-1 p-1 bg-black/50 rounded-full hover:bg-black/70 transition-colors"
                      aria-label="Remove image"
                    >
                      <RemoveImage size={14} className="text-white" />
                    </button>
                  </div>
                ))}
                {images.length < 5 && (
                  <button
                    type="button"
                    onClick={() => imageInputRef.current?.click()}
                    className="aspect-square rounded-sm border-2 border-dashed border-line flex flex-col items-center justify-center gap-1 hover:border-lime/50 hover:bg-white/5 transition-colors"
                  >
                    <ImageIcon size={20} className="text-mist" />
                    <span className="text-xs text-mist">Add</span>
                  </button>
                )}
              </div>
            )}

            {/* Add Image Button */}
            {images.length === 0 && (
              <button
                type="button"
                onClick={() => imageInputRef.current?.click()}
                className="w-full py-3 rounded-sm border-2 border-dashed border-line flex items-center justify-center gap-2 hover:border-lime/50 hover:bg-white/5 transition-colors"
              >
                <ImageIcon size={20} className="text-mist" />
                <span className="text-sm text-mist">Add Images</span>
              </button>
            )}

            <input
              ref={imageInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleImageSelect}
              className="hidden"
            />
          </div>
        </form>

        {/* Footer */}
        <div className="p-4 border-t border-line flex gap-3">
          <button
            type="button"
            onClick={handleClose}
            className="flex-1 px-4 py-2.5 rounded-sm border border-line text-chalk hover:bg-white/5 transition-colors font-body text-sm"
          >
            Cancel
          </button>
          <Btn
            type="submit"
            onClick={handleSubmit}
            disabled={!caption.trim() && images.length === 0}
            className="flex-1 px-4 py-2.5 text-sm"
          >
            {isLoading ? 'Posting...' : 'Post'}
          </Btn>
        </div>
      </div>
    </div>
  )
}
