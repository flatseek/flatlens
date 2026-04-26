.PHONY: help install start dev test clean

help:
	@echo "Flatlens Dashboard"
	@echo ""
	@echo "Usage:"
	@echo "  make install      - Install dependencies (npm install)"
	@echo "  make start        - Start dashboard server on port 8080"
	@echo "  make dev          - Start with dev mode (cors enabled)"
	@echo "  make test         - Test dashboard API connectivity"
	@echo "  make clean        - Remove node_modules"

install:
	@echo "Installing dependencies..."
	npm install

start:
	@echo "Starting Flatlens Dashboard on http://localhost:8080"
	npx http-server . -p 8080 -c-1

dev:
	@echo "Starting Flatlens Dashboard (dev mode) on http://localhost:8080"
	npx http-server . -p 8080 -c-1 --cors

test:
	@echo "Testing API connectivity..."
	@curl -s http://localhost:8000/_cluster/health | python -m json.tool || echo "API not reachable at http://localhost:8000"
	@echo ""
	@echo "Dashboard should be available at http://localhost:8080"

clean:
	@echo "Cleaning..."
	rm -rf node_modules package-lock.json
	@echo "Done."