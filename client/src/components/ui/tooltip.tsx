import type { ReactNode } from 'react'

export function Tooltip({ label, children, disabled }: { label: string; children: ReactNode; disabled?: boolean }) {
  if (disabled) return children
  return <span className="group/tooltip relative block"><span className="block">{children}</span><span role="tooltip" className="pointer-events-none absolute left-full top-1/2 z-50 ml-3 hidden -translate-y-1/2 whitespace-nowrap rounded-md bg-slate-900 px-2 py-1 text-xs text-white shadow-lg group-hover/tooltip:block group-focus-within/tooltip:block">{label}</span></span>
}
