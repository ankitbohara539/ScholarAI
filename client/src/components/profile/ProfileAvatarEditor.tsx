import { Camera, LoaderCircle, Trash2 } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { mediaUrl } from '@/lib/media'

export function ProfileAvatarEditor({ fullName, currentUrl, busy, onUpload, onRemove }: { fullName: string; currentUrl: string | null; busy: boolean; onUpload: (file: File) => Promise<void>; onRemove: () => Promise<void> }) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [preview, setPreview] = useState<string>()
  const initials = fullName.split(' ').slice(0, 2).map((part) => part[0]).join('').toUpperCase()
  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview) }, [preview])
  function choose(file?: File) { if (!file) return; if (preview) URL.revokeObjectURL(preview); setPreview(URL.createObjectURL(file)); void onUpload(file).then(() => setPreview(undefined)) }
  return <div className="flex flex-col items-center gap-4 sm:flex-row"><Avatar className="size-24"><AvatarImage src={preview ?? mediaUrl(currentUrl)} alt={fullName} /><AvatarFallback className="text-xl">{initials}</AvatarFallback></Avatar><div className="space-y-3 text-center sm:text-left"><div className="flex flex-wrap justify-center gap-2 sm:justify-start"><Button type="button" variant="outline" disabled={busy} onClick={() => inputRef.current?.click()}>{busy ? <LoaderCircle className="animate-spin" /> : <Camera />}Change photo</Button>{currentUrl && <Button type="button" variant="ghost" className="text-destructive" disabled={busy} onClick={() => void onRemove()}><Trash2 />Remove</Button>}</div><p className="text-xs text-muted-foreground">JPEG, PNG or WebP. Maximum 3 MB.</p><Input ref={inputRef} className="sr-only" type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => choose(event.target.files?.[0])} /></div></div>
}
