FROM golang:1.26.1-alpine AS builder

WORKDIR /app

COPY go.mod go.sum ./
RUN go mod download

COPY backend ./backend

RUN CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build -o /kitsu-api ./backend/cmd/api

FROM alpine:3.20

WORKDIR /app

COPY --from=builder /kitsu-api /usr/local/bin/kitsu-api

EXPOSE 8080

CMD ["kitsu-api"]