package models

type PaginatedResponse[T any] struct {
	Items []T `json:"items"`
	Page int `json:"page"`
	Limit int `json:"limit"`
	TotalItems int `json:"total_items"`
	TotalPages int `json:"total_pages"`
}