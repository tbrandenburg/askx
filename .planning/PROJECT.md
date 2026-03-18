# Generic Web Chatbot

## What This Is

A lightweight, unopinionated web chatbot frontend that connects to configurable AI models through the Vercel AI SDK. Built for developers who need a clean, stateless chat interface without the complexity of authentication, chat history, or user management - while supporting extensible capabilities through MCP (Model Context Protocol) servers and skills.

## Core Value

Provide a simple, configurable chatbot interface that developers can deploy immediately and extend with any AI model, MCP server, or skill without needing to manage users, databases, or persistent state.

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] Remove authentication system (Auth.js, user management, sessions)
- [ ] Remove chat history and persistence (database, Redis, message storage)
- [ ] Remove user-dependent features (sidebar, chat CRUD, voting system)
- [ ] Implement config-file based model configuration using OpenCode schema
- [ ] Integrate MCP client support for STDIO, HTTP, and SSE transports
- [ ] Support Context7 and sequential thinking MCP servers as tools
- [ ] Create skills system for loading SKILL.md files from filesystem
- [ ] Maintain existing Vercel AI SDK core functionality (streaming, tools, artifacts)
- [ ] Keep multimodal input support (text, images, files)
- [ ] Preserve artifact system for code/document generation
- [ ] Create clean, stateless chat interface
- [ ] Support multiple AI providers through Vercel AI Gateway/SDK

### Out of Scope

- User authentication or authorization — stateless operation only
- Chat history or message persistence — fresh session per page load
- User management or profiles — no user concepts
- Database integration — config file driven only
- Dynamic skill management UI — filesystem-based skills only
- Rate limiting based on users — simple per-session limits if needed

## Context

**Current Codebase State:**
- Built on Vercel AI chatbot template with Next.js 16 and React 19
- Uses Auth.js v5 for authentication (guest + credentials)
- PostgreSQL database with Drizzle ORM for chat/message persistence
- Redis for stream resumption and caching
- Comprehensive sidebar with chat history management
- User-based features like message voting and visibility controls

**Target Architecture:**
- Transform into stateless, config-driven chatbot
- Use OpenCode config schema for model and MCP configuration
- MCP integration via @ai-sdk/mcp for tool capabilities
- Skills loaded statically from filesystem (SKILL.md pattern)
- Session management limited to browser session only
- Clean, unopinionated UI focused on chat interaction

**Technical Environment:**
- Vercel AI SDK v6 with full provider ecosystem support
- Next.js App Router with server components
- TypeScript throughout the codebase
- Existing tool system that can be extended with MCP tools

## Constraints

- **Configuration**: File-based only using OpenCode schema — no runtime UI configuration
- **Session Management**: Browser session only — no server-side persistence
- **Skills**: Static loading from filesystem — no dynamic skill management
- **Deployment**: Must work on Vercel with static configuration
- **Compatibility**: Maintain existing Vercel AI SDK patterns and artifacts system

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Remove all authentication | Simplicity - stateless operation without user complexity | — Pending |
| File-based configuration | Deterministic, version-controlled setup without UI complexity | — Pending |
| Static skills loading | Filesystem-based approach avoids runtime management complexity | — Pending |
| Keep artifacts system | Valuable for document/code generation, fits well with skills | — Pending |
| MCP as tools integration | Standard Vercel AI SDK tool pattern for maximum compatibility | — Pending |

---
*Last updated: 2026-03-18 after initialization*