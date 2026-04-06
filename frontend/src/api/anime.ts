import { apiFetch } from "./client";
import type { Anime, Recommendation } from "../types/anime";

export function searchAnime(query: string): Promise<Anime[]> {
  return apiFetch<Anime[]>(`/anime/search?q=${encodeURIComponent(query)}`);
}

export function getAnimeById(animeId: number): Promise<Anime> {
  return apiFetch<Anime>(`/anime/${animeId}`);
}

export function getRecommendationsByAnimeId(animeId: number): Promise<Recommendation[]> {
  return apiFetch<Recommendation[]>(`/anime/${animeId}/recommendations`);
}