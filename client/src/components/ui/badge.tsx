import type { HTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

export function Badge({ className, variant, ...props }: HTMLAttributes<HTMLSpanElement> & { variant?: 'default' | 'outline' }) { return <span className={cn('inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize', variant === 'outline' ? 'border bg-transparent text-foreground' : 'bg-secondary text-secondary-foreground', className)} {...props} /> }
