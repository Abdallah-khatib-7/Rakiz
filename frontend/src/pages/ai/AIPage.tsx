import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { Sparkles, Search, AlertTriangle, TrendingUp } from 'lucide-react'
import { toast } from 'sonner'
import { aiApi } from '@/api/ai'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { formatCurrency } from '@/lib/utils'
import type { AIInsight, Anomaly } from '@/types'

function getMonthOptions() {
  const options = []
  const now = new Date()
  for (let i = 0; i < 6; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    const label = d.toLocaleDateString('en-US', { year: 'numeric', month: 'long' })
    options.push({ value, label })
  }
  return options
}

const months = getMonthOptions()

export function AIPage() {
  const [selectedMonth, setSelectedMonth] = useState(months[0].value)
  const [insight, setInsight] = useState<AIInsight | null>(null)
  const [anomalies, setAnomalies] = useState<Anomaly[] | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<{ summary: string; transactions: unknown[] } | null>(null)

  const insightMutation = useMutation({
    mutationFn: () => aiApi.generateInsight(selectedMonth),
    onSuccess: (res) => {
      setInsight(res.data.insight)
      toast.success('Insight generated!')
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error
      if (msg?.includes('already exists')) {
        aiApi.getInsight(selectedMonth).then((r) => setInsight(r.data.insight))
      } else {
        toast.error(msg ?? 'Failed to generate insight')
      }
    },
  })

  const anomalyMutation = useMutation({
    mutationFn: () => aiApi.detectAnomalies(selectedMonth),
    onSuccess: (res) => {
      setAnomalies(res.data.anomalies)
      toast.success('Analysis complete')
    },
    onError: () => toast.error('Failed to detect anomalies'),
  })

  const searchMutation = useMutation({
    mutationFn: () => aiApi.search(searchQuery),
    onSuccess: (res) => {
      setSearchResults(res.data.results)
    },
    onError: () => toast.error('Search failed'),
  })

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Sparkles className="h-6 w-6 text-indigo-400" />
          AI Insights
        </h1>
        <p className="text-gray-500 text-sm mt-1">Smart analysis of your financial activity</p>
      </div>

      <Tabs defaultValue="insights">
        <TabsList>
          <TabsTrigger value="insights">
            <TrendingUp className="h-4 w-4 mr-1.5" />
            Monthly Insights
          </TabsTrigger>
          <TabsTrigger value="anomalies">
            <AlertTriangle className="h-4 w-4 mr-1.5" />
            Anomaly Detection
          </TabsTrigger>
          <TabsTrigger value="search">
            <Search className="h-4 w-4 mr-1.5" />
            Smart Search
          </TabsTrigger>
        </TabsList>

        {/* Insights */}
        <TabsContent value="insights">
          <Card>
            <CardHeader>
              <CardTitle>Monthly Spending Insight</CardTitle>
              <div className="flex items-center gap-2">
                <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                  <SelectTrigger className="w-44">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {months.map((m) => (
                      <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button onClick={() => insightMutation.mutate()} loading={insightMutation.isPending}>
                  <Sparkles className="h-4 w-4" />
                  Generate
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {insight ? (
                <div className="rounded-xl bg-gradient-to-br from-indigo-600/10 to-violet-600/5 border border-indigo-600/20 p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <Sparkles className="h-4 w-4 text-indigo-400" />
                    <span className="text-sm font-medium text-indigo-300">AI Analysis — {insight.month}</span>
                  </div>
                  <p className="text-gray-300 text-sm leading-relaxed whitespace-pre-wrap">{insight.summary}</p>
                </div>
              ) : (
                <div className="text-center py-12 rounded-xl border border-dashed border-[#2a2a35]">
                  <Sparkles className="h-10 w-10 text-gray-700 mx-auto mb-3" />
                  <p className="text-gray-500 text-sm">Select a month and click Generate</p>
                  <p className="text-gray-600 text-xs mt-1">AI will analyze your transactions and provide insights</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Anomalies */}
        <TabsContent value="anomalies">
          <Card>
            <CardHeader>
              <CardTitle>Anomaly Detection</CardTitle>
              <div className="flex items-center gap-2">
                <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                  <SelectTrigger className="w-44">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {months.map((m) => (
                      <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button onClick={() => anomalyMutation.mutate()} loading={anomalyMutation.isPending}>
                  <AlertTriangle className="h-4 w-4" />
                  Analyze
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {anomalies !== null ? (
                anomalies.length > 0 ? (
                  <div className="space-y-3">
                    {anomalies.map((a, i) => (
                      <div key={i} className="rounded-xl border border-amber-600/20 bg-amber-600/5 p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-2">
                            <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
                            <p className="text-sm text-gray-300">{a.reason}</p>
                          </div>
                          <Badge variant="warning">
                            {formatCurrency(parseFloat(a.amount), a.currency)}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-10">
                    <div className="h-12 w-12 rounded-full bg-green-600/15 flex items-center justify-center mx-auto mb-3">
                      <span className="text-green-400 text-xl">✓</span>
                    </div>
                    <p className="text-gray-400 text-sm font-medium">No anomalies detected</p>
                    <p className="text-gray-600 text-xs mt-1">Your spending looks normal for this month</p>
                  </div>
                )
              ) : (
                <div className="text-center py-12 rounded-xl border border-dashed border-[#2a2a35]">
                  <AlertTriangle className="h-10 w-10 text-gray-700 mx-auto mb-3" />
                  <p className="text-gray-500 text-sm">Run anomaly detection to spot unusual activity</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Search */}
        <TabsContent value="search">
          <Card>
            <CardHeader>
              <CardTitle>Natural Language Search</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  placeholder='e.g. "all USD payments last month" or "transactions over $100"'
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && searchQuery.trim() && searchMutation.mutate()}
                  icon={<Search className="h-4 w-4" />}
                />
                <Button
                  onClick={() => searchMutation.mutate()}
                  loading={searchMutation.isPending}
                  disabled={!searchQuery.trim()}
                >
                  Search
                </Button>
              </div>

              {searchResults ? (
                <div className="space-y-3">
                  <div className="rounded-xl bg-indigo-600/10 border border-indigo-600/20 p-4">
                    <p className="text-sm text-gray-300">{searchResults.summary}</p>
                  </div>
                </div>
              ) : (
                <div className="text-center py-10 rounded-xl border border-dashed border-[#2a2a35]">
                  <Search className="h-10 w-10 text-gray-700 mx-auto mb-3" />
                  <p className="text-gray-500 text-sm">Ask anything about your transactions</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
