import * as AlertDialogPrimitive from '@radix-ui/react-alert-dialog'
import type { ComponentProps, HTMLAttributes } from 'react'
import { cn } from '@/lib/utils'
import { buttonVariants } from '@/components/ui/button.styles'

export const AlertDialog = AlertDialogPrimitive.Root
export const AlertDialogTrigger = AlertDialogPrimitive.Trigger
export function AlertDialogContent({ className, ...props }: ComponentProps<typeof AlertDialogPrimitive.Content>) { return <AlertDialogPrimitive.Portal><AlertDialogPrimitive.Overlay className="fixed inset-0 z-50 bg-slate-950/45" /><AlertDialogPrimitive.Content className={cn('fixed left-1/2 top-1/2 z-50 w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-xl border bg-background p-6 shadow-xl', className)} {...props} /></AlertDialogPrimitive.Portal> }
export function AlertDialogHeader({ className, ...props }: HTMLAttributes<HTMLDivElement>) { return <div className={cn('space-y-2', className)} {...props} /> }
export function AlertDialogFooter({ className, ...props }: HTMLAttributes<HTMLDivElement>) { return <div className={cn('mt-6 flex justify-end gap-3', className)} {...props} /> }
export function AlertDialogTitle({ className, ...props }: ComponentProps<typeof AlertDialogPrimitive.Title>) { return <AlertDialogPrimitive.Title className={cn('text-lg font-semibold', className)} {...props} /> }
export function AlertDialogDescription({ className, ...props }: ComponentProps<typeof AlertDialogPrimitive.Description>) { return <AlertDialogPrimitive.Description className={cn('text-sm text-muted-foreground', className)} {...props} /> }
export function AlertDialogAction({ className, ...props }: ComponentProps<typeof AlertDialogPrimitive.Action>) { return <AlertDialogPrimitive.Action className={cn(buttonVariants({ variant: 'destructive' }), className)} {...props} /> }
export function AlertDialogCancel({ className, ...props }: ComponentProps<typeof AlertDialogPrimitive.Cancel>) { return <AlertDialogPrimitive.Cancel className={cn(buttonVariants({ variant: 'outline' }), className)} {...props} /> }
