import type { InputHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

export function Slider({ className, ...props }: Omit<InputHTMLAttributes<HTMLInputElement>, 'type'>) {
  return <input type="range" className={cn('h-2 w-full cursor-pointer appearance-none rounded-full bg-muted accent-[var(--primary)] disabled:cursor-not-allowed disabled:opacity-50', className)} {...props} />
}
