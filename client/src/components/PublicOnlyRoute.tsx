import { Navigate, Outlet } from 'react-router-dom'
import { Skeleton } from '@/components/ui/skeleton'
import { useAuth } from '@/hooks/useAuth'

export function PublicOnlyRoute() {
  const { user, isLoading } = useAuth()
  if (isLoading) return <div className="mx-auto mt-24 max-w-md"><Skeleton className="h-96 w-full" /></div>
  if (user) return <Navigate to={user.role === 'admin' ? '/admin/dashboard' : '/student/dashboard'} replace />
  return <Outlet />
}
