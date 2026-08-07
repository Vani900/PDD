# syntax=docker/dockerfile:1

# ── Base ──────────────────────────────────────────────────────────────────────
FROM python:3.11-slim AS base

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PYTHONFAULTHANDLER=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1 \
    POETRY_VERSION=1.8.3 \
    POETRY_HOME="/opt/poetry" \
    POETRY_VIRTUALENVS_CREATE=false

RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    curl \
    libpq-dev \
    libmagic1 \
    && rm -rf /var/lib/apt/lists/*

RUN curl -sSL https://install.python-poetry.org | python3 - \
    && ln -s /opt/poetry/bin/poetry /usr/local/bin/poetry

WORKDIR /app

# ── Dependencies ──────────────────────────────────────────────────────────────
FROM base AS dependencies

COPY backend/pyproject.toml backend/poetry.lock* ./
RUN poetry install --no-root --no-interaction --no-ansi

# ── Production Builder ────────────────────────────────────────────────────────
FROM dependencies AS production-builder

COPY backend/ .
RUN poetry install --no-dev --no-interaction --no-ansi

# ── Production ────────────────────────────────────────────────────────────────
FROM python:3.11-slim AS production

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

RUN apt-get update && apt-get install -y --no-install-recommends \
    libpq5 \
    libmagic1 \
    curl \
    && rm -rf /var/lib/apt/lists/*

RUN groupadd -r charityai && useradd -r -g charityai charityai

WORKDIR /app

COPY --from=production-builder /usr/local/lib/python3.11/site-packages /usr/local/lib/python3.11/site-packages
COPY --from=production-builder /usr/local/bin /usr/local/bin
COPY --chown=charityai:charityai backend/ .

USER charityai

EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1

CMD ["sh", "-c", "gunicorn app.main:app --worker-class uvicorn.workers.UvicornWorker --workers 2 --bind 0.0.0.0:${PORT:-8000} --timeout 120 --keepalive 5 --access-logfile - --error-logfile -"]

