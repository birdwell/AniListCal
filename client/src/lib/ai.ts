import { apiRequest } from "./queryClient";

export async function getRecommendations(shows: string[]) {
  const response = await apiRequest("POST", "/api/ai/recommend", { shows });
  return response.json();
}
