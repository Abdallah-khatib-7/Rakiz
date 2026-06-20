import { useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Mail, Lock, User } from 'lucide-react'
import { toast } from 'sonner'
import { authApi } from '@/api/auth'
import { useAuthStore } from '@/store/authStore'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

const schema = z.object({
  full_name: z.string().min(2, 'At least 2 characters').max(255),
  email: z.string().email('Invalid email'),
  password: z.string().min(8, 'Minimum 8 characters').max(128),
})
type FormData = z.infer<typeof schema>

export function RegisterPage() {
  const { isAuthenticated } = useAuthStore()
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  if (isAuthenticated) return <Navigate to="/dashboard" replace />

  async function onSubmit(data: FormData) {
    setLoading(true)
    try {
      await authApi.register(data)
      setDone(true)
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error ?? 'Registration failed'
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  if (done) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0f0f13] px-4">
        <div className="w-full max-w-md text-center rounded-2xl border border-[#2a2a35] bg-[#18181f] p-10">
          <div className="mx-auto mb-4 h-14 w-14 rounded-full bg-green-600/15 flex items-center justify-center">
            <Mail className="h-7 w-7 text-green-400" />
          </div>
          <h2 className="text-xl font-semibold text-white mb-2">Check your email</h2>
          <p className="text-gray-500 text-sm">
            We sent a verification link to your email. Click it to activate your account.
          </p>
          <Link to="/login" className="mt-6 inline-block text-sm text-indigo-400 hover:text-indigo-300">
            Back to login
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0f0f13] px-4">
      <div className="w-full max-w-md">
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/25">
            <span className="text-white font-bold text-lg">R</span>
          </div>
          <span className="text-2xl font-bold text-white tracking-tight">Rakiz</span>
        </div>

        <div className="rounded-2xl border border-[#2a2a35] bg-[#18181f] p-8">
          <h1 className="text-xl font-semibold text-white mb-1">Create an account</h1>
          <p className="text-sm text-gray-500 mb-6">Start sending money instantly</p>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input
              label="Full Name"
              type="text"
              placeholder="Abdallah Khatib"
              icon={<User className="h-4 w-4" />}
              error={errors.full_name?.message}
              {...register('full_name')}
            />
            <Input
              label="Email"
              type="email"
              placeholder="you@example.com"
              icon={<Mail className="h-4 w-4" />}
              error={errors.email?.message}
              {...register('email')}
            />
            <Input
              label="Password"
              type="password"
              placeholder="Min. 8 characters"
              icon={<Lock className="h-4 w-4" />}
              error={errors.password?.message}
              {...register('password')}
            />

            <Button type="submit" className="w-full" loading={loading}>
              Create account
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-500">
            Already have an account?{' '}
            <Link to="/login" className="text-indigo-400 hover:text-indigo-300 font-medium">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
