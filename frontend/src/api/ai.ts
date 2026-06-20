import api from './client'
import type { AIInsight, Anomaly } from '@/types'

export const aiApi = {
  generateInsight: (month: string) =>
    api.post<{ insight: AIInsight }>('/ai/insights/generate', { month }),

  getInsight: (month: string) =>
    api.get<{ insight: AIInsight }>(`/ai/insights/${month}`),

  detectAnomalies: (month: string) =>
    api.post<{ anomalies: Anomaly[] }>('/ai/anomalies', { month }),

  search: (query: string) =>
    api.post<{ results: { summary: string; transactions: unknown[] } }>('/ai/search', { query }),
}
