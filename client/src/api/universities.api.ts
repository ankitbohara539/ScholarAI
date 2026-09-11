import api from '@/api/axios'
import type { Page, University, UniversityInput } from '@/types/university'

export interface UniversityFilters { page?: number; page_size?: number; search?: string; country?: string; region?: string; university_type?: string; is_active?: boolean; max_tuition?: number }

export const universitiesApi = {
  async list(filters: UniversityFilters = {}, signal?: AbortSignal): Promise<Page<University>> { return (await api.get<Page<University>>('/universities', { params: filters, signal })).data },
  async get(id: number, signal?: AbortSignal): Promise<University> { return (await api.get<University>(`/universities/${id}`, { signal })).data },
  async adminList(filters: UniversityFilters = {}, signal?: AbortSignal): Promise<Page<University>> { return (await api.get<Page<University>>('/admin/universities', { params: filters, signal })).data },
  async adminGet(id: number): Promise<University> { return (await api.get<University>(`/admin/universities/${id}`)).data },
  async create(data: UniversityInput): Promise<University> { return (await api.post<University>('/admin/universities', data)).data },
  async update(id: number, data: Partial<UniversityInput>): Promise<University> { return (await api.patch<University>(`/admin/universities/${id}`, data)).data },
  async remove(id: number): Promise<void> { await api.delete(`/admin/universities/${id}`) },
}

export const publicUniversitiesApi = {
  async list(filters: UniversityFilters = {}, signal?: AbortSignal): Promise<Page<University>> { return (await api.get<Page<University>>('/public/universities', { params: filters, signal })).data },
}
