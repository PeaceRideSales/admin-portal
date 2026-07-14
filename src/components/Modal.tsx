import { useEffect } from 'react'
import { X } from 'lucide-react'

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
}

export default function Modal({ isOpen, onClose, title, children }: ModalProps) {
  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'auto'
    }
    return () => {
      document.body.style.overflow = 'auto'
    }
  }, [isOpen])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 pt-4 pb-20 sm:p-0">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" 
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div className="relative clay-card w-full max-w-lg transform transition-all overflow-hidden max-h-[90vh] flex flex-col border border-white/50">
        {/* Header */}
        {title && (
          <div className="px-6 py-4 border-b border-blue-200/50 flex items-center justify-between shrink-0">
            <h3 className="text-lg font-bold text-slate-800 truncate pr-4">
              {title}
            </h3>
            <button
              onClick={onClose}
              className="clay-btn p-2 text-slate-400 hover:text-rose-500 transition-colors shrink-0"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        )}
        {!title && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-50 clay-btn p-2 text-slate-400 hover:text-rose-500 transition-colors shrink-0 rounded-full"
          >
            <X className="w-5 h-5" />
          </button>
        )}

        {/* Content */}
        <div className="p-6 overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  )
}
