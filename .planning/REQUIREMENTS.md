# Requirements: Generic Web Chatbot

**Defined:** 2026-03-18
**Core Value:** Provide a simple, configurable chatbot interface that developers can deploy immediately and extend with any AI model, MCP server, or skill without needing to manage users, databases, or persistent state.

## v1 Requirements

Requirements for initial release. Each maps to roadmap phases.

### Cleanup
- [ ] **CLEAN-01**: Remove Auth.js configuration and authentication routes
- [ ] **CLEAN-02**: Remove user table and user-related database schema
- [ ] **CLEAN-03**: Remove chat, message, and vote tables from database
- [ ] **CLEAN-04**: Remove session management and SessionProvider
- [ ] **CLEAN-05**: Remove sidebar component with chat history
- [ ] **CLEAN-06**: Remove chat CRUD operations (create, save, load, delete)
- [ ] **CLEAN-07**: Remove Redis integration for stream resumption
- [ ] **CLEAN-08**: Remove user-based rate limiting and entitlements
- [ ] **CLEAN-09**: Remove database dependencies from package.json
- [ ] **CLEAN-10**: Remove auth dependencies (next-auth, bcrypt-ts)

### Configuration
- [ ] **CONF-01**: Create OpenCode schema-compliant config file structure
- [ ] **CONF-02**: Implement model provider configuration loading
- [ ] **CONF-03**: Support API key and OAuth token configuration
- [ ] **CONF-04**: Create MCP server configuration schema
- [ ] **CONF-05**: Support STDIO, HTTP, and SSE MCP transport configuration
- [ ] **CONF-06**: Implement skills directory configuration
- [ ] **CONF-07**: Add environment-based config file selection

### Chat Interface
- [ ] **CHAT-01**: Create clean, stateless chat component
- [ ] **CHAT-02**: Maintain streaming response functionality
- [ ] **CHAT-03**: Preserve multimodal input (text, images, files)
- [ ] **CHAT-04**: Keep artifact generation and display system
- [ ] **CHAT-05**: Implement session-only message history (no persistence)
- [ ] **CHAT-06**: Remove user-specific UI elements and navigation
- [ ] **CHAT-07**: Update layout to remove sidebar and user features

### MCP Integration
- [ ] **MCP-01**: Install and configure @ai-sdk/mcp package
- [ ] **MCP-02**: Implement MCP client creation from config
- [ ] **MCP-03**: Support STDIO transport for local MCP servers
- [ ] **MCP-04**: Support HTTP transport for remote MCP servers
- [ ] **MCP-05**: Support SSE transport for streaming MCP servers
- [ ] **MCP-06**: Integrate Context7 MCP server as tool
- [ ] **MCP-07**: Integrate sequential thinking MCP server as tool
- [ ] **MCP-08**: Convert MCP tools to AI SDK tool format

### Skills System
- [ ] **SKILL-01**: Create skills directory structure
- [ ] **SKILL-02**: Implement SKILL.md file loading
- [ ] **SKILL-03**: Parse and validate skill definitions
- [ ] **SKILL-04**: Integrate skills with AI SDK tool system
- [ ] **SKILL-05**: Support skill resources and scripts loading
- [ ] **SKILL-06**: Add error handling for invalid skills

### API Layer
- [ ] **API-01**: Simplify chat API route (remove user validation)
- [ ] **API-02**: Remove chat persistence logic from API
- [ ] **API-03**: Integrate configured models with streaming
- [ ] **API-04**: Add MCP tools to API tool registry
- [ ] **API-05**: Add skills to API tool registry
- [ ] **API-06**: Maintain existing tool system compatibility

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

### Advanced Configuration
- **CONF-ADV-01**: Hot-reload configuration changes
- **CONF-ADV-02**: Configuration validation and error reporting
- **CONF-ADV-03**: Multiple environment config profiles

### Extended MCP Support
- **MCP-ADV-01**: MCP resource integration
- **MCP-ADV-02**: MCP prompt template support
- **MCP-ADV-03**: Elicitation request handling

### Skills Enhancement
- **SKILL-ADV-01**: Remote skills loading from URLs
- **SKILL-ADV-02**: Skill dependency resolution
- **SKILL-ADV-03**: Dynamic skill reloading

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| User authentication | Stateless operation - no user concepts |
| Chat persistence | Session-only operation - no database storage |
| User management UI | No user concepts in generic chatbot |
| Dynamic configuration UI | File-based configuration only |
| Chat history across sessions | Stateless design choice |
| User-based rate limiting | No user tracking |
| Multi-tenant support | Single deployment per instance |
| Real-time collaboration | Single-user chat interface |
| Mobile app | Web-focused implementation |
| Chat export/import | No persistence layer |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| CLEAN-01 | Phase 1: Authentication & Persistence Removal | Pending |
| CLEAN-02 | Phase 1: Authentication & Persistence Removal | Pending |
| CLEAN-03 | Phase 1: Authentication & Persistence Removal | Pending |
| CLEAN-04 | Phase 1: Authentication & Persistence Removal | Pending |
| CLEAN-05 | Phase 1: Authentication & Persistence Removal | Pending |
| CLEAN-06 | Phase 1: Authentication & Persistence Removal | Pending |
| CLEAN-07 | Phase 1: Authentication & Persistence Removal | Pending |
| CLEAN-08 | Phase 1: Authentication & Persistence Removal | Pending |
| CLEAN-09 | Phase 1: Authentication & Persistence Removal | Pending |
| CLEAN-10 | Phase 1: Authentication & Persistence Removal | Pending |
| CONF-01 | Phase 2: Configuration System | Pending |
| CONF-02 | Phase 2: Configuration System | Pending |
| CONF-03 | Phase 2: Configuration System | Pending |
| CONF-04 | Phase 2: Configuration System | Pending |
| CONF-05 | Phase 2: Configuration System | Pending |
| CONF-06 | Phase 2: Configuration System | Pending |
| CONF-07 | Phase 2: Configuration System | Pending |
| CHAT-01 | Phase 3: Chat Interface Redesign | Pending |
| CHAT-02 | Phase 3: Chat Interface Redesign | Pending |
| CHAT-03 | Phase 3: Chat Interface Redesign | Pending |
| CHAT-04 | Phase 3: Chat Interface Redesign | Pending |
| CHAT-05 | Phase 3: Chat Interface Redesign | Pending |
| CHAT-06 | Phase 3: Chat Interface Redesign | Pending |
| CHAT-07 | Phase 3: Chat Interface Redesign | Pending |
| MCP-01 | Phase 4: MCP Integration | Pending |
| MCP-02 | Phase 4: MCP Integration | Pending |
| MCP-03 | Phase 4: MCP Integration | Pending |
| MCP-04 | Phase 4: MCP Integration | Pending |
| MCP-05 | Phase 4: MCP Integration | Pending |
| MCP-06 | Phase 4: MCP Integration | Pending |
| MCP-07 | Phase 4: MCP Integration | Pending |
| MCP-08 | Phase 4: MCP Integration | Pending |
| SKILL-01 | Phase 5: Skills System | Pending |
| SKILL-02 | Phase 5: Skills System | Pending |
| SKILL-03 | Phase 5: Skills System | Pending |
| SKILL-04 | Phase 5: Skills System | Pending |
| SKILL-05 | Phase 5: Skills System | Pending |
| SKILL-06 | Phase 5: Skills System | Pending |
| API-01 | Phase 6: API Integration | Pending |
| API-02 | Phase 6: API Integration | Pending |
| API-03 | Phase 6: API Integration | Pending |
| API-04 | Phase 6: API Integration | Pending |
| API-05 | Phase 6: API Integration | Pending |
| API-06 | Phase 6: API Integration | Pending |

**Coverage:**
- v1 requirements: 38 total
- Mapped to phases: 38
- Unmapped: 0 ✓

---
*Requirements defined: 2026-03-18*
*Last updated: 2026-03-18 after initial definition*