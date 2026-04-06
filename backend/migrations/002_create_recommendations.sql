CREATE TABLE IF NOT EXISTS recommendations (
    source_anime_id BIGINT NOT NULL,
    recommended_anime_id BIGINT NOT NULL,
    score DOUBLE PRECISION NOT NULL,
    rank INTEGER NOT NULL,
    reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (source_anime_id, recommended_anime_id),
    CONSTRAINT fk_source_anime
        FOREIGN KEY (source_anime_id) REFERENCES anime(mal_id) ON DELETE CASCADE,
    CONSTRAINT fk_recommended_anime
        FOREIGN KEY (recommended_anime_id) REFERENCES anime(mal_id) ON DELETE CASCADE,
    CONSTRAINT chk_no_self_recommendation
        CHECK (source_anime_id <> recommended_anime_id)
);

CREATE INDEX IF NOT EXISTS idx_recommendations_source_rank
    ON recommendations(source_anime_id, rank);

CREATE INDEX IF NOT EXISTS idx_recommendations_source_score
    ON recommendations(source_anime_id, score DESC);