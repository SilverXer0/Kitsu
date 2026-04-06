import { apiFetch } from "./client";
import type { Anime, AnimeSearchResponse, Recommendation } from "../types/anime";

export function searchAnime(
  query: string,
  page = 1,
  limit = 12,
): Promise<AnimeSearchResponse> {
  return apiFetch<AnimeSearchResponse>(
    `/anime/search?q=${encodeURIComponent(query)}&page=${page}&limit=${limit}`,
  );
}

export function getAnimeById(animeId: number): Promise<Anime> {
  return apiFetch<Anime>(`/anime/${animeId}`);
}

export function getRecommendationsByAnimeId(animeId: number): Promise<Recommendation[]> {
  return apiFetch<Recommendation[]>(`/anime/${animeId}/recommendations`);
}