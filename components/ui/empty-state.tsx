import { cn } from "@/lib/utils"
import { Inbox } from "lucide-react"

interface EmptyStateProps {
  icon?: React.ReactNode
  title: string
  description?: string
  action?: React.ReactNode
  className?: string
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div className={cn("px-6 py-16 text-center", className)}>
      <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-700/30 flex items-center justify-center">
        {icon || <Inbox className="w-8 h-8 text-slate-500" />}
      </div>
      <h3 className="text-lg font-medium text-slate-300 mb-1">{title}</h3>
      {description && (
        <p className="text-sm text-slate-500 max-w-sm mx-auto mb-4">{description}</p>
      )}
      {action && <div>{action}</div>}
    </div>
  )
}

