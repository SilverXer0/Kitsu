package jikan

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"time"

	"github.com/SilverXer0/Kitsu/backend/internal/ratelimit"
)

type Client struct {
	baseURL string
	http *http.Client
	limiter *ratelimit.DualLimiter
}

func NewClient(baseURL string, limiter *ratelimit.DualLimiter) *Client {
	return &Client {
		baseURL: baseURL, 
		http: &http.Client {
			Timeout: 10 * time.Second,
		},
		limiter: limiter,
	}
}


func (c *Client) GetTopAnime(ctx context.Context, page int) (*AnimeListResponse, error) {
	return c.getAnimeList(ctx, fmt.Sprintf("/top/anime?page=%d", page))
}

func (c *Client) GetSeasonNow(ctx context.Context, page int) (*AnimeListResponse, error) {
	return c.getAnimeList(ctx, fmt.Sprintf("/seasons/now?page=%d", page))
}

func (c *Client) GetUpcomingAnime(ctx context.Context, page int) (*AnimeListResponse, error) {
	return c.getAnimeList(ctx, fmt.Sprintf("/seasons/upcoming?page=%d", page))
}

func (c *Client) getAnimeList(ctx context.Context, path string) (*AnimeListResponse, error) {
	if err := c.limiter.Wait(ctx); err != nil {
		return nil, err
	}

	req, err := http.NewRequestWithContext(ctx, http.MethodGet, c.baseURL+path, nil)
	if err != nil {
		return nil, err
	}

	resp, err := c.http.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("jikan returned status %d", resp.StatusCode)
	}

	var result AnimeListResponse
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return nil, err
	}

	return &result, nil
}