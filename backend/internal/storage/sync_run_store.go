package storage

import (
	"context"
	"database/sql"
)

type SyncRunStore struct {
	db *sql.DB
}

func NewSyncRunStore(db *sql.DB) *SyncRunStore {
	return &SyncRunStore{db: db}
}

func (s *SyncRunStore) CreateSyncRun(ctx context.Context, source, mode string) (int64, error) {
	const query = `
		INSERT INTO sync_runs (source, mode, status)
		VALUES ($1, $2, 'running')
		RETURNING id
	`

	var id int64
	err := s.db.QueryRowContext(ctx, query, source, mode).Scan(&id)
	return id, err
}

func (s *SyncRunStore) MarkSyncRunSucceeded(
	ctx context.Context,
	id int64,
	pagesRequested int,
	pagesSucceeded int,
	recordsUpserted int,
) error {
	const query = `
		UPDATE sync_runs
		SET
			status = 'succeeded',
			finished_at = NOW(),
			pages_requested = $2,
			pages_succeeded = $3,
			records_upserted = $4
		WHERE id = $1
	`

	_, err := s.db.ExecContext(ctx, query, id, pagesRequested, pagesSucceeded, recordsUpserted)
	return err
}

func (s *SyncRunStore) MarkSyncRunFailed(
	ctx context.Context,
	id int64,
	pagesRequested int,
	pagesSucceeded int,
	recordsUpserted int,
	errorMessage string,
) error {
	const query = `
		UPDATE sync_runs
		SET
			status = 'failed',
			finished_at = NOW(),
			pages_requested = $2,
			pages_succeeded = $3,
			records_upserted = $4,
			error_message = $5
		WHERE id = $1
	`

	_, err := s.db.ExecContext(ctx, query, id, pagesRequested, pagesSucceeded, recordsUpserted, errorMessage)
	return err
}