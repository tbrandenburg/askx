# Phase 1 GSD Plan: Authentication & Persistence Removal

**Project:** Generic Web Chatbot  
**Phase:** 1 - Authentication & Persistence Removal  
**Created:** 2026-03-18  
**Methodology:** GSD (Get Stuff Done)

## Phase Overview

**Goal:** Remove all user management and data persistence to create stateless foundation  
**Duration Estimate:** 3-4 days  
**Risk Level:** Medium (structural changes to core architecture)

## Goal-Backward Verification

Working backwards from success criteria to ensure each task contributes to the end goal:

**Success Criteria (What we must achieve):**
1. ✅ Application starts without authentication dependencies
2. ✅ No database connections or schema references exist  
3. ✅ Chat interface loads without sidebar or user-specific elements

**Required Outcomes (How we measure success):**
- App runs with `pnpm dev` without authentication errors
- Zero database-related imports or function calls in codebase
- Chat interface displays cleanly without sidebar components
- No user session management or user-specific state

## Task Breakdown & Dependencies

### Task Group A: Authentication System Removal
**Dependencies:** None (can start immediately)  
**Estimated Time:** 1 day  
**Risk:** Low-Medium (may break imports)

#### A1: Remove Auth.js Configuration
- **Files:** `app/(auth)/auth.ts`, `app/(auth)/auth.config.ts`
- **Actions:** Delete authentication configuration files
- **Validation:** No auth imports remain in app
- **Time:** 30 mins

#### A2: Remove Authentication Routes & Components  
- **Files:** `app/(auth)/*`, `components/auth-form.tsx`
- **Actions:** Delete auth directory and login/register components
- **Validation:** No auth routes accessible, no auth components imported
- **Time:** 45 mins

#### A3: Remove Authentication Dependencies
- **Files:** `package.json`
- **Actions:** Remove `next-auth@5.0.0-beta.25`, `bcrypt-ts@5.0.2`
- **Dependencies:** Complete A1, A2 first to avoid import errors
- **Validation:** `pnpm install` runs cleanly
- **Time:** 15 mins

### Task Group B: Database & Persistence Removal
**Dependencies:** Complete A3 first (auth removal)  
**Estimated Time:** 1.5 days  
**Risk:** High (core data layer changes)

#### B1: Remove Database Schema
- **Files:** `lib/db/schema.ts`, `lib/db/migrations/*`
- **Actions:** Delete all database schema and migration files
- **Validation:** No schema imports in codebase
- **Time:** 1 hour

#### B2: Remove Database Utilities & Queries
- **Files:** `lib/db/queries.ts`, `lib/db/utils.ts`, `lib/db/migrate.ts`
- **Actions:** Delete database utility and query functions
- **Dependencies:** Complete B1 to avoid schema references
- **Validation:** No database queries in app layer
- **Time:** 45 mins

#### B3: Remove Database Dependencies
- **Files:** `package.json`, `drizzle.config.ts`
- **Actions:** Remove `drizzle-orm@0.34.0`, `drizzle-kit@0.25.0`, `postgres@3.4.4`
- **Dependencies:** Complete B1, B2 first
- **Validation:** No database packages in dependencies
- **Time:** 30 mins

#### B4: Remove Redis Integration
- **Files:** Search for Redis imports across codebase
- **Actions:** Remove Redis-based stream resumption and caching
- **Dependencies:** Complete database removal first
- **Validation:** No Redis connections or imports
- **Time:** 2 hours

### Task Group C: User Interface Cleanup  
**Dependencies:** Complete A2 (auth components removed)  
**Estimated Time:** 1 day  
**Risk:** Medium (UI restructuring)

#### C1: Remove Sidebar System
- **Files:** 
  - `components/app-sidebar.tsx`
  - `components/sidebar-toggle.tsx` 
  - `components/sidebar-history.tsx`
  - `components/sidebar-history-item.tsx`
  - `components/sidebar-user-nav.tsx`
  - `components/ui/sidebar.tsx`
- **Actions:** Delete all sidebar-related components
- **Validation:** No sidebar imports in layout files
- **Time:** 1 hour

#### C2: Update Layout Components
- **Files:** `app/(chat)/layout.tsx`, `components/chat-header.tsx`
- **Actions:** Remove sidebar references, update layout structure
- **Dependencies:** Complete C1 first
- **Validation:** Layout renders without sidebar components
- **Time:** 2 hours

#### C3: Remove User-Specific Features
- **Files:** `hooks/use-chat-visibility.ts`, search for user/session hooks
- **Actions:** Remove user-based visibility controls and session hooks
- **Validation:** No user-dependent state management
- **Time:** 1.5 hours

### Task Group D: Chat System Simplification
**Dependencies:** Complete B (database removal), C (UI cleanup)  
**Estimated Time:** 1 day  
**Risk:** Medium (core functionality changes)

#### D1: Remove Chat Persistence
- **Files:** `app/(chat)/api/chat/route.ts`, `components/chat.tsx`
- **Actions:** Remove database save/load logic from chat API and components
- **Dependencies:** Complete B2 (database queries removed)
- **Validation:** Chat works without persistence
- **Time:** 3 hours

#### D2: Remove User-Based Features
- **Files:** Search for vote, user validation in chat components
- **Actions:** Remove message voting, user validation, rate limiting
- **Validation:** Chat functions without user context
- **Time:** 2 hours

#### D3: Update Package Scripts
- **Files:** `package.json`
- **Actions:** Remove `db:*` scripts, update build script
- **Dependencies:** Complete B3 (database dependencies removed)
- **Validation:** All npm scripts run without database errors
- **Time:** 30 mins

## Implementation Roadmap

### Day 1: Authentication Removal
**Morning (4 hours):**
- Execute Task Group A (A1 → A2 → A3)
- Test application starts without auth errors
- Commit: "Remove authentication system and dependencies"

**Afternoon (4 hours):**
- Begin Task Group B (B1 → B2)
- Remove database schema and queries
- Commit: "Remove database schema and query layer"

### Day 2: Database & Persistence Cleanup
**Morning (4 hours):**
- Complete Task Group B (B3 → B4)
- Remove all database and Redis dependencies
- Test: `pnpm install` and `pnpm dev` run cleanly

**Afternoon (4 hours):**
- Begin Task Group C (C1 → C2)
- Remove sidebar system and update layouts
- Commit: "Remove database dependencies and sidebar system"

### Day 3: UI & Chat System Updates
**Morning (4 hours):**
- Complete Task Group C (C3)
- Remove all user-specific UI features
- Test: Chat interface loads without sidebar

**Afternoon (4 hours):**
- Execute Task Group D (D1 → D2 → D3)
- Simplify chat system to stateless operation
- Commit: "Convert to stateless chat interface"

### Day 4: Integration & Validation
**Full Day (8 hours):**
- End-to-end testing of stateless chat interface
- Fix any remaining imports or dependencies
- Validate all success criteria are met
- Final commit: "Complete Phase 1: Stateless chatbot foundation"

## Risk Mitigation

### High-Risk Areas:
1. **Database Removal (Task B):** Core data layer changes could break imports
   - **Mitigation:** Remove in dependency order, test after each step
   - **Rollback Plan:** Git branch with checkpoint commits

2. **Chat API Changes (Task D1):** Core functionality modification
   - **Mitigation:** Maintain existing Vercel AI SDK patterns
   - **Rollback Plan:** Keep streaming and tool integration intact

### Medium-Risk Areas:
1. **Layout Updates (Task C2):** UI structure changes
   - **Mitigation:** Test UI after each component removal
   - **Rollback Plan:** Incremental commits for each UI change

## Success Validation Checklist

### ✅ Success Criteria 1: Application starts without authentication dependencies
- [ ] `pnpm dev` runs without authentication errors
- [ ] No auth-related imports in any component
- [ ] No authentication routes accessible
- [ ] No auth dependencies in package.json

### ✅ Success Criteria 2: No database connections or schema references exist
- [ ] No database imports in any file
- [ ] No database dependencies in package.json
- [ ] All database files removed from codebase
- [ ] No Redis connections or references

### ✅ Success Criteria 3: Chat interface loads without sidebar or user-specific elements
- [ ] Chat interface renders cleanly
- [ ] No sidebar components visible
- [ ] No user-specific navigation or features
- [ ] Chat functions without user session

## Post-Phase 1 Readiness

Upon completion, the codebase will be ready for:
- **Phase 2:** Configuration system implementation
- **Phase 3:** Clean chat interface redesign  
- **Future Phases:** MCP integration and skills system

The stateless foundation will enable all subsequent configuration-driven features without user management complexity.

---
**Next Steps:** After Phase 1 completion, proceed to Phase 2 (Configuration System) implementation.