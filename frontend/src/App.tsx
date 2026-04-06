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

  const [gridKey, setGridKey] = useState(0);

  // Controls whether the overlay is visible
  const [showOverlay, setShowOverlay] = useState(false);

  async function runSearch(query: string, page: number) {
    try {
      setError(null);
      setIsSearching(true);

      const response = await searchAnime(query, page, SEARCH_LIMIT);

      setResults(response.items);
      setSearchPage(response.page);
      setTotalSearchPages(response.total_pages);
      setTotalSearchItems(response.total_items);
      setGridKey((k) => k + 1);
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
      setShowOverlay(true);

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

  function handleCloseOverlay() {
    setShowOverlay(false);
  }

  async function handlePreviousPage() {
    if (!searchQuery || searchPage <= 1) return;
    await runSearch(searchQuery, searchPage - 1);
  }

  async function handleNextPage() {
    if (!searchQuery || searchPage >= totalSearchPages) return;
    await runSearch(searchQuery, searchPage + 1);
  }

  // Lock body scroll when overlay is open
  useEffect(() => {
    if (showOverlay) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [showOverlay]);

  return (
    <div className="app-shell">
      <header className="hero">
        <div>
          <p className="eyebrow">Anime Recommendation Engine</p>
          <h1>Kitsu</h1>
          <p className="hero-copy">Search Anime and Discover Your Next Binge.</p>
        </div>
      </header>

      <SearchBar onSearch={handleSearch} isLoading={isSearching} />

      {error && <div className="error-banner">{error}</div>}

      {/* ── Search Results (full-width, single column) ── */}
      <Section title="Search Results">
        {results.length === 0 ? (
          <div className="empty-state">
            Search for an Anime to Begin Exploring the Catalog.
          </div>
        ) : (
          <>
            <div className="results-toolbar">
              <span>
                Page {searchPage} of {totalSearchPages || 1}
              </span>
              <span>{totalSearchItems} results</span>
            </div>

            <div className="card-grid" key={gridKey}>
              {results.map((anime, i) => (
                <AnimeCard
                  key={anime.mal_id}
                  anime={anime}
                  index={i}
                  onSelect={handleSelectAnime}
                />
              ))}
            </div>

            <div className="pagination-controls">
              <button
                onClick={handlePreviousPage}
                disabled={isSearching || searchPage <= 1}
              >
                ← Previous
              </button>
              <span>
                {searchPage} / {totalSearchPages || 1}
              </span>
              <button
                onClick={handleNextPage}
                disabled={isSearching || searchPage >= totalSearchPages}
              >
                Next →
              </button>
            </div>
          </>
        )}
      </Section>

      {/* ── Detail Overlay ── */}
      {showOverlay && (
        <div className="overlay-backdrop" onClick={handleCloseOverlay}>
          <div className="overlay-panel" onClick={(e) => e.stopPropagation()}>
            <button
              className="overlay-close"
              onClick={handleCloseOverlay}
              aria-label="Close details"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>

            <div className="overlay-scroll">
              <Section title="Anime Details">
                {isLoadingSelection && !selectedAnime ? (
                  <div className="empty-state">Loading anime details…</div>
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
      )}
    </div>
  );
}
