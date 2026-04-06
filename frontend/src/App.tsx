import { useEffect, useState } from "react";
import "./index.css";

import {
  getAnimeById,
  getRecommendationsByAnimeId,
  searchAnime,
} from "./api/anime";
import AnimeCard from "./components/AnimeCard";
import AnimeDetail from "./components/AnimeDetail";
import RecommendationList from "./components/RecommendationList";
import SearchBar from "./components/SearchBar";
import Section from "./components/Section";
import type { Anime, Recommendation } from "./types/anime";

const SEARCH_LIMIT = 12;

export default function App() {
  const [results, setResults] = useState<Anime[]>([]);
  const [selectedAnime, setSelectedAnime] = useState<Anime | null>(null);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isLoadingSelection, setIsLoadingSelection] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [searchPage, setSearchPage] = useState(1);
  const [totalSearchPages, setTotalSearchPages] = useState(0);
  const [totalSearchItems, setTotalSearchItems] = useState(0);

  async function runSearch(query: string, page: number) {
    try {
      setError(null);
      setIsSearching(true);

      const response = await searchAnime(query, page, SEARCH_LIMIT);

      setResults(response.items);
      setSearchPage(response.page);
      setTotalSearchPages(response.total_pages);
      setTotalSearchItems(response.total_items);
    } catch (err) {
      console.error(err);
      setError("Failed to search anime.");
    } finally {
      setIsSearching(false);
    }
  }

  async function handleSearch(query: string) {
    setSearchQuery(query);
    setSearchPage(1);
    await runSearch(query, 1);
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

  async function handlePreviousPage() {
    if (!searchQuery || searchPage <= 1) return;
    await runSearch(searchQuery, searchPage - 1);
  }

  async function handleNextPage() {
    if (!searchQuery || searchPage >= totalSearchPages) return;
    await runSearch(searchQuery, searchPage + 1);
  }

  useEffect(() => {
    // placeholder if for future route/query syncing
  }, []);

  return (
    <div className="app-shell">
      <header className="hero">
        <div>
          <p className="eyebrow">Anime Recommendation System</p>
          <h1>Kitsu</h1>
          <p className="hero-copy">Search Anime and Find Your Next Binge.</p>
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
              <>
                <div className="results-toolbar">
                  <span>
                    Showing page {searchPage} of {totalSearchPages || 1}
                  </span>
                  <span>{totalSearchItems} total results</span>
                </div>

                <div className="card-grid">
                  {results.map((anime) => (
                    <AnimeCard
                      key={anime.mal_id}
                      anime={anime}
                      onSelect={handleSelectAnime}
                    />
                  ))}
                </div>

                <div className="pagination-controls">
                  <button
                    onClick={handlePreviousPage}
                    disabled={isSearching || searchPage <= 1}
                  >
                    Previous
                  </button>
                  <span>
                    Page {searchPage} / {totalSearchPages || 1}
                  </span>
                  <button
                    onClick={handleNextPage}
                    disabled={isSearching || searchPage >= totalSearchPages}
                  >
                    Next
                  </button>
                </div>
              </>
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
