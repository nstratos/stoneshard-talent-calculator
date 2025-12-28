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

FROM base AS test
CMD ["npm", "test"]
