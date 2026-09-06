import { LoaderCircle, Save } from 'lucide-react'
import { useState, type FormEvent } from 'react'

import { accountApi } from '@/api/account.api'
import { getApiError } from '@/api/axios'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { ProfileAvatarEditor } from '@/components/profile/ProfileAvatarEditor'
import { Alert } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/hooks/useAuth'
import { adminNavigation, studentNavigation } from '@/lib/navigation'

export function AccountSettingsPage() {
  const { user, refreshUser } = useAuth()
  const [fullName, setFullName] = useState(user?.full_name ?? '')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const nav = user?.role === 'admin' ? adminNavigation : studentNavigation
  async function run(action: () => Promise<unknown>, success: string) { setBusy(true); setError(''); setMessage(''); try { await action(); await refreshUser(); setMessage(success) } catch (requestError) { setError(getApiError(requestError)) } finally { setBusy(false) } }
  function save(event: FormEvent) { event.preventDefault(); void run(() => accountApi.update(fullName.trim()), 'Profile name updated.') }
  return <DashboardLayout title="Settings" navItems={nav}><div className="mx-auto max-w-3xl space-y-6"><div><h2 className="text-3xl font-semibold tracking-tight">Profile settings</h2><p className="mt-2 text-muted-foreground">Manage the identity shown in your ScholarAI account.</p></div>{error && <Alert>{error}</Alert>}{message && <Alert className="border-emerald-300 bg-emerald-50 text-emerald-800">{message}</Alert>}<Card><CardHeader><CardTitle>Profile picture</CardTitle><CardDescription>Your image is visible only within ScholarAI account interfaces.</CardDescription></CardHeader><CardContent><ProfileAvatarEditor fullName={user?.full_name ?? 'User'} currentUrl={user?.profile_picture_url ?? null} busy={busy} onUpload={(file) => run(() => accountApi.uploadAvatar(file), 'Profile picture updated.')} onRemove={() => run(() => accountApi.removeAvatar(), 'Profile picture removed.')} /></CardContent></Card><Card><CardHeader><CardTitle>Personal information</CardTitle><CardDescription>Your email and role cannot be changed here.</CardDescription></CardHeader><CardContent><form className="space-y-5" onSubmit={save}><div className="space-y-2"><Label htmlFor="settings-name">Full name</Label><Input id="settings-name" value={fullName} onChange={(event) => setFullName(event.target.value)} minLength={2} maxLength={120} required /></div><div className="space-y-2"><Label>Email</Label><Input value={user?.email ?? ''} disabled /></div><Button disabled={busy || fullName.trim().length < 2}>{busy ? <LoaderCircle className="animate-spin" /> : <Save />}Save changes</Button></form></CardContent></Card></div></DashboardLayout>
}
