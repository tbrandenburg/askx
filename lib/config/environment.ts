import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { loadConfig } from "./loader";
import type {
  ConfigWithEnvironment,
  EnvironmentName,
  OpenCodeConfig,
} from "./types";

/**
 * Environment-Based Configuration Manager
 * Handles loading different configurations based on environment variables
 */
export class EnvironmentConfigManager {
  private readonly workingDirectory: string;
  private readonly environmentName: EnvironmentName;
  private readonly customEnvironment?: string;

  constructor(workingDirectory?: string, environment?: string) {
    this.workingDirectory = workingDirectory || process.cwd();
    this.customEnvironment = environment;
    this.environmentName = this.determineEnvironment();
  }

  /**
   * Determine the current environment
   */
  private determineEnvironment(): EnvironmentName {
    // Priority: custom > NODE_ENV > ENVIRONMENT > default
    const envString =
      this.customEnvironment ||
      process.env.NODE_ENV ||
      process.env.ENVIRONMENT ||
      "development";

    // Map common environment names to our types
    switch (envString.toLowerCase()) {
      case "prod":
      case "production":
        return "production";
      case "dev":
      case "development":
        return "development";
      case "test":
      case "testing":
        return "test";
      case "stage":
      case "staging":
        return "staging";
      default:
        console.warn(
          `Unknown environment "${envString}", defaulting to development`
        );
        return "development";
    }
  }

  /**
   * Get the current environment name
   */
  getEnvironment(): EnvironmentName {
    return this.environmentName;
  }

  /**
   * Load configuration with environment-specific overrides
   */
  loadConfiguration(): OpenCodeConfig {
    const configPaths = this.getConfigFilePaths();
    let baseConfig: OpenCodeConfig = {};
    let hasLoadedConfig = false;

    // Try to load configuration files in priority order
    for (const configPath of configPaths) {
      try {
        if (existsSync(configPath)) {
          console.log(`Loading configuration from: ${configPath}`);
          const result = loadConfig(configPath);
          const loadedConfig = result.config;

          if (this.isEnvironmentConfig(loadedConfig)) {
            // Handle environment-specific configuration structure
            baseConfig = this.extractEnvironmentConfig(loadedConfig);
          } else {
            // Handle flat configuration structure
            baseConfig = loadedConfig;
          }

          hasLoadedConfig = true;
          break; // Use first found config file
        }
      } catch (error) {
        console.error(
          `Failed to load configuration from ${configPath}:`,
          error
        );
      }
    }

    // If no config file found, try loading default config
    if (!hasLoadedConfig) {
      console.warn("No configuration file found, using defaults");
      baseConfig = this.getDefaultConfiguration();
    }

    // Apply environment-specific variable substitutions
    return this.applyEnvironmentSubstitutions(baseConfig);
  }

  /**
   * Get configuration file paths in priority order
   */
  private getConfigFilePaths(): string[] {
    const baseName = "config";
    const extensions = [".json", ".jsonc"];
    const paths: string[] = [];

    // 1. Environment-specific config files (highest priority)
    for (const ext of extensions) {
      paths.push(
        resolve(
          this.workingDirectory,
          `${baseName}.${this.environmentName}${ext}`
        )
      );
      paths.push(
        resolve(
          this.workingDirectory,
          `${baseName}-${this.environmentName}${ext}`
        )
      );
    }

    // 2. Generic config files
    for (const ext of extensions) {
      paths.push(resolve(this.workingDirectory, `${baseName}${ext}`));
    }

    // 3. Hidden config files
    for (const ext of extensions) {
      paths.push(resolve(this.workingDirectory, `.${baseName}${ext}`));
      paths.push(
        resolve(
          this.workingDirectory,
          `.${baseName}.${this.environmentName}${ext}`
        )
      );
    }

    // 4. Config directory
    const configDir = resolve(this.workingDirectory, "config");
    if (existsSync(configDir)) {
      for (const ext of extensions) {
        paths.push(resolve(configDir, `${this.environmentName}${ext}`));
        paths.push(resolve(configDir, `${baseName}${ext}`));
      }
    }

    return paths;
  }

  /**
   * Check if configuration uses environment-specific structure
   */
  private isEnvironmentConfig(config: any): config is ConfigWithEnvironment {
    if (!config || typeof config !== "object") {
      return false;
    }

    const environmentKeys = ["development", "production", "test", "staging"];
    return environmentKeys.some((env) => env in config);
  }

  /**
   * Extract configuration for current environment
   */
  private extractEnvironmentConfig(
    envConfig: ConfigWithEnvironment
  ): OpenCodeConfig {
    // Get environment-specific config
    const environmentConfig = envConfig[this.environmentName];

    if (!environmentConfig) {
      console.warn(
        `No configuration found for environment "${this.environmentName}", using default fallback`
      );
      return envConfig.default || {};
    }

    // Merge with default configuration if it exists
    const defaultConfig = envConfig.default || {};

    return {
      ...defaultConfig,
      ...environmentConfig,
      // Deep merge specific sections
      provider: {
        ...defaultConfig.provider,
        ...environmentConfig.provider,
      },
      mcp: {
        ...defaultConfig.mcp,
        ...environmentConfig.mcp,
      },
      agent: {
        ...defaultConfig.agent,
        ...environmentConfig.agent,
      },
      command: {
        ...defaultConfig.command,
        ...environmentConfig.command,
      },
    };
  }

  /**
   * Apply environment variable substitutions
   */
  private applyEnvironmentSubstitutions(
    config: OpenCodeConfig
  ): OpenCodeConfig {
    return JSON.parse(
      JSON.stringify(config, null, 2).replace(
        /\{env:([^}]+)\}/g,
        (match, envVar) => {
          const value = process.env[envVar];
          if (value === undefined) {
            console.warn(
              `Environment variable ${envVar} not found, keeping placeholder`
            );
            return match;
          }
          return value;
        }
      )
    );
  }

  /**
   * Get default configuration for when no config file is found
   */
  private getDefaultConfiguration(): OpenCodeConfig {
    return {
      provider: {
        openai: {
          options: {
            apiKey: "{env:OPENAI_API_KEY}",
            baseURL: "https://api.openai.com/v1",
          },
          models: {
            "gpt-4o": {
              maxTokens: 4096,
            },
            "gpt-4o-mini": {
              maxTokens: 4096,
            },
          },
        },
      },
      skills: {
        directory: "./skills",
        enabled: true,
      },
    };
  }

  /**
   * Get configuration for a specific environment (for testing/debugging)
   */
  loadConfigurationForEnvironment(
    environment: EnvironmentName
  ): OpenCodeConfig {
    const originalEnv = this.environmentName;
    // Temporarily change environment
    (this as any).environmentName = environment;

    try {
      const config = this.loadConfiguration();
      return config;
    } finally {
      // Restore original environment
      (this as any).environmentName = originalEnv;
    }
  }

  /**
   * Get available configuration files (for debugging)
   */
  getAvailableConfigFiles(): Array<{ path: string; exists: boolean }> {
    const paths = this.getConfigFilePaths();
    return paths.map((path) => ({
      path,
      exists: existsSync(path),
    }));
  }

  /**
   * Validate environment configuration
   */
  validateEnvironmentSetup(): EnvironmentValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check if environment is explicitly set
    if (!process.env.NODE_ENV && !process.env.ENVIRONMENT) {
      warnings.push(
        "No environment variable set (NODE_ENV or ENVIRONMENT), using development"
      );
    }

    // Check for available config files
    const availableFiles = this.getAvailableConfigFiles();
    const existingFiles = availableFiles.filter((f) => f.exists);

    if (existingFiles.length === 0) {
      warnings.push("No configuration files found, will use defaults");
    }

    // Check for environment-specific config
    const hasEnvSpecificConfig = existingFiles.some(
      (f) =>
        f.path.includes(`.${this.environmentName}`) ||
        f.path.includes(`-${this.environmentName}`)
    );

    if (!hasEnvSpecificConfig && existingFiles.length > 0) {
      warnings.push(`No ${this.environmentName}-specific configuration found`);
    }

    // Check working directory
    if (!existsSync(this.workingDirectory)) {
      errors.push(`Working directory does not exist: ${this.workingDirectory}`);
    }

    return {
      valid: errors.length === 0,
      environment: this.environmentName,
      workingDirectory: this.workingDirectory,
      availableConfigFiles: existingFiles.length,
      hasEnvironmentSpecificConfig: hasEnvSpecificConfig,
      errors,
      warnings,
    };
  }
}

/**
 * Environment Validation Result
 */
export interface EnvironmentValidationResult {
  valid: boolean;
  environment: EnvironmentName;
  workingDirectory: string;
  availableConfigFiles: number;
  hasEnvironmentSpecificConfig: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Load configuration with automatic environment detection
 */
export function loadEnvironmentConfig(
  workingDirectory?: string
): OpenCodeConfig {
  const manager = new EnvironmentConfigManager(workingDirectory);
  return manager.loadConfiguration();
}

/**
 * Load configuration for a specific environment
 */
export function loadEnvironmentConfigForEnvironment(
  environment: EnvironmentName,
  workingDirectory?: string
): OpenCodeConfig {
  const manager = new EnvironmentConfigManager(workingDirectory);
  return manager.loadConfigurationForEnvironment(environment);
}

/**
 * Get current environment name
 */
export function getCurrentEnvironment(): EnvironmentName {
  const manager = new EnvironmentConfigManager();
  return manager.getEnvironment();
}

/**
 * Validate environment setup
 */
export function validateEnvironmentSetup(
  workingDirectory?: string
): EnvironmentValidationResult {
  const manager = new EnvironmentConfigManager(workingDirectory);
  return manager.validateEnvironmentSetup();
}
