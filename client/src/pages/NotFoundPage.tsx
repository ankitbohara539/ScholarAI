import { Button } from '@/components/ui/button'
import { Link } from 'react-router-dom'

export function NotFoundPage() {
  return <main className="flex min-h-screen items-center justify-center bg-[#f8faff] p-6"><div className="text-center"><p className="text-sm font-semibold uppercase tracking-widest text-primary">404</p><h1 className="mt-3 text-4xl font-semibold">Page not found</h1><p className="mt-3 text-muted-foreground">The page you requested does not exist.</p><Button asChild className="mt-7"><Link to="/">Return home</Link></Button></div></main>
}
