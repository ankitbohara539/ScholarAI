import { API_BASE_URL } from '@/api/axios'

export function mediaUrl(path: string | null | undefined): string | undefined {
  if (!path) return undefined
  if (/^https?:\/\//.test(path)) return path
  return `${new URL(API_BASE_URL).origin}${path}`
}
