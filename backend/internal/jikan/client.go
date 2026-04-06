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
	if err := c.limiter.Wait(ctx); err != nil {
		return nil, err
	} 
	url := fmt.Sprintf("%s/top/anime?page=%d", c.baseURL, page)
	req, _ := http.NewRequestWithContext(ctx, "GET", url, nil)
	resp, err := c.http.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	var res AnimeListResponse
	if err := json.NewDecoder(resp.Body).Decode(&res); err != nil {
		return nil, err
	}

	return &res, nil
}
