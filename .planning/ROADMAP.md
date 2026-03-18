# Roadmap: Generic Web Chatbot

**Project:** Generic Web Chatbot  
**Created:** 2026-03-18  
**Strategy:** Transform existing Vercel AI chatbot template into stateless, configurable interface

## Overview

**6 phases** | **38 requirements mapped** | All v1 requirements covered ✓

Transform from a full-featured chat application with authentication and persistence into a lightweight, configurable chatbot frontend supporting multiple AI models, MCP servers, and filesystem-based skills.

## Phase Structure

| # | Phase | Goal | Requirements | Success Criteria |
|---|-------|------|--------------|------------------|
| 1 | Authentication & Persistence Removal | Remove all user management and data persistence | CLEAN-01 to CLEAN-10 (10) | 3 |
| 2 | Configuration System | Implement file-based configuration using OpenCode schema | CONF-01 to CONF-07 (7) | 4 |
| 3 | Chat Interface Redesign | Create clean, stateless chat interface | CHAT-01 to CHAT-07 (7) | 4 |
| 4 | MCP Integration | Add Model Context Protocol support for extensible tools | MCP-01 to MCP-08 (8) | 3 |
| 5 | Skills System | Implement filesystem-based skills loading | SKILL-01 to SKILL-06 (6) | 3 |
| 6 | API Integration | Integrate all systems into unified API layer | API-01 to API-06 (6) | 4 |

## Phase Details

### Phase 1: Authentication & Persistence Removal
**Goal:** Remove all user management and data persistence to create stateless foundation

**Requirements:**
- CLEAN-01: Remove Auth.js configuration and authentication routes
- CLEAN-02: Remove user table and user-related database schema
- CLEAN-03: Remove chat, message, and vote tables from database
- CLEAN-04: Remove session management and SessionProvider
- CLEAN-05: Remove sidebar component with chat history
- CLEAN-06: Remove chat CRUD operations (create, save, load, delete)
- CLEAN-07: Remove Redis integration for stream resumption
- CLEAN-08: Remove user-based rate limiting and entitlements
- CLEAN-09: Remove database dependencies from package.json
- CLEAN-10: Remove auth dependencies (next-auth, bcrypt-ts)

**Success Criteria:**
1. Application starts without authentication dependencies
2. No database connections or schema references exist
3. Chat interface loads without sidebar or user-specific elements

### Phase 2: Configuration System
**Goal:** Implement file-based configuration using OpenCode schema

**Requirements:**
- CONF-01: Create OpenCode schema-compliant config file structure
- CONF-02: Implement model provider configuration loading
- CONF-03: Support API key and OAuth token configuration
- CONF-04: Create MCP server configuration schema
- CONF-05: Support STDIO, HTTP, and SSE MCP transport configuration
- CONF-06: Implement skills directory configuration
- CONF-07: Add environment-based config file selection

**Success Criteria:**
1. Configuration file validates against OpenCode schema
2. Model providers can be configured via config file
3. MCP servers can be defined in configuration
4. Skills directory path is configurable

### Phase 3: Chat Interface Redesign
**Goal:** Create clean, stateless chat interface

**Requirements:**
- CHAT-01: Create clean, stateless chat component
- CHAT-02: Maintain streaming response functionality
- CHAT-03: Preserve multimodal input (text, images, files)
- CHAT-04: Keep artifact generation and display system
- CHAT-05: Implement session-only message history (no persistence)
- CHAT-06: Remove user-specific UI elements and navigation
- CHAT-07: Update layout to remove sidebar and user features

**Success Criteria:**
1. Chat interface works without authentication
2. Messages are displayed but not persisted across page reloads
3. Multimodal input (text, images, files) functions correctly
4. Artifacts generate and display properly

### Phase 4: MCP Integration
**Goal:** Add Model Context Protocol support for extensible tools

**Requirements:**
- MCP-01: Install and configure @ai-sdk/mcp package
- MCP-02: Implement MCP client creation from config
- MCP-03: Support STDIO transport for local MCP servers
- MCP-04: Support HTTP transport for remote MCP servers
- MCP-05: Support SSE transport for streaming MCP servers
- MCP-06: Integrate Context7 MCP server as tool
- MCP-07: Integrate sequential thinking MCP server as tool
- MCP-08: Convert MCP tools to AI SDK tool format

**Success Criteria:**
1. MCP clients can be created from configuration
2. Context7 MCP server functions as a chat tool
3. Sequential thinking MCP server integrates successfully

### Phase 5: Skills System
**Goal:** Implement filesystem-based skills loading

**Requirements:**
- SKILL-01: Create skills directory structure
- SKILL-02: Implement SKILL.md file loading
- SKILL-03: Parse and validate skill definitions
- SKILL-04: Integrate skills with AI SDK tool system
- SKILL-05: Support skill resources and scripts loading
- SKILL-06: Add error handling for invalid skills

**Success Criteria:**
1. SKILL.md files can be loaded from configured directory
2. Skills integrate as tools in the chat interface
3. Invalid skills are handled gracefully with error messages

### Phase 6: API Integration
**Goal:** Integrate all systems into unified API layer

**Requirements:**
- API-01: Simplify chat API route (remove user validation)
- API-02: Remove chat persistence logic from API
- API-03: Integrate configured models with streaming
- API-04: Add MCP tools to API tool registry
- API-05: Add skills to API tool registry
- API-06: Maintain existing tool system compatibility

**Success Criteria:**
1. Chat API works without user authentication
2. Configured AI models respond to chat requests
3. MCP tools and skills are available in conversations
4. Existing tool patterns (weather, document creation) still function

## Dependencies

- **Phase 1 → Phase 2**: Must remove persistence before implementing config
- **Phase 2 → Phase 3**: Configuration needed before redesigning interface
- **Phase 2 → Phase 4**: MCP config required before integration
- **Phase 2 → Phase 5**: Skills config required before implementation
- **Phases 3,4,5 → Phase 6**: All systems needed before API integration

## Success Metrics

**Phase 1:** Authentication removal without breaking core chat functionality  
**Phase 2:** Configuration system supports all required provider types  
**Phase 3:** Chat interface maintains usability without persistence  
**Phase 4:** MCP integration adds functional tools to conversations  
**Phase 5:** Skills system extends chatbot capabilities  
**Phase 6:** Complete system functions as intended generic chatbot

---
*Created: 2026-03-18*