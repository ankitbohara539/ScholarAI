import { useState } from 'react'
import { Alert } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'

export function SocialLoginButtons() {
  const [message, setMessage] = useState('')
  return <div className="space-y-3"><div className="flex items-center gap-3"><Separator className="flex-1" /><span className="text-xs uppercase text-muted-foreground">or continue with</span><Separator className="flex-1" /></div><div className="grid gap-2 sm:grid-cols-2"><Button type="button" variant="outline" onClick={() => setMessage('Google sign-in is coming soon.')}><span className="font-bold text-[#4285F4]">G</span>Google</Button><Button type="button" variant="outline" onClick={() => setMessage('LinkedIn sign-in is coming soon.')}><span className="rounded-sm bg-[#0A66C2] px-1 text-xs font-bold text-white">in</span>LinkedIn</Button></div>{message && <Alert className="py-2 text-sm">{message}</Alert>}</div>
}
