import { X, Mail, ExternalLink } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import React from 'react'

interface ContactModalProps {
  isOpen: boolean
  onClose: () => void
  name: string
  email: string
  linkedin: string
  github: string
  avatarUrl: string
}

export function ContactModal({
  isOpen,
  onClose,
  name,
  email,
  linkedin,
  github,
  avatarUrl,
}: ContactModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-ground/60 backdrop-blur-sm"
          />

          {/* Expandable Card */}
          <motion.div
            initial={{ x: '-100%', opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: '-100%', opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed left-0 top-0 z-50 h-screen w-full md:w-[500px] bg-turf border-r border-line overflow-y-auto"
          >
            <div className="p-6 md:p-10 space-y-8 min-h-screen flex flex-col">
              {/* Close Button */}
              <div className="flex items-center justify-between">
                <h2 className="font-display text-2xl text-chalk">Contact Info</h2>
                <button
                  type="button"
                  onClick={onClose}
                  className="flex items-center justify-center w-8 h-8 rounded-full bg-slate border border-line text-chalk hover:text-lime transition-colors"
                  aria-label="Close contact modal"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Avatar and Name */}
              <div className="flex flex-col items-center gap-4 text-center">
                <img
                  src={avatarUrl}
                  alt={name}
                  className="w-24 h-24 rounded-sm object-cover border border-line"
                />
                <div>
                  <h3 className="font-display text-2xl text-chalk">{name}</h3>
                  <p className="text-mist text-sm mt-1">Co-Founder</p>
                </div>
              </div>

              {/* Contact Links */}
              <div className="space-y-3 flex-1">
                <p className="font-body text-xs text-mist uppercase tracking-widest mb-4">Get in touch</p>

                {/* Email */}
                <motion.a
                  href={`mailto:${email}`}
                  whileHover={{ x: 4 }}
                  className="flex items-center gap-4 p-4 rounded-sm bg-ground/40 border border-line hover:border-lime/30 transition-colors group"
                >
                  <div className="w-10 h-10 rounded-sm bg-lime/10 flex items-center justify-center group-hover:bg-lime/20 transition-colors flex-shrink-0">
                    <Mail size={16} className="text-lime" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-mist mb-1">Email</p>
                    <p className="text-chalk text-sm truncate font-body">{email}</p>
                  </div>
                </motion.a>

                {/* LinkedIn */}
                <motion.a
                  href={linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                  whileHover={{ x: 4 }}
                  className="flex items-center gap-4 p-4 rounded-sm bg-ground/40 border border-line hover:border-lime/30 transition-colors group"
                >
                  <div className="w-10 h-10 rounded-sm bg-lime/10 flex items-center justify-center group-hover:bg-lime/20 transition-colors flex-shrink-0">
                    <ExternalLink size={16} className="text-lime" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-mist mb-1">LinkedIn</p>
                    <p className="text-chalk text-sm font-body">Connect & Follow</p>
                  </div>
                </motion.a>

                {/* GitHub */}
                <motion.a
                  href={github}
                  target="_blank"
                  rel="noopener noreferrer"
                  whileHover={{ x: 4 }}
                  className="flex items-center gap-4 p-4 rounded-sm bg-ground/40 border border-line hover:border-lime/30 transition-colors group"
                >
                  <div className="w-10 h-10 rounded-sm bg-lime/10 flex items-center justify-center group-hover:bg-lime/20 transition-colors flex-shrink-0">
                    <ExternalLink size={16} className="text-lime" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-mist mb-1">GitHub</p>
                    <p className="text-chalk text-sm font-body">View Code</p>
                  </div>
                </motion.a>
              </div>

              {/* Footer hint */}
              <div className="text-center border-t border-line pt-4">
                <p className="text-xs text-mist">Click elsewhere to close</p>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
