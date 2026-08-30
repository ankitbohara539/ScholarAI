import { GraduationCap } from 'lucide-react'
import type { ReactNode } from 'react'

export function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <main className="grid min-h-screen bg-background lg:grid-cols-[1fr_1.05fr]">
      <section className="hidden bg-primary p-12 text-primary-foreground lg:flex lg:flex-col lg:justify-between">
        <div className="flex items-center gap-3 text-xl font-semibold"><span className="rounded-xl bg-white/15 p-2"><GraduationCap /></span>ScholarAI</div>
        <div className="max-w-lg space-y-5"><p className="text-sm font-semibold uppercase tracking-[0.22em] text-white/70">University Recommendation System</p><h1 className="text-5xl font-semibold leading-tight">Make your next academic step with clarity.</h1><p className="text-lg leading-8 text-white/75">A focused space for students to build their profile and discover suitable universities.</p></div>
        <p className="text-sm text-white/60">Secure access for students and administrators</p>
      </section>
      <section className="flex items-center justify-center bg-[#f8faff] px-5 py-12"><div className="w-full max-w-md"><div className="mb-8 flex items-center justify-center gap-2 text-xl font-semibold text-primary lg:hidden"><GraduationCap /> ScholarAI</div>{children}</div></section>
    </main>
  )
}
