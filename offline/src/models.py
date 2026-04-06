from typing import Optional
from pydantic import BaseModel, Field


class GenreEntry(BaseModel):
    mal_id: Optional[int] = None
    name: str
    type: Optional[str] = None
    url: Optional[str] = None


class StudioEntry(BaseModel):
    mal_id: Optional[int] = None
    name: str
    type: Optional[str] = None
    url: Optional[str] = None


class AnimeRecord(BaseModel):
    mal_id: int
    title: str
    score: Optional[float] = None
    popularity: Optional[int] = None
    year: Optional[int] = None
    genres_json: list[GenreEntry] = Field(default_factory=list)
    studios_json: list[StudioEntry] = Field(default_factory=list)


class AnimeFeatures(BaseModel):
    mal_id: int
    title: str
    score: Optional[float] = None
    popularity: Optional[int] = None
    year: Optional[int] = None
    genres: set[str] = Field(default_factory=set)
    studios: set[str] = Field(default_factory=set)


class RecommendationRecord(BaseModel):
    source_anime_id: int
    recommended_anime_id: int
    score: float
    rank: int
    reason: str
    model_version: str