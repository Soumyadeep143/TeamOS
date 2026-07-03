# TeamOS Architecture

This document captures the high level architecture for TeamOS.

## System Overview

- Chrome Browser extension built with Plasmo
- FastAPI backend with REST and WebSocket interfaces
- AI engine microservice for Browser Use orchestration
- HydraDB, Redis, and PostgreSQL for knowledge, cache, and relational data
- Shared TypeScript packages for UI, types, utils, SDK, config, and prompts
