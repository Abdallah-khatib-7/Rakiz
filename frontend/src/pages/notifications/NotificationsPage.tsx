import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Bell, CheckCheck } from 'lucide-react'
import { toast } from 'sonner'
import { notificationsApi } from '@/api/notifications'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { formatRelativeTime } from '@/lib/utils'

export function NotificationsPage() {
  const qc = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => notificationsApi.getAll({ limit: 50 }).then((r) => r.data),
  })

  const markReadMutation = useMutation({
    mutationFn: (id: number) => notificationsApi.markRead(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  })

  const markAllMutation = useMutation({
    mutationFn: () => notificationsApi.markAllRead(),
    onSuccess: () => {
      toast.success('All notifications marked as read')
      qc.invalidateQueries({ queryKey: ['notifications'] })
    },
  })

  const unreadCount = data?.data.filter((n) => !n.is_read).length ?? 0

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Notifications</h1>
          <p className="text-gray-500 text-sm mt-1">
            {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up'}
          </p>
        </div>
        {unreadCount > 0 && (
          <Button variant="outline" size="sm" onClick={() => markAllMutation.mutate()} loading={markAllMutation.isPending}>
            <CheckCheck className="h-4 w-4" />
            Mark all read
          </Button>
        )}
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="space-y-0 p-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-16 rounded-lg bg-[#1f1f28] animate-pulse mb-2" />
              ))}
            </div>
          ) : data?.data.length ? (
            <div className="divide-y divide-[#2a2a35]">
              {data.data.map((n) => (
                <div
                  key={n.id}
                  className={`flex items-start gap-4 p-4 transition-colors cursor-pointer hover:bg-[#1f1f28] ${!n.is_read ? 'bg-indigo-600/5' : ''}`}
                  onClick={() => !n.is_read && markReadMutation.mutate(n.id)}
                >
                  <div className={`h-9 w-9 rounded-xl flex items-center justify-center shrink-0 ${!n.is_read ? 'bg-indigo-600/20' : 'bg-[#1f1f28]'}`}>
                    <Bell className={`h-4 w-4 ${!n.is_read ? 'text-indigo-400' : 'text-gray-600'}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-gray-100">{n.title}</p>
                      {!n.is_read && <Badge variant="default" className="h-1.5 w-1.5 rounded-full p-0 bg-indigo-500" />}
                    </div>
                    <p className="text-sm text-gray-500 mt-0.5">{n.message}</p>
                    <p className="text-xs text-gray-600 mt-1">{formatRelativeTime(n.created_at)}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <Bell className="h-10 w-10 text-gray-700 mx-auto mb-3" />
              <p className="text-gray-500 text-sm">No notifications yet.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
