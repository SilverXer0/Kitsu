package metrics

import (
	"sync"
	"time"
)

type Metrics struct {
	mu sync.Mutex

	TotalRequests int64

	AnimeDetailRequests int64
	RecommendationRequests int64

	CacheHits  int64
	CacheMisses int64

	TotalLatency time.Duration
}

func NewMetrics() *Metrics {
	return &Metrics{}
}

func (m *Metrics) RecordRequest(duration time.Duration) {
	m.mu.Lock()
	defer m.mu.Unlock()

	m.TotalRequests++
	m.TotalLatency += duration
}

func (m *Metrics) RecordAnimeDetailRequest() {
	m.mu.Lock()
	defer m.mu.Unlock()
	m.AnimeDetailRequests++
}

func (m *Metrics) RecordRecommendationRequest() {
	m.mu.Lock()
	defer m.mu.Unlock()
	m.RecommendationRequests++
}

func (m *Metrics) RecordCacheHit() {
	m.mu.Lock()
	defer m.mu.Unlock()
	m.CacheHits++
}

func (m *Metrics) RecordCacheMiss() {
	m.mu.Lock()
	defer m.mu.Unlock()
	m.CacheMisses++
}

func (m *Metrics) Snapshot() map[string]interface{} {
	m.mu.Lock()
	defer m.mu.Unlock()

	avgLatency := float64(0)
	if m.TotalRequests > 0 {
		avgLatency = float64(m.TotalLatency.Milliseconds()) / float64(m.TotalRequests)
	}

	return map[string]interface{}{
		"total_requests": m.TotalRequests,
		"anime_detail_requests": m.AnimeDetailRequests,
		"recommendation_requests": m.RecommendationRequests,
		"cache_hits": m.CacheHits,
		"cache_misses": m.CacheMisses,
		"avg_latency_ms": avgLatency,
	}
}