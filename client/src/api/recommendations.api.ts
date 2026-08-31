import api from '@/api/axios'
import type { RecommendationList } from '@/types/recommendation'

export const recommendationsApi = {
  async latest(): Promise<RecommendationList> { return (await api.get<RecommendationList>('/student/recommendations')).data },
  async generate(topK = 10): Promise<RecommendationList> { return (await api.post<RecommendationList>('/student/recommendations/generate', undefined, { params: { top_k: topK } })).data },
}
