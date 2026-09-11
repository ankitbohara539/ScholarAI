import api from "@/api/axios";
import type { Scholarship } from "@/types/university";

export interface ScholarshipInput {
  name: string;
  amount: number;
  minimum_gpa: number | null;
  minimum_test_score: number | null;
  eligibility_description: string | null;
  is_active: boolean;
}

const path = (universityId: number) =>
  `/admin/universities/${universityId}/scholarships`;

export const scholarshipsApi = {
  async list(universityId: number): Promise<Scholarship[]> {
    return (await api.get<Scholarship[]>(path(universityId))).data;
  },
  async create(
    universityId: number,
    data: ScholarshipInput,
  ): Promise<Scholarship> {
    return (await api.post<Scholarship>(path(universityId), data)).data;
  },
  async update(
    universityId: number,
    scholarshipId: number,
    data: Partial<ScholarshipInput>,
  ): Promise<Scholarship> {
    return (
      await api.patch<Scholarship>(
        `${path(universityId)}/${scholarshipId}`,
        data,
      )
    ).data;
  },
  async remove(universityId: number, scholarshipId: number): Promise<void> {
    await api.delete(`${path(universityId)}/${scholarshipId}`);
  },
};
