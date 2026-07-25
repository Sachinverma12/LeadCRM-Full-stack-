import { cn } from "@/lib/utils"
import { Circle } from "lucide-react"

const STATUS_CONFIG: Record<string, { color: string; label: string }> = {
  NEW: { color: "bg-blue-500/20 text-blue-300 border-blue-500/30", label: "New" },
  CONTACTED: { color: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30", label: "Contacted" },
  QUALIFIED: { color: "bg-purple-500/20 text-purple-300 border-purple-500/30", label: "Qualified" },
  PROPOSAL: { color: "bg-orange-500/20 text-orange-300 border-orange-500/30", label: "Proposal" },
  WON: { color: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30", label: "Won" },
  LOST: { color: "bg-red-500/20 text-red-300 border-red-500/30", label: "Lost" },
}

const STATUS_DOT_COLORS: Record<string, string> = {
  NEW: "fill-blue-400",
  CONTACTED: "fill-yellow-400",
  QUALIFIED: "fill-purple-400",
  PROPOSAL: "fill-orange-400",
  WON: "fill-emerald-400",
  LOST: "fill-red-400",
}

interface StatusBadgeProps {
  status: string
  showDot?: boolean
  className?: string
}

export function StatusBadge({ status, showDot = true, className }: StatusBadgeProps) {
  const config = STATUS_CONFIG[status] || { color: "bg-slate-500/20 text-slate-300 border-slate-500/30", label: status }
  const dotColor = STATUS_DOT_COLORS[status] || "fill-slate-400"

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border transition-all duration-200",
        config.color,
        className
      )}
    >
      {showDot && (
        <Circle className={cn("w-2 h-2", dotColor)} />
      )}
      {config.label}
    </span>
  )
}

export { STATUS_CONFIG, STATUS_DOT_COLORS }

