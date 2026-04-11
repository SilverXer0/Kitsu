import { useEffect, useState } from "react";
import "./index.css";

import {
  getAnimeById,
  getRecommendationsByAnimeId,
  searchAnime,
} from "./api/anime";
import AnimeCard from "./components/AnimeCard";
import AnimeDetail from "./components/AnimeDetail";
import PersonalizeModal from "./components/PersonalizeModal";
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

  const [showOverlay, setShowOverlay] = useState(false);
  const [showPersonalizeModal, setShowPersonalizeModal] = useState(false);

  const [filterYear, setFilterYear] = useState<string>("");
  const [filterMinScore, setFilterMinScore] = useState<string>("");
  const [sortBy, setSortBy] = useState<"score" | "popularity" | "episodes" | "year" | "">("");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  async function runSearch(query: string, page: number) {
    try {
      setError(null);
      setIsSearching(true);

      const response = await searchAnime({
        query,
        page,
        limit: SEARCH_LIMIT,
        year: filterYear,
        minScore: filterMinScore,
        sortBy: sortBy,
        sortOrder: sortOrder,
      });

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
    if (searchPage <= 1) return;
    await runSearch(searchQuery, searchPage - 1);
  }

  async function handleNextPage() {
    if (searchPage >= totalSearchPages) return;
    await runSearch(searchQuery, searchPage + 1);
  }

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

  useEffect(() => {
    const t = setTimeout(() => {
      runSearch(searchQuery, 1);
    }, 400);

    return () => clearTimeout(t);
  }, [filterYear, filterMinScore, sortBy, sortOrder]);

  return (
    <div className="app-shell">
      <header className="hero">
        <div>
          <p className="eyebrow">Anime Recommendation Engine</p>
          <h1>Kitsu</h1>
          <p className="hero-copy">Search Anime and Discover Your Next Binge.</p>
          <button className="for-you-btn" onClick={() => setShowPersonalizeModal(true)}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
            </svg>
            For You
          </button>
        </div>
      </header>

      <SearchBar onSearch={handleSearch} isLoading={isSearching} />

      <div className="controls-bar">
        <div className="control-group">
          <label htmlFor="filter-year">Year</label>
          <input
            id="filter-year"
            type="number"
            placeholder="2023"
            value={filterYear}
            onChange={(e) => setFilterYear(e.target.value)}
          />
        </div>

        <div className="control-group">
          <label htmlFor="filter-score">Min Score</label>
          <input
            id="filter-score"
            type="number"
            step="0.1"
            placeholder="0.0"
            value={filterMinScore}
            onChange={(e) => setFilterMinScore(e.target.value)}
          />
        </div>

        <div className="control-group">
          <label htmlFor="sort-by">Sort By</label>
          <select
            id="sort-by"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
          >
            <option value="">None</option>
            <option value="score">Score</option>
            <option value="popularity">Popularity</option>
            <option value="episodes">Episodes</option>
            <option value="year">Year</option>
          </select>
          <button
            type="button"
            className="sort-order-btn"
            onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
            aria-label={`Sort in ${sortOrder === "asc" ? "descending" : "ascending"} order`}
            title={`Toggle sort order (currently ${sortOrder})`}
          >
            {sortOrder === "asc" ? (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="19" x2="12" y2="5" />
                <polyline points="5 12 12 5 19 12" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19" />
                <polyline points="19 12 12 19 5 12" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {error && <div className="error-banner">{error}</div>}

      <Section title="Search Results">
        {results.length === 0 ? (
          <div className="empty-state">
            {isSearching ? "Loading top anime..." : "No animes found. Try adjusting your search or filters."}
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
      {showPersonalizeModal && (
        <PersonalizeModal
          onClose={() => setShowPersonalizeModal(false)}
          onSelectAnime={(anime) => {
            setShowPersonalizeModal(false);
            handleSelectAnime(anime);
          }}
        />
      )}
    </div>
  );
}
