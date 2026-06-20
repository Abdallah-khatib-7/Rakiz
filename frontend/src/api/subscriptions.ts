import api from './client'

export const subscriptionsApi = {
  createCheckout: (plan: 'pro' | 'premium') =>
    api.post<{ url: string }>('/subscriptions/checkout', { plan }),

  createPortal: () =>
    api.post<{ url: string }>('/subscriptions/portal'),
}
