import { LoaderCircle, UserPlus } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { getApiError } from '@/api/axios'
import { PasswordInput } from '@/components/auth/PasswordInput'
import { SocialLoginButtons } from '@/components/auth/SocialLoginButtons'
import { AuthLayout } from '@/components/layout/AuthLayout'
import { Alert } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/hooks/useAuth'

export function RegisterPage() {
  const { register } = useAuth(); const navigate = useNavigate()
  const [form, setForm] = useState({ fullName: '', email: '', password: '', confirmPassword: '' }); const [error, setError] = useState(''); const [submitting, setSubmitting] = useState(false)
  function update(field: keyof typeof form, value: string) { setForm((current) => ({ ...current, [field]: value })) }
  async function submit(event: FormEvent) { event.preventDefault(); setError(''); if (form.fullName.trim().length < 2) return setError('Enter your full name.'); if (form.password.length < 8) return setError('Password must contain at least 8 characters.'); if (form.password !== form.confirmPassword) return setError('Passwords do not match.'); setSubmitting(true); try { await register({ full_name: form.fullName.trim(), email: form.email.trim(), password: form.password }); navigate('/student/dashboard', { replace: true }) } catch (requestError) { setError(getApiError(requestError, 'Unable to create your account.')) } finally { setSubmitting(false) } }
  return <AuthLayout><Card className="border-0 shadow-xl shadow-slate-200/70"><CardHeader><CardTitle className="text-2xl">Create your account</CardTitle><CardDescription>Build your profile and receive explainable university matches.</CardDescription></CardHeader><CardContent><form className="space-y-4" onSubmit={submit}>{error && <Alert>{error}</Alert>}<div className="space-y-2"><Label htmlFor="fullName">Full name</Label><Input id="fullName" autoComplete="name" value={form.fullName} onChange={(event) => update('fullName', event.target.value)} required /></div><div className="space-y-2"><Label htmlFor="register-email">Email address</Label><Input id="register-email" type="email" autoComplete="email" value={form.email} onChange={(event) => update('email', event.target.value)} required /></div><div className="grid gap-4 sm:grid-cols-2"><div className="space-y-2"><Label htmlFor="new-password">Password</Label><PasswordInput id="new-password" autoComplete="new-password" value={form.password} onChange={(event) => update('password', event.target.value)} required /></div><div className="space-y-2"><Label htmlFor="confirm-password">Confirm password</Label><PasswordInput id="confirm-password" autoComplete="new-password" value={form.confirmPassword} onChange={(event) => update('confirmPassword', event.target.value)} required /></div></div><Button className="w-full" size="lg" disabled={submitting}>{submitting ? <><LoaderCircle className="animate-spin" />Creating account...</> : <><UserPlus />Create account</>}</Button><SocialLoginButtons /><p className="text-center text-sm text-muted-foreground">Already registered? <Link className="font-semibold text-primary hover:underline" to="/login">Sign in</Link></p></form></CardContent></Card></AuthLayout>
}
