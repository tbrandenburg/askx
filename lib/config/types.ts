/**
 * OpenCode Configuration Schema Types
 * Based on OpenCode schema: https://opencode.ai/config.json
 */

// Base types
export type EnvironmentName = "development" | "production" | "test" | "staging";

// Model Provider Configuration
export interface ProviderConfig {
  options?: {
    apiKey?: string;
    baseURL?: string;
    timeout?: number | false;
    chunkTimeout?: number;
    setCacheKey?: boolean;
    // Amazon Bedrock specific options
    region?: string;
    profile?: string;
    endpoint?: string;
  };
  models?: Record<string, any>;
}

export interface ProvidersConfig {
  [providerName: string]: ProviderConfig;
}

// MCP Server Configuration
export type MCPTransportType = "stdio" | "http" | "sse";

export interface MCPServerConfigBase {
  enabled?: boolean;
  timeout?: number;
}

export interface MCPServerLocalConfig extends MCPServerConfigBase {
  type: "local";
  command: string[];
  environment?: Record<string, string>;
}

export interface MCPServerRemoteConfig extends MCPServerConfigBase {
  type: "remote";
  url: string;
  headers?: Record<string, string>;
  oauth?:
    | false
    | {
        clientId?: string;
        clientSecret?: string;
        scope?: string;
      };
}

export type MCPServerConfig = MCPServerLocalConfig | MCPServerRemoteConfig;

export interface MCPServersConfig {
  [serverName: string]: MCPServerConfig;
}

// Skills Directory Configuration
export interface SkillsConfig {
  directory?: string;
  enabled?: boolean;
}

// Agent Configuration
export interface AgentConfig {
  description?: string;
  model?: string;
  prompt?: string;
  tools?: Record<string, boolean>;
  instructions?: string[];
}

export interface AgentsConfig {
  [agentName: string]: AgentConfig;
}

// Command Configuration
export interface CommandConfig {
  template: string;
  description?: string;
  agent?: string;
  model?: string;
}

export interface CommandsConfig {
  [commandName: string]: CommandConfig;
}

// Tools Configuration
export interface ToolsConfig {
  [toolName: string]: boolean;
}

// Server Configuration
export interface ServerConfig {
  port?: number;
  hostname?: string;
  mdns?: boolean;
  mdnsDomain?: string;
  cors?: string[];
}

// Compaction Configuration
export interface CompactionConfig {
  auto?: boolean;
  prune?: boolean;
  reserved?: number;
}

// Watcher Configuration
export interface WatcherConfig {
  ignore?: string[];
}

// Permission Configuration
export type PermissionLevel = "allow" | "ask" | "deny";
export interface PermissionsConfig {
  [toolName: string]: PermissionLevel;
}

// Formatter Configuration
export interface FormatterConfig {
  disabled?: boolean;
  command?: string[];
  environment?: Record<string, string>;
  extensions?: string[];
}

export interface FormattersConfig {
  [formatterName: string]: FormatterConfig;
}

// Experimental Configuration
export interface ExperimentalConfig {
  [key: string]: any;
}

// Main Configuration Schema
export interface OpenCodeConfig {
  $schema?: string;

  // Core model settings
  model?: string;
  small_model?: string;
  provider?: ProvidersConfig;

  // Agent settings
  agent?: AgentsConfig;
  default_agent?: string;

  // Feature configurations
  mcp?: MCPServersConfig;
  skills?: SkillsConfig;
  tools?: ToolsConfig;
  command?: CommandsConfig;

  // Server and runtime
  server?: ServerConfig;
  compaction?: CompactionConfig;
  watcher?: WatcherConfig;
  permission?: PermissionsConfig;
  formatter?: FormattersConfig;

  // Environment and sharing
  share?: "manual" | "auto" | "disabled";
  snapshot?: boolean;
  autoupdate?: boolean | "notify";
  instructions?: string[];
  disabled_providers?: string[];
  enabled_providers?: string[];

  // Plugin system
  plugin?: string[];

  // Experimental features
  experimental?: ExperimentalConfig;
}

// Environment-specific configuration structure
export type ConfigWithEnvironment = {
  [env: string]: OpenCodeConfig;
} & {
  default?: OpenCodeConfig;
};

// Configuration loading result
export interface ConfigLoadResult {
  config: OpenCodeConfig;
  source: string;
  environment: EnvironmentName | "default";
}

// Variable substitution types
export type ConfigValue = string | number | boolean | object | null | undefined;
export type VariableSubstitution = {
  type: "env" | "file";
  key: string;
  fallback?: string;
};
