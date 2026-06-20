import * as React from 'react'
import { cn } from '@/lib/utils'

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'success' | 'warning' | 'destructive' | 'secondary'
}

const variants: Record<string, string> = {
  default: 'bg-indigo-600/20 text-indigo-400 border-indigo-600/30',
  success: 'bg-green-600/20 text-green-400 border-green-600/30',
  warning: 'bg-amber-600/20 text-amber-400 border-amber-600/30',
  destructive: 'bg-red-600/20 text-red-400 border-red-600/30',
  secondary: 'bg-[#2a2a35] text-gray-400 border-[#3a3a48]',
}

export function Badge({ className, variant = 'default', ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium',
        variants[variant],
        className
      )}
      {...props}
    />
  )
}
