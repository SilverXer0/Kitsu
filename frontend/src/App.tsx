import { useState } from "react";
import "./index.css";

import { getAnimeById, getRecommendationsByAnimeId, searchAnime } from "./api/anime";
import AnimeCard from "./components/AnimeCard";
import AnimeDetail from "./components/AnimeDetail";
import RecommendationList from "./components/RecommendationList";
import SearchBar from "./components/SearchBar";
import Section from "./components/Section";
import type { Anime, Recommendation } from "./types/anime";

export default function App() {
  const [results, setResults] = useState<Anime[]>([]);
  const [selectedAnime, setSelectedAnime] = useState<Anime | null>(null);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isLoadingSelection, setIsLoadingSelection] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSearch(query: string) {
    try {
      setError(null);
      setIsSearching(true);
      const data = await searchAnime(query);
      setResults(data);
    } catch (err) {
      console.error(err);
      setError("Failed to search anime.");
    } finally {
      setIsSearching(false);
    }
  }

  async function handleSelectAnime(anime: Anime) {
    try {
      setError(null);
      setIsLoadingSelection(true);

      const [animeDetail, recommendationData] = await Promise.all([
        getAnimeById(anime.mal_id),
        getRecommendationsByAnimeId(anime.mal_id),
      ]);

      setSelectedAnime(animeDetail);
      setRecommendations(recommendationData);
    } catch (err) {
      console.error(err);
      setError("Failed to load anime details or recommendations.");
    } finally {
      setIsLoadingSelection(false);
    }
  }

  return (
    <div className="app-shell">
      <header className="hero">
        <div>
          <p className="eyebrow">Anime Recommendation Engine</p>
          <h1>Kitsu</h1>
          <p className="hero-copy">
            Search Anime and Explore Recommendations
          </p>
        </div>
      </header>

      <SearchBar onSearch={handleSearch} isLoading={isSearching} />

      {error && <div className="error-banner">{error}</div>}

      <div className="layout">
        <div className="left-column">
          <Section title="Search Results">
            {results.length === 0 ? (
              <div className="empty-state">
                Search for an anime to begin exploring the catalog.
              </div>
            ) : (
              <div className="card-grid">
                {results.map((anime) => (
                  <AnimeCard key={anime.mal_id} anime={anime} onSelect={handleSelectAnime} />
                ))}
              </div>
            )}
          </Section>
        </div>

        <div className="right-column">
          <Section title="Anime Details">
            {isLoadingSelection && !selectedAnime ? (
              <div className="empty-state">Loading anime details...</div>
            ) : (
              <AnimeDetail anime={selectedAnime} />
            )}
          </Section>

          <Section title="Recommendations">
            <RecommendationList
              recommendations={recommendations}
              onSelectAnime={handleSelectAnime}
              isLoading={isLoadingSelection}
            />
          </Section>
        </div>
      </div>
    </div>
  );
}