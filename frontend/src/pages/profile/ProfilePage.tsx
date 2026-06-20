import { useRef } from 'react'
import { useMutation } from '@tanstack/react-query'
import { Camera, User, Mail, Shield, Crown } from 'lucide-react'
import { toast } from 'sonner'
import { usersApi } from '@/api/users'
import { useAuthStore } from '@/store/authStore'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

const tierVariant = (tier: string) => {
  if (tier === 'premium') return 'default'
  if (tier === 'pro') return 'secondary'
  return 'secondary'
}

export function ProfilePage() {
  const { user, setUser } = useAuthStore()
  const fileRef = useRef<HTMLInputElement>(null)

  const avatarMutation = useMutation({
    mutationFn: (file: File) => usersApi.updateAvatar(file),
    onSuccess: (res) => {
      setUser(res.data.user)
      toast.success('Avatar updated!')
    },
    onError: () => toast.error('Failed to upload avatar'),
  })

  const initials = user?.full_name
    ?.split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) ?? '??'

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) avatarMutation.mutate(file)
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Profile & Settings</h1>
        <p className="text-gray-500 text-sm mt-1">Manage your account details</p>
      </div>

      {/* Avatar card */}
      <Card>
        <CardHeader>
          <CardTitle>Profile Picture</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-6">
            <div className="relative">
              <Avatar className="h-20 w-20">
                <AvatarImage src={user?.avatar_url} />
                <AvatarFallback className="text-2xl">{initials}</AvatarFallback>
              </Avatar>
              <button
                className="absolute -bottom-1 -right-1 h-7 w-7 rounded-full bg-indigo-600 hover:bg-indigo-700 flex items-center justify-center transition-colors"
                onClick={() => fileRef.current?.click()}
                disabled={avatarMutation.isPending}
              >
                <Camera className="h-3.5 w-3.5 text-white" />
              </button>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileChange}
              />
            </div>
            <div>
              <p className="font-semibold text-white text-lg">{user?.full_name}</p>
              <p className="text-gray-500 text-sm">{user?.email}</p>
              <Button
                variant="outline"
                size="sm"
                className="mt-2"
                onClick={() => fileRef.current?.click()}
                loading={avatarMutation.isPending}
              >
                <Camera className="h-4 w-4" />
                Change Photo
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Account info */}
      <Card>
        <CardHeader>
          <CardTitle>Account Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <InfoRow icon={<User className="h-4 w-4" />} label="Full Name" value={user?.full_name ?? '—'} />
          <InfoRow icon={<Mail className="h-4 w-4" />} label="Email" value={user?.email ?? '—'} />
          <InfoRow
            icon={<Shield className="h-4 w-4" />}
            label="Email Verified"
            value={user?.is_verified ? 'Verified' : 'Not Verified'}
            badge={<Badge variant={user?.is_verified ? 'success' : 'warning'}>{user?.is_verified ? 'Verified' : 'Pending'}</Badge>}
          />
          <InfoRow
            icon={<Crown className="h-4 w-4" />}
            label="Subscription"
            value=""
            badge={
              <Badge variant={tierVariant(user?.subscription_tier ?? 'free')}>
                {user?.subscription_tier?.toUpperCase() ?? 'FREE'}
              </Badge>
            }
          />
        </CardContent>
      </Card>
    </div>
  )
}

function InfoRow({
  icon,
  label,
  value,
  badge,
}: {
  icon: React.ReactNode
  label: string
  value: string
  badge?: React.ReactNode
}) {
  return (
    <div className="flex items-center justify-between rounded-xl bg-[#1f1f28] border border-[#2a2a35] p-4">
      <div className="flex items-center gap-3">
        <div className="text-gray-500">{icon}</div>
        <div>
          <p className="text-xs text-gray-500">{label}</p>
          {value && <p className="text-sm font-medium text-gray-200">{value}</p>}
        </div>
      </div>
      {badge}
    </div>
  )
}
