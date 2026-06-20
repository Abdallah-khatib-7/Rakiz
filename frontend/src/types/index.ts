export interface User {
  id: number
  email: string
  full_name: string
  avatar_url?: string
  is_verified: boolean
  subscription_tier: 'free' | 'pro' | 'premium'
  created_at: string
}

export interface Wallet {
  id: number
  user_id: number
  currency: string
  balance: string
  updated_at: string
}

export interface Transaction {
  id: number
  type: 'send' | 'receive' | 'link_payment' | 'split_settlement' | 'request_payment'
  amount: string
  currency: string
  sender_name?: string
  receiver_name?: string
  note?: string
  status: 'pending' | 'completed' | 'failed'
  created_at: string
}

export interface PaymentLink {
  id: number
  user_id: number
  token: string
  amount?: string
  currency: string
  description?: string
  is_single_use: boolean
  is_used: boolean
  expires_at?: string
  created_at: string
}

export interface MoneyRequest {
  id: number
  requester_id: number
  target_id: number
  amount: string
  currency: string
  note?: string
  status: 'pending' | 'paid' | 'declined' | 'cancelled' | 'expired'
  requester_name: string
  target_name: string
  expires_at?: string
  created_at: string
}

export interface Split {
  id: number
  creator_id: number
  title: string
  total_amount: string
  currency: string
  split_type: 'equal' | 'custom' | 'percentage'
  status: 'pending' | 'completed'
  created_at: string
  members: SplitMember[]
}

export interface SplitMember {
  id: number
  split_id: number
  user_id: number
  email: string
  name: string
  amount: string
  is_settled: boolean
  settled_at?: string
}

export interface Notification {
  id: number
  user_id: number
  type: string
  title: string
  message: string
  is_read: boolean
  created_at: string
}

export interface AIInsight {
  id: number
  user_id: number
  month: string
  summary: string
  generated_at: string
}

export interface Anomaly {
  transaction_id: number
  reason: string
  amount: string
  currency: string
  created_at: string
}

export interface PaginatedResponse<T> {
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    total_pages: number
  }
}

export interface ApiError {
  error: string
}
