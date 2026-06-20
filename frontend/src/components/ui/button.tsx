import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cn } from '@/lib/utils'

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'secondary' | 'outline' | 'ghost' | 'destructive' | 'link'
  size?: 'sm' | 'md' | 'lg' | 'icon'
  asChild?: boolean
  loading?: boolean
}

const variants: Record<string, string> = {
  default: 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm',
  secondary: 'bg-[#1f1f28] hover:bg-[#2a2a35] text-gray-100 border border-[#2a2a35]',
  outline: 'border border-[#2a2a35] bg-transparent hover:bg-[#1f1f28] text-gray-100',
  ghost: 'bg-transparent hover:bg-[#1f1f28] text-gray-300 hover:text-gray-100',
  destructive: 'bg-red-600 hover:bg-red-700 text-white',
  link: 'bg-transparent text-indigo-400 hover:text-indigo-300 underline-offset-4 hover:underline p-0 h-auto',
}

const sizes: Record<string, string> = {
  sm: 'h-8 px-3 text-xs rounded-md',
  md: 'h-10 px-4 text-sm rounded-lg',
  lg: 'h-11 px-6 text-base rounded-lg',
  icon: 'h-9 w-9 rounded-lg',
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'md', asChild = false, loading, children, disabled, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button'
    return (
      <Comp
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center gap-2 font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0f0f13] disabled:pointer-events-none disabled:opacity-50 cursor-pointer',
          variants[variant],
          sizes[size],
          className
        )}
        disabled={disabled || loading}
        {...props}
      >
        {loading && (
          <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        )}
        {children}
      </Comp>
    )
  }
)
Button.displayName = 'Button'
