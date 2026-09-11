import { recommendationsApi } from '@/api/recommendations.api'
import { universitiesApi } from '@/api/universities.api'
import type { RecommendationList } from '@/types/recommendation'
import type { University } from '@/types/university'

type UniversityFetcher = (id: number, signal?: AbortSignal) => Promise<University>
type RecommendationFetcher = () => Promise<RecommendationList>

export async function loadComparisonData(
  universityIds: number[],
  signal?: AbortSignal,
  fetchUniversity: UniversityFetcher = universitiesApi.get,
  fetchRecommendations: RecommendationFetcher = recommendationsApi.latest,
) {
  const [universities, latest] = await Promise.all([
    Promise.all(universityIds.map((id) => fetchUniversity(id, signal))),
    fetchRecommendations(),
  ])
  return { universities, recommendations: latest.recommendations }
}
