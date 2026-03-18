# Phase 2 GSD Plan: Configuration System

**Project:** Generic Web Chatbot  
**Phase:** 2 - Configuration System  
**Created:** 2026-03-18  
**Methodology:** GSD (Get Stuff Done)

## Phase Overview

**Goal:** Implement file-based configuration using OpenCode schema  
**Duration Estimate:** 4-5 days  
**Risk Level:** Medium-High (new architecture patterns, external schema dependency)

## Goal-Backward Verification

Working backwards from success criteria to ensure each task contributes to the end goal:

**Success Criteria (What we must achieve):**
1. Configuration file validates against OpenCode schema
2. Model providers can be configured via config file
3. MCP servers can be defined in configuration  
4. Skills directory path is configurable

**Required Outcomes (How we measure success):**
- Valid opencode.config.json file that passes schema validation
- AI model providers loadable from config (OpenAI, Anthropic, etc.)
- MCP server definitions parseable with STDIO, HTTP, SSE transports
- Skills directory configurable and loadable from config path
- Environment-based config selection working (dev, prod, staging)

## Task Breakdown & Dependencies

### Task Group A: Research & Schema Foundation
**Dependencies:** None (can start immediately)  
**Estimated Time:** 1.5 days  
**Risk:** High (external dependency on OpenCode schema)

#### A1: Research OpenCode Configuration Schema
- **Actions:** Study OpenCode schema documentation and examples
- **Goals:** Understand structure, validation rules, supported providers
- **Validation:** Can explain schema structure and create valid example
- **Time:** 4 hours

#### A2: Analyze Current Vercel AI SDK Configuration
- **Files:** Current chat API route, existing provider usage
- **Actions:** Document how models are currently instantiated
- **Dependencies:** Need to understand current patterns before replacing
- **Validation:** Clear mapping of current → config-driven approach
- **Time:** 2 hours  

#### A3: Create Base Configuration Schema Types
- **Files:** `lib/config/types.ts`
- **Actions:** Define TypeScript types matching OpenCode schema
- **Dependencies:** Complete A1 (schema understanding)
- **Validation:** Types compile and match schema structure
- **Time:** 3 hours

#### A4: Implement Configuration File Loading
- **Files:** `lib/config/loader.ts`
- **Actions:** File reading, JSON parsing, environment selection
- **Dependencies:** Complete A3 (types defined)
- **Validation:** Can load and parse config files without errors
- **Time:** 2 hours

### Task Group B: Model Provider Configuration
**Dependencies:** Complete A (foundation ready)  
**Estimated Time:** 1.5 days  
**Risk:** Medium (provider API integration complexity)

#### B1: Design Provider Configuration Interface  
- **Files:** `lib/config/providers.ts`
- **Actions:** Create abstraction for different AI providers
- **Dependencies:** Complete A3 (types available)
- **Validation:** Unified interface for all supported providers
- **Time:** 2 hours

#### B2: Implement OpenAI Provider Configuration
- **Files:** `lib/providers/openai.ts`
- **Actions:** Config-driven OpenAI client instantiation
- **Dependencies:** Complete B1 (provider interface)
- **Validation:** OpenAI models loadable from config settings
- **Time:** 2 hours

#### B3: Implement Anthropic Provider Configuration  
- **Files:** `lib/providers/anthropic.ts`
- **Actions:** Config-driven Anthropic client instantiation
- **Dependencies:** Complete B1 (provider interface)  
- **Validation:** Anthropic models loadable from config settings
- **Time:** 2 hours

#### B4: Add Generic Provider Support
- **Files:** `lib/providers/generic.ts` 
- **Actions:** Support for custom/generic OpenAI-compatible providers
- **Dependencies:** Complete B2, B3 (pattern established)
- **Validation:** Generic providers work with custom base URLs
- **Time:** 2 hours

### Task Group C: MCP Server Configuration
**Dependencies:** Complete A (foundation), can run parallel to B  
**Estimated Time:** 1 day  
**Risk:** Medium (MCP protocol complexity)

#### C1: Research MCP Configuration Requirements
- **Actions:** Study @ai-sdk/mcp documentation and MCP protocol
- **Goals:** Understand transport types, server definition requirements  
- **Validation:** Clear requirements for STDIO, HTTP, SSE config
- **Time:** 2 hours

#### C2: Design MCP Server Configuration Schema
- **Files:** `lib/config/mcp.ts`
- **Actions:** Define config structure for MCP servers
- **Dependencies:** Complete C1 (requirements understood), A3 (types)
- **Validation:** Schema supports all three transport types
- **Time:** 2 hours

#### C3: Implement MCP Configuration Loading
- **Files:** `lib/mcp/config-loader.ts`
- **Actions:** Load and validate MCP server definitions from config
- **Dependencies:** Complete C2 (schema defined)
- **Validation:** MCP server configs parse and validate correctly
- **Time:** 3 hours

#### C4: Create MCP Configuration Validation
- **Files:** `lib/mcp/validator.ts`  
- **Actions:** Validate MCP server configs before instantiation
- **Dependencies:** Complete C3 (loading implemented)
- **Validation:** Invalid MCP configs are caught with clear errors
- **Time:** 1 hour

### Task Group D: Skills Directory Configuration
**Dependencies:** Complete A (foundation), can run parallel to B and C  
**Estimated Time:** 0.5 days  
**Risk:** Low (simple filesystem configuration)

#### D1: Design Skills Directory Configuration  
- **Files:** `lib/config/skills.ts`
- **Actions:** Define skills directory path configuration
- **Dependencies:** Complete A3 (types available)
- **Validation:** Skills directory configurable with validation
- **Time:** 1 hour

#### D2: Implement Skills Path Resolution
- **Files:** `lib/skills/path-resolver.ts`  
- **Actions:** Resolve skills directory from config with fallbacks
- **Dependencies:** Complete D1 (config structure defined)
- **Validation:** Skills directory resolves correctly from config
- **Time:** 2 hours

#### D3: Add Skills Directory Validation
- **Files:** `lib/skills/validator.ts`
- **Actions:** Validate skills directory exists and is readable
- **Dependencies:** Complete D2 (path resolution)  
- **Validation:** Non-existent skills directories handled gracefully
- **Time:** 1 hour

### Task Group E: Environment & Integration
**Dependencies:** Complete A, B, C, D (all systems ready)  
**Estimated Time:** 1 day  
**Risk:** Medium (environment complexity, integration issues)

#### E1: Implement Environment-Based Config Selection
- **Files:** `lib/config/environment.ts`
- **Actions:** Load different configs based on NODE_ENV and custom env vars
- **Dependencies:** Complete A4 (config loading)
- **Validation:** Correct config file loaded for each environment
- **Time:** 2 hours

#### E2: Create Configuration Validation Pipeline  
- **Files:** `lib/config/validator.ts`
- **Actions:** Full config validation against OpenCode schema
- **Dependencies:** Complete A3 (types), all config systems (B,C,D)
- **Validation:** Invalid configs rejected with helpful error messages  
- **Time:** 3 hours

#### E3: Integrate Configuration with Existing API
- **Files:** `app/(chat)/api/chat/route.ts`
- **Actions:** Replace hardcoded model setup with config-driven approach
- **Dependencies:** Complete B (provider config), E2 (validation)
- **Validation:** Chat API uses configured models successfully
- **Time:** 2 hours

#### E4: Create Configuration Loading Middleware
- **Files:** `lib/config/middleware.ts`
- **Actions:** Ensure config is loaded and validated on app startup
- **Dependencies:** Complete E2 (validation), E3 (API integration)
- **Validation:** App fails fast with clear errors for invalid configs
- **Time:** 1 hour

## Implementation Roadmap

### Day 1: Research & Foundation
**Morning (4 hours):**
- Execute Task Group A (A1 → A2 → A3)  
- Research OpenCode schema and analyze current patterns
- Create base configuration types
- Commit: "Add OpenCode configuration schema types and foundation"

**Afternoon (4 hours):**
- Complete Task Group A (A4)
- Begin Task Group B (B1 → B2)
- Implement config loading and OpenAI provider
- Commit: "Implement configuration file loading and OpenAI provider"

### Day 2: Provider Configuration
**Morning (4 hours):**
- Continue Task Group B (B3 → B4)  
- Implement Anthropic and generic provider configuration
- Test: Different providers load correctly from config

**Afternoon (4 hours):**
- Begin Task Group C (C1 → C2)
- Research MCP requirements and design configuration schema
- Commit: "Complete model provider configuration system"

### Day 3: MCP Configuration
**Morning (4 hours):**
- Continue Task Group C (C3 → C4)
- Implement MCP configuration loading and validation
- Test: MCP server definitions parse correctly

**Afternoon (4 hours):**
- Execute Task Group D (D1 → D2 → D3)
- Implement skills directory configuration
- Commit: "Add MCP server and skills directory configuration"

### Day 4: Environment & Integration
**Morning (4 hours):**
- Execute Task Group E (E1 → E2)
- Implement environment selection and validation pipeline  
- Test: Different environments load correct configurations

**Afternoon (4 hours):**
- Complete Task Group E (E3 → E4)
- Integrate configuration with API and add middleware
- Commit: "Complete configuration system integration"

### Day 5: Validation & Documentation
**Full Day (8 hours):**
- Create example configuration files for different environments
- End-to-end testing of configuration system  
- Validate all success criteria are met
- Document configuration schema and usage
- Final commit: "Complete Phase 2: Configuration system with examples"

## Risk Mitigation

### High-Risk Areas:
1. **OpenCode Schema Dependency (Task A1):** External schema changes could break our implementation
   - **Mitigation:** Pin to specific schema version, create comprehensive tests
   - **Rollback Plan:** Fallback to simplified internal schema if needed

2. **Provider Integration Complexity (Task Group B):** Different providers may have incompatible requirements  
   - **Mitigation:** Test with actual API keys early, create provider abstraction layer
   - **Rollback Plan:** Start with OpenAI only, add others incrementally

### Medium-Risk Areas:
1. **MCP Configuration Complexity (Task Group C):** MCP protocol may have undocumented requirements
   - **Mitigation:** Study @ai-sdk/mcp thoroughly, start with STDIO transport
   - **Rollback Plan:** Implement basic configuration, defer complex transport types

2. **Environment Configuration (Task E1):** Complex environment selection logic
   - **Mitigation:** Keep environment logic simple, provide clear fallbacks
   - **Rollback Plan:** Single config file approach if environment selection fails

## Success Validation Checklist

### Success Criteria 1: Configuration file validates against OpenCode schema
- [ ] opencode.config.json file exists and follows schema structure
- [ ] Schema validation passes without errors
- [ ] TypeScript types match OpenCode schema exactly
- [ ] Invalid configs are rejected with helpful error messages

### Success Criteria 2: Model providers can be configured via config file
- [ ] OpenAI models load correctly from config
- [ ] Anthropic models load correctly from config  
- [ ] Generic/custom providers work with custom base URLs
- [ ] API keys and authentication methods configurable

### Success Criteria 3: MCP servers can be defined in configuration
- [ ] STDIO transport MCP servers can be configured
- [ ] HTTP transport MCP servers can be configured  
- [ ] SSE transport MCP servers can be configured
- [ ] Invalid MCP configs are handled gracefully

### Success Criteria 4: Skills directory path is configurable
- [ ] Skills directory path can be set in configuration
- [ ] Path resolution works with relative and absolute paths
- [ ] Non-existent directories are handled gracefully
- [ ] Skills directory validation provides clear feedback

## Post-Phase 2 Readiness

Upon completion, the codebase will be ready for:
- **Phase 3:** Chat interface redesign using configured providers
- **Phase 4:** MCP integration using configured servers  
- **Phase 5:** Skills system loading from configured directory
- **Phase 6:** API integration of all configured systems

The configuration system will provide the foundation for all subsequent stateless, config-driven features.

---
**Next Steps:** After Phase 2 completion, proceed to Phase 3 (Chat Interface Redesign) implementation.