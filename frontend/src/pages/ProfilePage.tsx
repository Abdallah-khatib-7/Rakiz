import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Camera, Smartphone, Monitor, LogOut, X, Mail, Phone, Pencil, Check, Lock, CreditCard } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import {
  apiGetSessions,
  apiRevokeSession,
  apiRevokeAllSessions,
  apiUploadAvatar,
  apiUpdateProfile,
  apiChangePassword,
  apiGetUsage,
  apiCreatePortalSession,
} from '@/lib/api'

type Session = {
  id: number
  ip: string | null
  userAgent: string
  createdAt: string
  expiresAt: string
}

function deviceInfo(userAgent: string) {
  const isMobile = /iPhone|Android|Mobile/i.test(userAgent)
  let label = 'Unknown device'
  if (/iPhone/i.test(userAgent)) label = 'iPhone'
  else if (/Android/i.test(userAgent)) label = 'Android device'
  else if (/Windows/i.test(userAgent)) label = 'Windows PC'
  else if (/Macintosh/i.test(userAgent)) label = 'Mac'
  else if (/PostmanRuntime/i.test(userAgent)) label = 'API client'

  let browser = ''
  if (/Chrome/i.test(userAgent) && !/Edg/i.test(userAgent)) browser = 'Chrome'
  else if (/Safari/i.test(userAgent) && !/Chrome/i.test(userAgent)) browser = 'Safari'
  else if (/Firefox/i.test(userAgent)) browser = 'Firefox'
  else if (/Edg/i.test(userAgent)) browser = 'Edge'

  return { isMobile, label: browser ? `${label} · ${browser}` : label }
}

export default function ProfilePage() {
  const user = useAuthStore((s) => s.user)
  const accessToken = useAuthStore((s) => s.accessToken)
  const setAuth = useAuthStore((s) => s.setAuth)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [sessions, setSessions] = useState<Session[]>([])
  const [loadingSessions, setLoadingSessions] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState('')
  const [revokingAll, setRevokingAll] = useState(false)

  const [editingField, setEditingField] = useState<'name' | 'phone' | null>(null)
  const [nameValue, setNameValue] = useState(user?.full_name || '')
  const [phoneValue, setPhoneValue] = useState(user?.phone || '')
  const [savingField, setSavingField] = useState(false)
  const [fieldError, setFieldError] = useState('')

  const [showPasswordForm, setShowPasswordForm] = useState(false)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [passwordSaving, setPasswordSaving] = useState(false)
  const [passwordError, setPasswordError] = useState('')
  const [passwordSuccess, setPasswordSuccess] = useState('')

  const [tier, setTier] = useState<string | null>(null)
  const [openingPortal, setOpeningPortal] = useState(false)

  useEffect(() => {
    apiGetSessions(accessToken)
      .then((res) => setSessions(res.sessions))
      .finally(() => setLoadingSessions(false))
  }, [accessToken])

  useEffect(() => {
    apiGetUsage(accessToken).then((res) => setTier(res.tier))
  }, [accessToken])

  const handleAvatarClick = () => fileInputRef.current?.click()

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadError('')
    setUploading(true)
    try {
      const { avatar_url } = await apiUploadAvatar(accessToken, file)
      if (user && accessToken) setAuth(accessToken, { ...user, avatar_url })
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  const saveField = async (field: 'name' | 'phone') => {
    if (!user || !accessToken) return
    setFieldError('')
    setSavingField(true)
    try {
      const params = field === 'name' ? { full_name: nameValue } : { phone: phoneValue }
      const res = await apiUpdateProfile(accessToken, params)
      setAuth(accessToken, { ...user, ...res.user } as never)
      setEditingField(null)
    } catch (err) {
      setFieldError(err instanceof Error ? err.message : 'Update failed')
    } finally {
      setSavingField(false)
    }
  }

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setPasswordError('')
    setPasswordSuccess('')
    setPasswordSaving(true)
    try {
      const res = await apiChangePassword(accessToken, currentPassword, newPassword)
      setPasswordSuccess(res.message)
      setCurrentPassword('')
      setNewPassword('')
    } catch (err) {
      setPasswordError(err instanceof Error ? err.message : 'Could not change password')
    } finally {
      setPasswordSaving(false)
    }
  }

  const handleRevoke = async (id: number) => {
    setSessions((prev) => prev.filter((s) => s.id !== id))
    try {
      await apiRevokeSession(accessToken, id)
    } catch {
      // optimistic, swallow
    }
  }

  const handleRevokeAll = async () => {
    setRevokingAll(true)
    try {
      await apiRevokeAllSessions(accessToken)
      setSessions([])
    } finally {
      setRevokingAll(false)
    }
  }

  const handleManageSubscription = async () => {
    setOpeningPortal(true)
    try {
      const { url } = await apiCreatePortalSession(accessToken)
      window.location.href = url
    } catch {
      setOpeningPortal(false)
    }
  }

  return (
    <div className="px-8 sm:px-12 lg:px-16 py-14 max-w-3xl">
      <p className="font-mono text-xs tracking-[0.25em] uppercase text-[var(--color-bullion)] mb-10">
        Profile
      </p>

      <div className="flex items-center gap-6 mb-12 pb-10 border-b border-[var(--color-line)]">
        <motion.button
          onClick={handleAvatarClick}
          whileHover={{ scale: 1.03 }}
          className="relative group size-24 rounded-full overflow-hidden bg-[var(--color-surface)] border-2 border-[var(--color-line)] flex-shrink-0"
        >
          {user?.avatar_url ? (
            <img src={user.avatar_url} alt="" className="w-full h-full object-cover" />
          ) : (
            <div
              className="w-full h-full flex items-center justify-center font-bold text-[var(--color-bone)]"
              style={{ fontFamily: 'var(--font-display)', fontSize: '32px' }}
            >
              {user?.full_name?.[0]?.toUpperCase() || '?'}
            </div>
          )}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-colors flex items-center justify-center">
            <Camera className="size-5 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
          {uploading && (
            <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
              <span className="font-mono text-[10px] text-white">...</span>
            </div>
          )}
        </motion.button>
        <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />

        <div className="flex-1">
          {editingField === 'name' ? (
            <div className="flex items-center gap-2 mb-1">
              <input
                autoFocus
                value={nameValue}
                onChange={(e) => setNameValue(e.target.value)}
                className="text-2xl font-bold text-[var(--color-bone)] bg-transparent border-b border-[var(--color-emerald-bright)] outline-none"
                style={{ fontFamily: 'var(--font-display)' }}
              />
              <button onClick={() => saveField('name')} disabled={savingField} className="text-[var(--color-emerald-bright)]">
                <Check className="size-5" />
              </button>
              <button onClick={() => setEditingField(null)} className="text-[var(--color-bone-dim)]">
                <X className="size-5" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => {
                setNameValue(user?.full_name || '')
                setEditingField('name')
              }}
              className="group flex items-center gap-2 mb-1"
            >
              <h1
                className="text-2xl font-bold text-[var(--color-bone)]"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                {user?.full_name}
              </h1>
              <Pencil className="size-3.5 text-[var(--color-bone-dim)] opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>
          )}

          <div className="flex items-center gap-1.5 text-sm text-[var(--color-bone-dim)] mb-1">
            <Mail className="size-3.5" />
            {user?.email}
          </div>

          {editingField === 'phone' ? (
            <div className="flex items-center gap-2">
              <input
                autoFocus
                value={phoneValue}
                onChange={(e) => setPhoneValue(e.target.value)}
                placeholder="+1234567890"
                className="text-sm text-[var(--color-bone)] bg-transparent border-b border-[var(--color-emerald-bright)] outline-none"
              />
              <button onClick={() => saveField('phone')} disabled={savingField} className="text-[var(--color-emerald-bright)]">
                <Check className="size-4" />
              </button>
              <button onClick={() => setEditingField(null)} className="text-[var(--color-bone-dim)]">
                <X className="size-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => {
                setPhoneValue(user?.phone || '')
                setEditingField('phone')
              }}
              className="group flex items-center gap-1.5 text-sm text-[var(--color-bone-dim)]"
            >
              <Phone className="size-3.5" />
              {user?.phone || 'Add phone number'}
              <Pencil className="size-3 opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>
          )}

          {fieldError && <p className="text-xs text-red-400 mt-2">{fieldError}</p>}
        </div>
      </div>

      {uploadError && (
        <div className="p-3 mb-8 text-sm text-red-400 bg-red-950/20 border border-red-900/30 rounded-lg max-w-md">
          {uploadError}
        </div>
      )}

      <div className="mb-12 pb-10 border-b border-[var(--color-line)]">
        <div className="flex items-baseline justify-between mb-4">
          <h2 className="text-xl font-bold text-[var(--color-bone)]" style={{ fontFamily: 'var(--font-display)' }}>
            Password
          </h2>
          <button
            onClick={() => setShowPasswordForm((v) => !v)}
            className="text-sm text-[var(--color-emerald-bright)] hover:underline flex items-center gap-1.5"
          >
            <Lock className="size-3.5" />
            {showPasswordForm ? 'Cancel' : 'Change password'}
          </button>
        </div>

        <AnimatePresence>
          {showPasswordForm && (
            <motion.form
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              style={{ overflow: 'hidden' }}
              onSubmit={handleChangePassword}
              className="space-y-4 pt-2"
            >
              <input
                type="password"
                placeholder="Current password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
                className="w-full max-w-sm bg-transparent border-b border-[var(--color-line)] pb-2 text-sm text-[var(--color-bone)] outline-none focus:border-[var(--color-emerald-bright)]"
              />
              <input
                type="password"
                placeholder="New password (min 8 characters)"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={8}
                className="w-full max-w-sm bg-transparent border-b border-[var(--color-line)] pb-2 text-sm text-[var(--color-bone)] outline-none focus:border-[var(--color-emerald-bright)]"
              />
              {passwordError && <p className="text-xs text-red-400">{passwordError}</p>}
              {passwordSuccess && <p className="text-xs text-[var(--color-emerald-bright)]">{passwordSuccess}</p>}
              <button
                type="submit"
                disabled={passwordSaving}
                className="px-5 py-2 rounded-full bg-[var(--color-emerald-bright)] text-[var(--color-void)] text-sm font-semibold disabled:opacity-50"
              >
                {passwordSaving ? 'Saving...' : 'Update password'}
              </button>
            </motion.form>
          )}
        </AnimatePresence>
      </div>

      <div className="mb-12 pb-10 border-b border-[var(--color-line)]">
        <div className="flex items-baseline justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold text-[var(--color-bone)]" style={{ fontFamily: 'var(--font-display)' }}>
              Plan
            </h2>
            <p className="text-sm text-[var(--color-bone-dim)] mt-1 capitalize">
              {tier || 'free'}
            </p>
          </div>

          {tier === 'free' ? (
            <Link
              to="/billing"
              className="text-sm text-[var(--color-emerald-bright)] hover:underline flex items-center gap-1.5"
            >
              <CreditCard className="size-3.5" />
              Upgrade plan
            </Link>
          ) : (
            <button
              onClick={handleManageSubscription}
              disabled={openingPortal}
              className="text-sm text-[var(--color-emerald-bright)] hover:underline flex items-center gap-1.5 disabled:opacity-50"
            >
              <CreditCard className="size-3.5" />
              {openingPortal ? 'Opening...' : 'Update or cancel plan'}
            </button>
          )}
        </div>
      </div>

      <div className="flex items-baseline justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-[var(--color-bone)]" style={{ fontFamily: 'var(--font-display)' }}>
            Active sessions
          </h2>
          <p className="text-sm text-[var(--color-bone-dim)] mt-1">
            {sessions.length} device{sessions.length !== 1 ? 's' : ''} signed in
          </p>
        </div>
        {sessions.length > 0 && (
          <button
            onClick={handleRevokeAll}
            disabled={revokingAll}
            className="flex items-center gap-1.5 text-xs font-medium text-red-400 hover:underline disabled:opacity-50"
          >
            <LogOut className="size-3.5" />
            {revokingAll ? 'Signing out...' : 'Sign out everywhere'}
          </button>
        )}
      </div>

      {loadingSessions ? (
        <span className="font-mono text-sm text-[var(--color-bone-dim)]">Loading...</span>
      ) : sessions.length === 0 ? (
        <p className="text-[var(--color-bone-dim)] text-sm py-8">No active sessions.</p>
      ) : (
        <div>
          <AnimatePresence initial={false}>
            {sessions.map((s, i) => {
              const { isMobile, label } = deviceInfo(s.userAgent)
              const Icon = isMobile ? Smartphone : Monitor
              return (
                <motion.div
                  key={s.id}
                  initial={{ opacity: 1 }}
                  exit={{ opacity: 0, height: 0 }}
                  className={`flex items-center justify-between py-4 ${i > 0 ? 'border-t border-[var(--color-line)]' : ''}`}
                >
                  <div className="flex items-center gap-3">
                    <div className="size-9 rounded-full bg-[var(--color-surface)] flex items-center justify-center text-[var(--color-bone-dim)]">
                      <Icon className="size-4" />
                    </div>
                    <div>
                      <div className="text-sm font-medium text-[var(--color-bone)]">{label}</div>
                      <div className="text-xs text-[var(--color-bone-dim)] font-mono">
                        {s.ip || 'unknown IP'} · {new Date(s.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => handleRevoke(s.id)}
                    className="text-[var(--color-bone-dim)] hover:text-red-400 transition-colors"
                    aria-label="Revoke session"
                  >
                    <X className="size-4" />
                  </button>
                </motion.div>
              )
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  )
}