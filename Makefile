.PHONY: setup docker-up docker-down docker-down-v dev-backend dev-frontend migrate generate-api lint test mobile-copy

setup:
	mkdir -p certs
	cd certs && mkcert -install
	cd certs && mkcert "yupiboard.localhost" "*.yupiboard.localhost"
	pnpm install
	cd backend && uv sync

docker-up:
	@docker compose -f compose.yml -f compose.dev.yml up -d

docker-down:
	@docker compose -f compose.yml -f compose.dev.yml down

docker-down-v:
	@docker compose -f compose.yml -f compose.dev.yml down -v

migrate:
	@cd backend && uv run alembic upgrade head

generate-api:
	@cd backend && uv run python -m app.scripts.export_openapi
	@cd frontend && pnpm generate:api

dev-backend:
	@cd backend && uv run fastapi dev app/main.py --host 0.0.0.0 --port 8080

dev-frontend:
	@pnpm --filter frontend dev

lint:
	@pnpm --filter frontend lint
	@cd backend && uv run ruff check . && uv run ty check app

test:
	@cd backend && uv run pytest

mobile-copy:
	@pnpm run mobile:copy
