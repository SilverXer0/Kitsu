export type Anime = {
  mal_id: number;
  title: string;
  title_english?: string | null;
  synopsis?: string | null;
  score?: number | null;
  popularity?: number | null;
  episodes?: number | null;
  year?: number | null;
  image_url?: string | null;
};

export type Recommendation = {
  source_anime_id: number;
  recommended_anime_id: number;
  score: number;
  rank: number;
  reason: string;
  model_version: string;
  anime: Anime;
};