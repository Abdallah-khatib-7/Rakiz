import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number, currency: string): string {
  const localeMap: Record<string, string> = {
    USD: 'en-US',
    EUR: 'en-DE',
    GBP: 'en-GB',
    SAR: 'ar-SA',
    AED: 'ar-AE',
    LBP: 'ar-LB',
  }
  try {
    return new Intl.NumberFormat(localeMap[currency] ?? 'en-US', {
      style: 'currency',
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount)
  } catch {
    return `${amount.toFixed(2)} ${currency}`
  }
}

export function formatDate(dateStr: string): string {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(dateStr))
}

export function formatRelativeTime(dateStr: string): string {
  const now = Date.now()
  const then = new Date(dateStr).getTime()
  const diff = now - then
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)
  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes}m ago`
  if (hours < 24) return `${hours}h ago`
  if (days < 7) return `${days}d ago`
  return formatDate(dateStr)
}

export const CURRENCIES = ['USD', 'EUR', 'LBP', 'SAR', 'AED', 'GBP'] as const
export type Currency = (typeof CURRENCIES)[number]

export const CURRENCY_FLAGS: Record<Currency, string> = {
  USD: '🇺🇸',
  EUR: '🇪🇺',
  LBP: '🇱🇧',
  SAR: '🇸🇦',
  AED: '🇦🇪',
  GBP: '🇬🇧',
}
