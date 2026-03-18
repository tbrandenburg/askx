import { existsSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import type {
  ConfigLoadResult,
  ConfigWithEnvironment,
  EnvironmentName,
  OpenCodeConfig,
} from "./types";

/**
 * Configuration file loader with environment support and variable substitution
 */

const CONFIG_FILENAMES = [
  "opencode.config.json",
  "opencode.config.jsonc",
  "opencode.json",
  "opencode.jsonc",
];

const DEFAULT_CONFIG: OpenCodeConfig = {
  $schema: "https://opencode.ai/config.json",
  model: "openai/gpt-4.1-mini",
  small_model: "google/gemini-2.5-flash-lite",
  share: "manual",
  snapshot: true,
  autoupdate: true,
  compaction: {
    auto: true,
    prune: true,
    reserved: 10_000,
  },
};

/**
 * Load configuration with environment selection and variable substitution
 */
export function loadConfig(
  configPath?: string,
  environment?: EnvironmentName
): ConfigLoadResult {
  const env = environment || getCurrentEnvironment();
  let config: OpenCodeConfig;
  let source: string;

  if (configPath) {
    // Load from specific path
    if (!existsSync(configPath)) {
      throw new Error(`Configuration file not found: ${configPath}`);
    }
    source = configPath;
    config = parseConfigFile(configPath, env);
  } else {
    // Search for config file
    const foundPath = findConfigFile();
    if (foundPath) {
      source = foundPath;
      config = parseConfigFile(foundPath, env);
    } else {
      source = "default";
      config = { ...DEFAULT_CONFIG };
    }
  }

  // Apply variable substitution
  config = substituteVariables(config, source);

  // Merge with default config
  config = mergeWithDefaults(config);

  return {
    config,
    source,
    environment: env,
  };
}

/**
 * Find configuration file in current directory or parent directories
 */
function findConfigFile(): string | null {
  let currentDir = process.cwd();

  while (currentDir !== dirname(currentDir)) {
    for (const filename of CONFIG_FILENAMES) {
      const configPath = join(currentDir, filename);
      if (existsSync(configPath)) {
        return configPath;
      }
    }
    currentDir = dirname(currentDir);
  }

  return null;
}

/**
 * Parse configuration file with environment selection
 */
function parseConfigFile(
  filePath: string,
  environment: EnvironmentName | "default"
): OpenCodeConfig {
  try {
    const content = readFileSync(filePath, "utf-8");
    const parsed = parseJsonWithComments(content);

    // Check if config has environment-specific sections
    if (isEnvironmentConfig(parsed)) {
      const envConfig = parsed as ConfigWithEnvironment;

      // Try to get environment-specific config
      if (environment !== "default" && envConfig[environment]) {
        return envConfig[environment];
      }

      // Fall back to default
      if (envConfig.default) {
        return envConfig.default;
      }

      // If no default and no matching environment, use first available
      const firstEnv = Object.keys(envConfig).find((key) => key !== "default");
      if (firstEnv && envConfig[firstEnv]) {
        return envConfig[firstEnv];
      }
    }

    // Return as-is if not environment-specific
    return parsed as OpenCodeConfig;
  } catch (error) {
    throw new Error(
      `Failed to parse configuration file ${filePath}: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
}

/**
 * Parse JSON with comments (JSONC)
 */
function parseJsonWithComments(content: string): any {
  // Simple JSONC parser - removes comments and trailing commas
  const withoutComments = content
    .replace(/\/\*[\s\S]*?\*\//g, "") // Remove /* */ comments
    .replace(/\/\/.*$/gm, "") // Remove // comments
    .replace(/,(\s*[}\]])/g, "$1"); // Remove trailing commas

  return JSON.parse(withoutComments);
}

/**
 * Check if configuration has environment-specific structure
 */
function isEnvironmentConfig(config: any): boolean {
  if (typeof config !== "object" || config === null) {
    return false;
  }

  // Check if it has environment names as top-level keys
  const envNames = ["development", "production", "test", "staging", "default"];
  const configKeys = Object.keys(config);

  // If any top-level key is an environment name, treat as environment config
  return envNames.some((envName) => configKeys.includes(envName));
}

/**
 * Get current environment from NODE_ENV or default to development
 */
function getCurrentEnvironment(): EnvironmentName {
  const env = process.env.NODE_ENV as EnvironmentName | undefined;

  if (env === "production") {
    return "production";
  }
  if (env === "test") {
    return "test";
  }
  if (env === "staging") {
    return "staging";
  }
  if (env === "development") {
    return "development";
  }

  return "development";
}

/**
 * Substitute variables in configuration
 */
function substituteVariables(
  config: OpenCodeConfig,
  basePath: string
): OpenCodeConfig {
  const baseDir = basePath === "default" ? process.cwd() : dirname(basePath);

  return processObjectRecursively(config, (value) => {
    if (typeof value === "string") {
      return substituteStringVariables(value, baseDir);
    }
    return value;
  });
}

/**
 * Process object recursively for variable substitution
 */
function processObjectRecursively(
  obj: any,
  processor: (value: any) => any
): any {
  if (Array.isArray(obj)) {
    return obj.map((item) => processObjectRecursively(item, processor));
  }

  if (obj !== null && typeof obj === "object") {
    const result: any = {};
    for (const [key, value] of Object.entries(obj)) {
      result[key] = processObjectRecursively(value, processor);
    }
    return result;
  }

  return processor(obj);
}

/**
 * Substitute variables in a string value
 */
function substituteStringVariables(value: string, baseDir: string): string {
  return value.replace(/\{(env|file):([^}]+)\}/g, (match, type, key) => {
    try {
      switch (type) {
        case "env":
          return process.env[key] || "";
        case "file":
          return readFileVariable(key, baseDir);
        default:
          return match; // Return original if unknown type
      }
    } catch (error) {
      console.warn(`Failed to substitute variable ${match}:`, error);
      return match; // Return original on error
    }
  });
}

/**
 * Read file for variable substitution
 */
function readFileVariable(filePath: string, baseDir: string): string {
  let resolvedPath: string;

  if (filePath.startsWith("~/")) {
    // Handle home directory
    resolvedPath = resolve(
      process.env.HOME || process.cwd(),
      filePath.slice(2)
    );
  } else if (filePath.startsWith("/")) {
    // Handle absolute path
    resolvedPath = filePath;
  } else {
    // Handle relative path
    resolvedPath = resolve(baseDir, filePath);
  }

  if (!existsSync(resolvedPath)) {
    throw new Error(`File not found: ${resolvedPath}`);
  }

  return readFileSync(resolvedPath, "utf-8").trim();
}

/**
 * Merge configuration with defaults
 */
function mergeWithDefaults(config: OpenCodeConfig): OpenCodeConfig {
  return {
    ...DEFAULT_CONFIG,
    ...config,
    // Deep merge nested objects
    compaction: {
      ...DEFAULT_CONFIG.compaction,
      ...config.compaction,
    },
    server: {
      ...config.server,
    },
    provider: {
      ...config.provider,
    },
    mcp: {
      ...config.mcp,
    },
    tools: {
      ...config.tools,
    },
    agent: {
      ...config.agent,
    },
    command: {
      ...config.command,
    },
  };
}

/**
 * Validate configuration structure (basic validation)
 */
export function validateConfig(config: OpenCodeConfig): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  // Validate required schema
  if (config.$schema && !config.$schema.includes("opencode.ai/config.json")) {
    errors.push("Invalid schema reference");
  }

  // Validate environment references
  if (config.share && !["manual", "auto", "disabled"].includes(config.share)) {
    errors.push(
      "Invalid share setting. Must be 'manual', 'auto', or 'disabled'"
    );
  }

  // Validate MCP servers
  if (config.mcp) {
    for (const [name, serverConfig] of Object.entries(config.mcp)) {
      if (
        !serverConfig.type ||
        !["local", "remote"].includes(serverConfig.type)
      ) {
        errors.push(
          `Invalid MCP server type for '${name}'. Must be 'local' or 'remote'`
        );
      }

      if (serverConfig.type === "local" && !serverConfig.command) {
        errors.push(
          `MCP server '${name}' is missing required 'command' property`
        );
      }

      if (serverConfig.type === "remote" && !serverConfig.url) {
        errors.push(`MCP server '${name}' is missing required 'url' property`);
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
