"use client"

import { useEffect, useRef } from "react"
import { cn } from "@/lib/utils"
import { X } from "lucide-react"

interface ModalProps {
  open: boolean
  onClose: () => void
  title: string
  description?: string
  children?: React.ReactNode
  footer?: React.ReactNode
  variant?: "default" | "destructive"
}

export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  variant = "default",
}: ModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }
    if (open) {
      document.addEventListener("keydown", handleEscape)
      document.body.style.overflow = "hidden"
    }
    return () => {
      document.removeEventListener("keydown", handleEscape)
      document.body.style.overflow = "unset"
    }
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={(e) => {
        if (e.target === overlayRef.current) onClose()
      }}
    >
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200" />

      {/* Modal */}
      <div
        className={cn(
          "relative z-10 w-full max-w-md rounded-2xl border shadow-2xl animate-in zoom-in-95 duration-200",
          variant === "destructive"
            ? "bg-red-950/90 border-red-800/50"
            : "bg-slate-800/95 border-slate-700/50"
        )}
      >
        {/* Header */}
        <div className="flex items-start justify-between p-6 pb-4">
          <div className="flex-1 pr-4">
            <h2
              className={cn(
                "text-lg font-semibold",
                variant === "destructive" ? "text-red-200" : "text-white"
              )}
            >
              {title}
            </h2>
            {description && (
              <p
                className={cn(
                  "text-sm mt-1",
                  variant === "destructive" ? "text-red-300" : "text-slate-400"
                )}
              >
                {description}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className={cn(
              "p-1 rounded-lg transition-colors",
              variant === "destructive"
                ? "text-red-400 hover:text-red-200 hover:bg-red-800/50"
                : "text-slate-400 hover:text-white hover:bg-slate-700/50"
            )}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        {children && <div className="px-6 pb-4">{children}</div>}

        {/* Footer */}
        {footer && (
          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-700/30">
            {footer}
          </div>
        )}
      </div>
    </div>
  )
}

export function ConfirmModal({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = "Confirm",
  cancelText = "Cancel",
  loading = false,
  variant = "destructive",
}: {
  open: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  description?: string
  confirmText?: string
  cancelText?: string
  loading?: boolean
  variant?: "default" | "destructive"
}) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      description={description}
      variant={variant}
      footer={
        <>
          <button
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 rounded-lg bg-slate-700/50 text-slate-300 hover:text-white hover:bg-slate-700 transition-colors text-sm font-medium disabled:opacity-50"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className={cn(
              "px-4 py-2 rounded-lg text-white transition-colors text-sm font-medium disabled:opacity-50 flex items-center gap-2",
              variant === "destructive"
                ? "bg-red-600 hover:bg-red-500"
                : "bg-blue-600 hover:bg-blue-500"
            )}
          >
            {loading && (
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            )}
            {confirmText}
          </button>
        </>
      }
    />
  )
}

