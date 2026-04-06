import { useState } from "react";

type SearchBarProps = {
  onSearch: (query: string) => void;
  isLoading?: boolean;
};

export default function SearchBar({ onSearch, isLoading = false }: SearchBarProps) {
  const [query, setQuery] = useState("");

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = query.trim();
    if (!trimmed) return;
    onSearch(trimmed);
  }

  return (
    <form className="search-bar" onSubmit={handleSubmit}>
      <div className="search-input-wrapper">
        <svg
          className="search-icon"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <input
          id="search-input"
          type="text"
          value={query}
          placeholder="Search for an anime..."
          onChange={(event) => setQuery(event.target.value)}
        />
      </div>
      <button id="search-button" type="submit" disabled={isLoading}>
        {isLoading ? "Searching…" : "Search"}
      </button>
    </form>
  );
}