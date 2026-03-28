import type { ButtonHTMLAttributes, ReactNode } from 'react'

type Variant = 'primary' | 'secondary' | 'ghost'
type Size = 'sm' | 'md' | 'lg'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  children: ReactNode
}

const variantClasses: Record<Variant, string> = {
  primary:   'bg-accent text-white hover:opacity-90 active:scale-[0.97] shadow-warm-sm',
  secondary: 'border border-border text-ink hover:bg-accent-soft active:scale-[0.97]',
  ghost:     'text-ink-secondary hover:text-ink hover:bg-ink/8',
}

const sizeClasses: Record<Size, string> = {
  sm: 'px-3 py-1.5 text-xs rounded-lg',
  md: 'px-5 py-2 text-sm rounded-full',
  lg: 'px-6 py-2.5 text-base rounded-full',
}

export function Button({
  variant = 'primary',
  size = 'md',
  className = '',
  children,
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      {...props}
      disabled={disabled}
      className={`
        inline-flex items-center justify-center gap-2 font-medium
        transition-all duration-150
        disabled:opacity-40 disabled:pointer-events-none
        ${variantClasses[variant]}
        ${sizeClasses[size]}
        ${className}
      `.trim()}
    >
      {children}
    </button>
  )
}
