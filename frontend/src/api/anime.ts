import { apiFetch } from "./client";
import type { Anime, AnimeSearchResponse, Recommendation } from "../types/anime";

export interface SearchAnimeParams {
  query: string;
  page?: number;
  limit?: number;
  year?: string;
  minScore?: string;
  sortBy?: string;
  sortOrder?: string;
}

export function searchAnime({
  query,
  page = 1,
  limit = 12,
  year,
  minScore,
  sortBy,
  sortOrder,
}: SearchAnimeParams): Promise<AnimeSearchResponse> {
  const params = new URLSearchParams({
    q: query,
    page: page.toString(),
    limit: limit.toString(),
  });

  if (year) params.append("year", year);
  if (minScore) params.append("min_score", minScore);
  if (sortBy) params.append("sort_by", sortBy);
  if (sortOrder) params.append("sort_order", sortOrder);

  return apiFetch<AnimeSearchResponse>(`/anime/search?${params.toString()}`);
}

export function getAnimeById(animeId: number): Promise<Anime> {
  return apiFetch<Anime>(`/anime/${animeId}`);
}

export function getRecommendationsByAnimeId(animeId: number): Promise<Recommendation[]> {
  return apiFetch<Recommendation[]>(`/anime/${animeId}/recommendations`);
}

export function getPersonalizedRecommendations(animeIds: number[]): Promise<Recommendation[]> {
  const ids = animeIds.join(",");
  return apiFetch<Recommendation[]>(`/recommendations/personalized?ids=${ids}`);
}