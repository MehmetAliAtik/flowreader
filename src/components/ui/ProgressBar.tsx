interface ProgressBarProps {
  value: number        // 0-100
  height?: number      // px, default 6
  className?: string
}

export function ProgressBar({ value, height = 6, className = '' }: ProgressBarProps) {
  return (
    <div
      className={`w-full rounded-full bg-border/40 overflow-hidden ${className}`}
      style={{ height }}
    >
      <div
        className="h-full rounded-full bg-accent transition-all duration-300"
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
      />
    </div>
  )
}
