# Usage
# -----
# 
# Run ESLint (read-only):
#   docker build -t stc-lint --target lint .
#   docker run --rm stc-lint
#
# Check formatting (read-only):
#   docker build -t stc-format-check --target format-check .
#   docker run --rm stc-format-check
#
# Auto-format (write changes):
#   docker build -t stc-format --target format .
#
#   Windows (PowerShell):
#     docker run --rm -v "${PWD}:/app" -w /app stc-format
#
#   Linux / macOS:
#     docker run --rm -v "$PWD:/app" -w /app stc-format
#
# Run tests:
#   docker build -t stc-test --target test .
#   docker run --rm stc-test

FROM node:20-alpine AS base
WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci

COPY . .

FROM base AS lint
CMD ["npm", "run", "lint"]

FROM base AS format-check
CMD ["npm", "run", "format:check"]

FROM base AS format
CMD ["npm", "run", "format"]

FROM base AS test
CMD ["npm", "test"]
