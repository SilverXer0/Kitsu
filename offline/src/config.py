import os
from pydantic import BaseModel, Field
from dotenv import load_dotenv

load_dotenv()


class Settings(BaseModel):
    postgres_dsn: str = Field(
        default="postgres://postgres:postgres@localhost:5432/kitsu?sslmode=disable"
    )
    top_n_recommendations: int = Field(default=10)
    model_version: str = Field(default="v2")
    min_similarity_score: float = Field(default=0.15)
    mmr_lambda: float = Field(default=0.7)
    max_per_franchise: int = Field(default=2)

    @classmethod
    def from_env(cls) -> "Settings":
        return cls(
            postgres_dsn=os.getenv(
                "POSTGRES_DSN",
                "postgres://postgres:postgres@localhost:5432/kitsu?sslmode=disable",
            ),
            top_n_recommendations=int(os.getenv("TOP_N_RECOMMENDATIONS", "10")),
            model_version=os.getenv("MODEL_VERSION", "v2"),
            min_similarity_score=float(os.getenv("MIN_SIMILARITY_SCORE", "0.15")),
            mmr_lambda=float(os.getenv("MMR_LAMBDA", "0.7")),
            max_per_franchise=int(os.getenv("MAX_PER_FRANCHISE", "2")),
        )