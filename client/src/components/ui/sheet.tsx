import * as DialogPrimitive from '@radix-ui/react-dialog'
import { X } from 'lucide-react'
import type { ComponentProps } from 'react'

import { cn } from '@/lib/utils'

export const Sheet = DialogPrimitive.Root
export const SheetTrigger = DialogPrimitive.Trigger
export const SheetClose = DialogPrimitive.Close

export function SheetContent({ className, children, ...props }: ComponentProps<typeof DialogPrimitive.Content>) {
  return <DialogPrimitive.Portal><DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-slate-950/40" /><DialogPrimitive.Content className={cn('fixed inset-y-0 left-0 z-50 flex w-[min(19rem,88vw)] flex-col border-r bg-background shadow-xl outline-none', className)} {...props}>{children}<DialogPrimitive.Close aria-label="Close navigation" className="absolute right-3 top-5 rounded-md p-2 hover:bg-muted"><X className="size-4" /></DialogPrimitive.Close></DialogPrimitive.Content></DialogPrimitive.Portal>
}

export const SheetTitle = DialogPrimitive.Title
export const SheetDescription = DialogPrimitive.Description
