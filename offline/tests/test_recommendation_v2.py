import math
import pytest

from offline.src.models import AnimeFeatures
from offline.src.scorer import (
    cosine_tfidf_similarity,
    weighted_genre_similarity,
    franchise_penalty,
    hidden_gem_bonus,
    popularity_bonus,
    score_bonus,
    year_bonus,
    compute_similarity,
)
from offline.src.feature_builder import (
    tokenize_synopsis,
    compute_tf,
    compute_idf,
    compute_tfidf,
    build_franchise_key,
    GENRE_WEIGHTS,
)
from offline.src.ranker import _mmr_rerank


class TestCosineTfidfSimilarity:
    def test_identical_vectors(self):
        v = {"alchemy": 0.5, "adventure": 0.3, "battle": 0.2}
        assert cosine_tfidf_similarity(v, v) == pytest.approx(1.0, abs=1e-6)

    def test_orthogonal_vectors(self):
        a = {"alchemy": 1.0}
        b = {"robots": 1.0}
        assert cosine_tfidf_similarity(a, b) == 0.0

    def test_partial_overlap(self):
        a = {"alchemy": 0.5, "adventure": 0.3}
        b = {"alchemy": 0.4, "robots": 0.6}
        sim = cosine_tfidf_similarity(a, b)
        assert 0.0 < sim < 1.0

    def test_empty_vectors(self):
        assert cosine_tfidf_similarity({}, {"a": 1.0}) == 0.0
        assert cosine_tfidf_similarity({"a": 1.0}, {}) == 0.0
        assert cosine_tfidf_similarity({}, {}) == 0.0


class TestWeightedGenreSimilarity:
    def test_identical_genres(self):
        genres = {"action", "comedy"}
        assert weighted_genre_similarity(genres, genres) == pytest.approx(1.0, abs=1e-6)

    def test_no_overlap(self):
        assert weighted_genre_similarity({"action"}, {"horror"}) == 0.0

    def test_rare_genre_overlap_scores_higher(self):
        rare_sim = weighted_genre_similarity(
            {"psychological", "action"}, {"psychological", "comedy"}
        )
        common_sim = weighted_genre_similarity(
            {"action", "comedy"}, {"action", "drama"}
        )
        assert rare_sim > common_sim

    def test_empty_genres(self):
        assert weighted_genre_similarity(set(), set()) == 0.0
        assert weighted_genre_similarity({"action"}, set()) == 0.0


def _make_features(**kwargs) -> AnimeFeatures:
    defaults = {
        "mal_id": 1,
        "title": "Test",
        "normalized_title": "test",
        "franchise_key": "",
        "score": 7.0,
        "popularity": 100,
        "year": 2020,
        "genres": set(),
        "studios": set(),
        "synopsis_tfidf": {},
    }
    defaults.update(kwargs)
    return AnimeFeatures(**defaults)


class TestFranchisePenalty:
    def test_same_franchise_key_max_penalty(self):
        a = _make_features(franchise_key="naruto|pierrot")
        b = _make_features(mal_id=2, franchise_key="naruto|pierrot")
        assert franchise_penalty(a, b) == 0.30

    def test_different_franchise_key_no_penalty(self):
        a = _make_features(franchise_key="naruto|pierrot", normalized_title="naruto")
        b = _make_features(mal_id=2, franchise_key="bleach|pierrot", normalized_title="bleach")
        assert franchise_penalty(a, b) == 0.0

    def test_same_normalized_title(self):
        a = _make_features(normalized_title="naruto")
        b = _make_features(mal_id=2, normalized_title="naruto")
        assert franchise_penalty(a, b) == 0.25

    def test_high_title_overlap(self):
        a = _make_features(normalized_title="sword art online alicization")
        b = _make_features(mal_id=2, normalized_title="sword art online")
        pen = franchise_penalty(a, b)
        assert pen >= 0.10


class TestHiddenGemBonus:
    def test_high_score_low_popularity(self):
        assert hidden_gem_bonus(8.5, 1500) == 1.0

    def test_popular_anime_no_bonus(self):
        assert hidden_gem_bonus(8.5, 50) == 0.0

    def test_low_score_no_bonus(self):
        assert hidden_gem_bonus(5.0, 2000) == 0.0

    def test_none_values(self):
        assert hidden_gem_bonus(None, 1000) == 0.0
        assert hidden_gem_bonus(8.0, None) == 0.0


class TestPopularityBonus:
    def test_most_popular_high_bonus(self):
        bonus = popularity_bonus(1, 10000)
        assert bonus > 0.9

    def test_least_popular_low_bonus(self):
        bonus = popularity_bonus(10000, 10000)
        assert bonus < 0.1

    def test_none_popularity(self):
        assert popularity_bonus(None, 10000) == 0.0


class TestTfidf:
    def test_tokenize_stops_removal(self):
        tokens = tokenize_synopsis("The hero is a great warrior who fights")
        assert "the" not in tokens
        assert "hero" in tokens
        assert "warrior" in tokens

    def test_tokenize_short_words_removed(self):
        tokens = tokenize_synopsis("go to me")
        assert len(tokens) == 0

    def test_compute_tf_normalized(self):
        tokens = ["hero", "hero", "battle", "sword"]
        tf = compute_tf(tokens)
        assert tf["hero"] == pytest.approx(0.5)
        assert tf["battle"] == pytest.approx(0.25)

    def test_compute_idf_rare_term_higher(self):
        corpus = [
            ["hero", "battle"],
            ["hero", "school"],
            ["hero", "magic"],
        ]
        idf = compute_idf(corpus)
        assert idf["battle"] > idf["hero"]

    def test_compute_tfidf_combines(self):
        tf = {"hero": 0.5, "battle": 0.25}
        idf = {"hero": 1.0, "battle": 2.0}
        tfidf = compute_tfidf(tf, idf)
        assert tfidf["hero"] == pytest.approx(0.5)
        assert tfidf["battle"] == pytest.approx(0.5)


class TestFranchiseKey:
    def test_basic_key(self):
        key = build_franchise_key("naruto shippuden", {"pierrot"})
        assert key == "naruto shippuden|pierrot"

    def test_truncates_to_three_tokens(self):
        key = build_franchise_key("one two three four five", {"studio"})
        assert key == "one two three|studio"

    def test_no_studios(self):
        key = build_franchise_key("naruto", set())
        assert key == "naruto|"

    def test_empty_title(self):
        key = build_franchise_key("", set())
        assert key == ""

class TestMMRReranking:
    def _make_candidate(self, mal_id, score, genres, franchise_key=""):
        feat = _make_features(
            mal_id=mal_id,
            genres=genres,
            franchise_key=franchise_key,
        )
        return (feat, score, "test reason")

    def test_basic_diversity(self):
        candidates = [
            self._make_candidate(1, 0.9, {"action", "adventure"}),
            self._make_candidate(2, 0.85, {"action", "fantasy"}),
            self._make_candidate(3, 0.8, {"romance", "drama"}),
            self._make_candidate(4, 0.75, {"sci-fi", "thriller"}),
            self._make_candidate(5, 0.7, {"action", "comedy"}),
        ]

        result = _mmr_rerank(candidates, top_n=3, mmr_lambda=0.7, max_per_franchise=2)
        selected_ids = {r[0].mal_id for r in result}

        assert len(result) == 3
        genres_present = set()
        for feat, _, _ in result:
            genres_present.update(feat.genres)
        assert len(genres_present) >= 3

    def test_franchise_cap(self):
        candidates = [
            self._make_candidate(1, 0.95, {"action"}, franchise_key="naruto|pierrot"),
            self._make_candidate(2, 0.90, {"action"}, franchise_key="naruto|pierrot"),
            self._make_candidate(3, 0.85, {"action"}, franchise_key="naruto|pierrot"),
            self._make_candidate(4, 0.60, {"drama"}, franchise_key="other|studio"),
        ]

        result = _mmr_rerank(candidates, top_n=3, mmr_lambda=0.9, max_per_franchise=2)

        naruto_count = sum(1 for r in result if r[0].franchise_key == "naruto|pierrot")
        assert naruto_count <= 2

    def test_returns_all_when_pool_smaller_than_top_n(self):
        candidates = [
            self._make_candidate(1, 0.9, {"action"}),
            self._make_candidate(2, 0.8, {"drama"}),
        ]

        result = _mmr_rerank(candidates, top_n=5, mmr_lambda=0.7, max_per_franchise=2)
        assert len(result) == 2

    def test_empty_candidates(self):
        result = _mmr_rerank([], top_n=5, mmr_lambda=0.7, max_per_franchise=2)
        assert result == []
