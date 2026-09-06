import { LoaderCircle, LogIn } from 'lucide-react'
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

export function LoginPage() {
  const { login } = useAuth(); const navigate = useNavigate()
  const [email, setEmail] = useState(''); const [password, setPassword] = useState(''); const [error, setError] = useState(''); const [submitting, setSubmitting] = useState(false)
  async function submit(event: FormEvent) { event.preventDefault(); setError(''); if (!email.trim() || !password) return setError('Enter both your email and password.'); setSubmitting(true); try { const user = await login({ email: email.trim(), password }); navigate(user.role === 'admin' ? '/admin/dashboard' : '/student/dashboard', { replace: true }) } catch (requestError) { setError(getApiError(requestError, 'Unable to sign in. Check your details and try again.')) } finally { setSubmitting(false) } }
  return <AuthLayout><Card className="border-0 shadow-xl shadow-slate-200/70"><CardHeader className="space-y-2"><CardTitle className="text-2xl">Welcome back</CardTitle><CardDescription>Sign in to continue to your ScholarAI dashboard.</CardDescription></CardHeader><CardContent><form className="space-y-5" onSubmit={submit}>{error && <Alert>{error}</Alert>}<div className="space-y-2"><Label htmlFor="email">Email address</Label><Input id="email" type="email" autoComplete="email" placeholder="you@example.com" value={email} onChange={(event) => setEmail(event.target.value)} required /></div><div className="space-y-2"><Label htmlFor="password">Password</Label><PasswordInput id="password" autoComplete="current-password" placeholder="Enter your password" value={password} onChange={(event) => setPassword(event.target.value)} required /></div><Button className="w-full" size="lg" disabled={submitting}>{submitting ? <><LoaderCircle className="animate-spin" />Signing in...</> : <><LogIn />Sign in</>}</Button><SocialLoginButtons /><p className="text-center text-sm text-muted-foreground">New to ScholarAI? <Link className="font-semibold text-primary hover:underline" to="/register">Create a student account</Link></p></form></CardContent></Card></AuthLayout>
}
