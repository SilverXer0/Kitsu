package ratelimit

import (
	"context"
	"time"

	"golang.org/x/time/rate"
)

type DualLimiter struct {
	perSecond *rate.Limiter
	perMinute *rate.Limiter
}

func NewDualLimiter() *DualLimiter {
	return &DualLimiter{
		perSecond: rate.NewLimiter(rate.Every(time.Second / 3), 1),
		perMinute: rate.NewLimiter(rate.Every(time.Minute / 60), 1),
	}
}

func (l *DualLimiter) Wait(ctx context.Context) error {
	if err := l.perSecond.Wait(ctx); err != nil {
		return err
	}
	if err := l.perMinute.Wait(ctx); err != nil {
		return err
	}
	return nil
}

